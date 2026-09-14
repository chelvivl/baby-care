export type FeedingKind = 'formula' | 'water'

export type FeedingEvent = {
  id: string
  babyId: string
  kind: FeedingKind
  /** ISO timestamp when feeding happened */
  fedAt: string
  amountMl: number
  createdAt: string
}

export type FeedingSettings = {
  /** Default volume for quick add */
  defaultAmountMl: number
  /** Hours between feedings (supports fractions, e.g. 3.5) */
  intervalHours: number
  /** Minutes before next feeding to notify */
  notifyBeforeMinutes: number
  /** User wants reminders */
  notificationsEnabled: boolean
}

export type FeedingState = {
  events: FeedingEvent[]
  settings: FeedingSettings
}

export const FEEDING_KIND_LABELS: Record<FeedingKind, string> = {
  formula: 'Смесь',
  water: 'Вода',
}

export const DEFAULT_FEEDING_SETTINGS: FeedingSettings = {
  defaultAmountMl: 120,
  intervalHours: 3.5,
  notifyBeforeMinutes: 20,
  notificationsEnabled: true,
}

export function createFeedingId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `feed-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function feedingIntervalMs(settings: FeedingSettings): number {
  return Math.max(0, settings.intervalHours) * 60 * 60_000
}

export function feedingNotifyLeadMs(settings: FeedingSettings): number {
  return Math.max(0, settings.notifyBeforeMinutes) * 60_000
}

/** When the next feeding is due after a given feeding time. */
export function nextFeedingDueAt(
  lastFedAtIso: string,
  settings: FeedingSettings,
): Date {
  return new Date(
    new Date(lastFedAtIso).getTime() + feedingIntervalMs(settings),
  )
}

/** When to fire the reminder before the next due feeding. */
export function nextReminderAt(
  lastFedAtIso: string,
  settings: FeedingSettings,
): Date {
  const due = nextFeedingDueAt(lastFedAtIso, settings)
  return new Date(due.getTime() - feedingNotifyLeadMs(settings))
}

export function formatAmountMl(ml: number): string {
  return `${Math.round(ml)} мл`
}

export function formatIntervalHours(hours: number): string {
  const whole = Math.floor(hours)
  const minutes = Math.round((hours - whole) * 60)
  if (whole <= 0 && minutes > 0) {
    return `${minutes} мин`
  }
  if (minutes === 0) {
    return `${whole} ч`
  }
  if (whole === 0) {
    return `${minutes} мин`
  }
  return `${whole} ч ${minutes} мин`
}
