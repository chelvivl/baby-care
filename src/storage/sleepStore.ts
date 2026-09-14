import {
  createSleepId,
  type ActiveSleepTimer,
  type SleepKind,
  type SleepSession,
  type SleepState,
} from '../domain/sleep'
import { toLocalDateKey } from '../domain/time'

const STORAGE_KEY = 'baby-care.sleep.v1'

const EMPTY: SleepState = {
  sessions: [],
  activeTimer: null,
}

export function loadSleepState(): SleepState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return EMPTY
    }
    const parsed = JSON.parse(raw) as Partial<SleepState>
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.filter(isSessionLike).map(normalizeSession)
      : []
    const activeTimer = isActiveTimer(parsed.activeTimer) ? normalizeTimer(parsed.activeTimer) : null
    return { sessions, activeTimer }
  } catch {
    return EMPTY
  }
}

export function saveSleepState(state: SleepState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function startTimer(
  state: SleepState,
  input: { babyId: string; kind: SleepKind },
  now = new Date(),
): SleepState {
  if (state.activeTimer) {
    return state
  }

  const iso = now.toISOString()
  const activeTimer: ActiveSleepTimer = {
    babyId: input.babyId,
    kind: input.kind,
    startedAt: iso,
    segmentStartedAt: iso,
    accumulatedMs: 0,
    pausedMs: 0,
    pauseCount: 0,
    pausedAt: null,
  }

  return { ...state, activeTimer }
}

export function pauseTimer(state: SleepState, now = new Date()): SleepState {
  const timer = state.activeTimer
  if (!timer || timer.pausedAt) {
    return state
  }

  const segmentMs = Math.max(0, now.getTime() - new Date(timer.segmentStartedAt).getTime())
  return {
    ...state,
    activeTimer: {
      ...timer,
      accumulatedMs: timer.accumulatedMs + segmentMs,
      pausedAt: now.toISOString(),
    },
  }
}

export function resumeTimer(state: SleepState, now = new Date()): SleepState {
  const timer = state.activeTimer
  if (!timer || !timer.pausedAt) {
    return state
  }

  const pauseSegmentMs = Math.max(0, now.getTime() - new Date(timer.pausedAt).getTime())
  return {
    ...state,
    activeTimer: {
      ...timer,
      pausedMs: timer.pausedMs + pauseSegmentMs,
      pauseCount: timer.pauseCount + 1,
      pausedAt: null,
      segmentStartedAt: now.toISOString(),
    },
  }
}

export function stopTimer(state: SleepState, now = new Date()): SleepState {
  const timer = state.activeTimer
  if (!timer) {
    return state
  }

  let sleepMs = timer.accumulatedMs
  let pausedMs = timer.pausedMs
  let pauseCount = timer.pauseCount

  if (timer.pausedAt) {
    pausedMs += Math.max(0, now.getTime() - new Date(timer.pausedAt).getTime())
    pauseCount += 1
  } else {
    sleepMs += Math.max(0, now.getTime() - new Date(timer.segmentStartedAt).getTime())
  }

  if (sleepMs < 1_000 && pausedMs < 1_000) {
    return { ...state, activeTimer: null }
  }

  const session: SleepSession = {
    id: createSleepId(),
    babyId: timer.babyId,
    kind: timer.kind,
    startAt: timer.startedAt,
    endAt: now.toISOString(),
    durationMs: sleepMs,
    pausedMs,
    pauseCount,
    source: 'timer',
    createdAt: now.toISOString(),
  }

  return {
    sessions: [session, ...state.sessions],
    activeTimer: null,
  }
}

export function addManualSession(
  state: SleepState,
  input: {
    babyId: string
    kind: SleepKind
    startAt: string
    endAt: string
  },
): SleepState {
  const durationMs = Math.max(
    0,
    new Date(input.endAt).getTime() - new Date(input.startAt).getTime(),
  )

  const session: SleepSession = {
    id: createSleepId(),
    babyId: input.babyId,
    kind: input.kind,
    startAt: input.startAt,
    endAt: input.endAt,
    durationMs,
    pausedMs: 0,
    pauseCount: 0,
    source: 'manual',
    createdAt: new Date().toISOString(),
  }

  return {
    ...state,
    sessions: [session, ...state.sessions],
  }
}

export function updateSession(
  state: SleepState,
  id: string,
  input: {
    kind: SleepKind
    startAt: string
    endAt: string
  },
): SleepState {
  const durationMs = Math.max(
    0,
    new Date(input.endAt).getTime() - new Date(input.startAt).getTime(),
  )

  return {
    ...state,
    sessions: state.sessions.map((session) =>
      session.id === id
        ? {
            ...session,
            kind: input.kind,
            startAt: input.startAt,
            endAt: input.endAt,
            durationMs,
            // Manual edit resets pause stats — wall span is the sleep length.
            pausedMs: 0,
            pauseCount: 0,
            source: session.source === 'timer' ? 'manual' : session.source,
          }
        : session,
    ),
  }
}

export function removeSession(state: SleepState, id: string): SleepState {
  return {
    ...state,
    sessions: state.sessions.filter((session) => session.id !== id),
  }
}

export function sessionsForBabyDay(
  sessions: SleepSession[],
  babyId: string,
  dayKey: string,
): SleepSession[] {
  return sessions
    .filter((session) => session.babyId === babyId)
    .filter((session) => toLocalDateKey(new Date(session.startAt)) === dayKey)
    .sort(
      (a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime(),
    )
}

export function totalSleepMsForBabyDay(
  sessions: SleepSession[],
  babyId: string,
  dayKey: string,
): number {
  return sessionsForBabyDay(sessions, babyId, dayKey).reduce(
    (sum, session) => sum + Math.max(0, session.durationMs),
    0,
  )
}

function isSessionLike(value: unknown): value is SleepSession {
  if (!value || typeof value !== 'object') {
    return false
  }
  const session = value as SleepSession
  return (
    typeof session.id === 'string' &&
    typeof session.babyId === 'string' &&
    (session.kind === 'day' || session.kind === 'night') &&
    typeof session.startAt === 'string' &&
    typeof session.endAt === 'string' &&
    typeof session.durationMs === 'number' &&
    (session.source === 'timer' || session.source === 'manual') &&
    typeof session.createdAt === 'string'
  )
}

function normalizeSession(session: SleepSession): SleepSession {
  return {
    id: session.id,
    babyId: session.babyId,
    kind: session.kind,
    startAt: session.startAt,
    endAt: session.endAt,
    durationMs: session.durationMs,
    pausedMs: typeof session.pausedMs === 'number' ? session.pausedMs : 0,
    pauseCount: typeof session.pauseCount === 'number' ? session.pauseCount : 0,
    source: session.source,
    createdAt: session.createdAt,
  }
}

function isActiveTimer(value: unknown): value is ActiveSleepTimer {
  if (!value || typeof value !== 'object') {
    return false
  }
  const timer = value as ActiveSleepTimer
  return (
    typeof timer.babyId === 'string' &&
    (timer.kind === 'day' || timer.kind === 'night') &&
    typeof timer.startedAt === 'string' &&
    typeof timer.segmentStartedAt === 'string' &&
    typeof timer.accumulatedMs === 'number' &&
    (timer.pausedAt === null || typeof timer.pausedAt === 'string')
  )
}

function normalizeTimer(timer: ActiveSleepTimer): ActiveSleepTimer {
  return {
    babyId: timer.babyId,
    kind: timer.kind,
    startedAt: timer.startedAt,
    segmentStartedAt: timer.segmentStartedAt,
    accumulatedMs: timer.accumulatedMs,
    pausedMs: typeof timer.pausedMs === 'number' ? timer.pausedMs : 0,
    pauseCount: typeof timer.pauseCount === 'number' ? timer.pauseCount : 0,
    pausedAt: timer.pausedAt,
  }
}
