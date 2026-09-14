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
      ? parsed.sessions.filter(isSession).map(normalizeSession)
      : []
    const activeTimer = isActiveTimer(parsed.activeTimer) ? parsed.activeTimer : null
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

  return {
    ...state,
    activeTimer: {
      ...timer,
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

  let elapsed = timer.accumulatedMs
  if (!timer.pausedAt) {
    elapsed += Math.max(0, now.getTime() - new Date(timer.segmentStartedAt).getTime())
  }

  if (elapsed < 30_000) {
    return { ...state, activeTimer: null }
  }

  const session: SleepSession = {
    id: createSleepId(),
    babyId: timer.babyId,
    kind: timer.kind,
    startAt: timer.startedAt,
    endAt: now.toISOString(),
    durationMs: elapsed,
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

function isSession(value: unknown): value is SleepSession {
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
