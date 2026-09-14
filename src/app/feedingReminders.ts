import {
  formatIntervalHours,
  nextFeedingDueAt,
  nextReminderAt,
  type FeedingSettings,
} from '../domain/feeding'
import { formatTimeRu } from '../domain/time'
import {
  ensureNotificationPermission,
  notificationsSupported,
} from './notifications'

const REMINDER_TAG = 'baby-care-feeding-reminder'

let timeoutId: number | null = null
let firedKey: string | null = null

export function clearFeedingReminder(): void {
  if (timeoutId !== null) {
    window.clearTimeout(timeoutId)
    timeoutId = null
  }
}

export async function syncFeedingReminder(input: {
  lastFedAt: string | null
  settings: FeedingSettings
  babyName?: string | null
}): Promise<void> {
  clearFeedingReminder()

  if (
    !input.lastFedAt ||
    !input.settings.notificationsEnabled ||
    !notificationsSupported()
  ) {
    return
  }

  const permission = await ensureNotificationPermission()
  if (permission !== 'granted') {
    return
  }

  const reminderAt = nextReminderAt(input.lastFedAt, input.settings)
  const dueAt = nextFeedingDueAt(input.lastFedAt, input.settings)
  const delay = reminderAt.getTime() - Date.now()
  const key = `${input.lastFedAt}|${reminderAt.toISOString()}`

  if (delay <= 0) {
    if (Date.now() < dueAt.getTime() && firedKey !== key) {
      firedKey = key
      await showFeedingReminder({
        babyName: input.babyName,
        dueAt,
        settings: input.settings,
      })
    }
    return
  }

  // setTimeout is capped ~24d in browsers; clamp to a safe window.
  const safeDelay = Math.min(delay, 24 * 60 * 60_000)
  timeoutId = window.setTimeout(() => {
    void (async () => {
      if (firedKey === key) {
        return
      }
      firedKey = key
      await showFeedingReminder({
        babyName: input.babyName,
        dueAt,
        settings: input.settings,
      })
    })()
  }, safeDelay)
}

async function showFeedingReminder(input: {
  babyName?: string | null
  dueAt: Date
  settings: FeedingSettings
}): Promise<void> {
  const dueTime = formatTimeRu(input.dueAt.toISOString())
  const interval = formatIntervalHours(input.settings.intervalHours)
  const title = 'Скоро кормление'
  const body = input.babyName
    ? `${input.babyName}: следующее кормление около ${dueTime} (каждые ${interval})`
    : `Следующее кормление около ${dueTime} (каждые ${interval})`
  const icon = `${import.meta.env.BASE_URL}apple-touch-icon.svg`

  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body,
        icon,
        badge: icon,
        tag: REMINDER_TAG,
      })
      return
    }
  } catch {
    // Fall through.
  }

  try {
    const notification = new Notification(title, {
      body,
      icon,
      tag: REMINDER_TAG,
    })
    window.setTimeout(() => notification.close(), 12_000)
  } catch {
    // Ignore.
  }
}
