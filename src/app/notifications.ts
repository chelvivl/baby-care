import { SLEEP_KIND_LABELS, type SleepKind } from '../domain/sleep'

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export async function ensureNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) {
    return 'denied'
  }
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  return Notification.requestPermission()
}

export async function notifySleepStarted(
  kind: SleepKind,
  babyName?: string | null,
): Promise<void> {
  if (!notificationsSupported()) {
    return
  }

  const permission = await ensureNotificationPermission()
  if (permission !== 'granted') {
    return
  }

  const title = `${SLEEP_KIND_LABELS[kind]} сон начался`
  const body = babyName
    ? `${babyName}: таймер запущен`
    : 'Таймер сна запущен'

  const icon = `${import.meta.env.BASE_URL}apple-touch-icon.svg`

  try {
    const registration = await navigator.serviceWorker?.getRegistration()
    if (registration?.showNotification) {
      await registration.showNotification(title, {
        body,
        icon,
        badge: icon,
        tag: 'baby-care-sleep-started',
      })
      return
    }
  } catch {
    // Fall through to page Notification.
  }

  try {
    const notification = new Notification(title, {
      body,
      icon,
      tag: 'baby-care-sleep-started',
    })
    window.setTimeout(() => notification.close(), 8_000)
  } catch {
    // Some browsers block Notification constructor even after grant.
  }
}
