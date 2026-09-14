export type SleepKind = 'day' | 'night'

export type SleepSource = 'timer' | 'manual'

export type SleepSession = {
  id: string
  babyId: string
  kind: SleepKind
  /** ISO timestamp — wall-clock start */
  startAt: string
  /** ISO timestamp — wall-clock end */
  endAt: string
  /** Actual sleep length (excludes timer pauses) */
  durationMs: number
  source: SleepSource
  createdAt: string
}

/** Live timer — one per device, tied to a baby. */
export type ActiveSleepTimer = {
  babyId: string
  kind: SleepKind
  /** Wall-clock start of this sleep */
  startedAt: string
  /** When the current running segment started */
  segmentStartedAt: string
  /** Already accumulated while paused previously */
  accumulatedMs: number
  /** If set, timer is paused */
  pausedAt: string | null
}

export type SleepState = {
  sessions: SleepSession[]
  activeTimer: ActiveSleepTimer | null
}

export const SLEEP_KIND_LABELS: Record<SleepKind, string> = {
  day: 'Дневной',
  night: 'Ночной',
}

export function createSleepId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `sleep-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function sessionDurationMs(session: SleepSession): number {
  return Math.max(0, session.durationMs)
}

export function timerElapsedMs(timer: ActiveSleepTimer, now = Date.now()): number {
  const runningMs =
    timer.pausedAt === null
      ? Math.max(0, now - new Date(timer.segmentStartedAt).getTime())
      : 0
  return timer.accumulatedMs + runningMs
}
