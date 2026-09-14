import {
  createFeedingId,
  DEFAULT_FEEDING_SETTINGS,
  type FeedingEvent,
  type FeedingKind,
  type FeedingSettings,
  type FeedingState,
} from '../domain/feeding'
import { toLocalDateKey } from '../domain/time'

const STORAGE_KEY = 'baby-care.feeding.v1'

const EMPTY: FeedingState = {
  events: [],
  settings: DEFAULT_FEEDING_SETTINGS,
}

export function loadFeedingState(): FeedingState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return EMPTY
    }
    const parsed = JSON.parse(raw) as Partial<FeedingState>
    const events = Array.isArray(parsed.events)
      ? parsed.events.filter(isEventLike).map(normalizeEvent)
      : []
    return {
      events,
      settings: normalizeSettings(parsed.settings),
    }
  } catch {
    return EMPTY
  }
}

export function saveFeedingState(state: FeedingState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function addFeedingEvent(
  state: FeedingState,
  input: {
    babyId: string
    kind: FeedingKind
    fedAt: string
    amountMl: number
  },
): FeedingState {
  const event: FeedingEvent = {
    id: createFeedingId(),
    babyId: input.babyId,
    kind: input.kind,
    fedAt: input.fedAt,
    amountMl: Math.max(0, Math.round(input.amountMl)),
    createdAt: new Date().toISOString(),
  }

  return {
    ...state,
    events: [event, ...state.events],
  }
}

export function updateFeedingEvent(
  state: FeedingState,
  id: string,
  input: {
    kind: FeedingKind
    fedAt: string
    amountMl: number
  },
): FeedingState {
  return {
    ...state,
    events: state.events.map((event) =>
      event.id === id
        ? {
            ...event,
            kind: input.kind,
            fedAt: input.fedAt,
            amountMl: Math.max(0, Math.round(input.amountMl)),
          }
        : event,
    ),
  }
}

export function removeFeedingEvent(state: FeedingState, id: string): FeedingState {
  return {
    ...state,
    events: state.events.filter((event) => event.id !== id),
  }
}

export function updateFeedingSettings(
  state: FeedingState,
  patch: Partial<FeedingSettings>,
): FeedingState {
  return {
    ...state,
    settings: normalizeSettings({ ...state.settings, ...patch }),
  }
}

export function eventsForBabyDay(
  events: FeedingEvent[],
  babyId: string,
  dayKey: string,
): FeedingEvent[] {
  return events
    .filter((event) => event.babyId === babyId)
    .filter((event) => toLocalDateKey(new Date(event.fedAt)) === dayKey)
    .sort(
      (a, b) => new Date(b.fedAt).getTime() - new Date(a.fedAt).getTime(),
    )
}

export function totalMlForBabyDay(
  events: FeedingEvent[],
  babyId: string,
  dayKey: string,
): number {
  return eventsForBabyDay(events, babyId, dayKey).reduce(
    (sum, event) => sum + Math.max(0, event.amountMl),
    0,
  )
}

export function latestFeedingForBaby(
  events: FeedingEvent[],
  babyId: string,
): FeedingEvent | null {
  let latest: FeedingEvent | null = null
  for (const event of events) {
    if (event.babyId !== babyId) {
      continue
    }
    if (
      !latest ||
      new Date(event.fedAt).getTime() > new Date(latest.fedAt).getTime()
    ) {
      latest = event
    }
  }
  return latest
}

function isEventLike(value: unknown): value is FeedingEvent {
  if (!value || typeof value !== 'object') {
    return false
  }
  const event = value as FeedingEvent
  return (
    typeof event.id === 'string' &&
    typeof event.babyId === 'string' &&
    (event.kind === 'formula' || event.kind === 'water') &&
    typeof event.fedAt === 'string' &&
    typeof event.amountMl === 'number' &&
    typeof event.createdAt === 'string'
  )
}

function normalizeEvent(event: FeedingEvent): FeedingEvent {
  return {
    id: event.id,
    babyId: event.babyId,
    kind: event.kind,
    fedAt: event.fedAt,
    amountMl: Math.max(0, Math.round(event.amountMl)),
    createdAt: event.createdAt,
  }
}

function normalizeSettings(value: unknown): FeedingSettings {
  const raw =
    value && typeof value === 'object'
      ? (value as Partial<FeedingSettings>)
      : {}

  const defaultAmountMl = clampNumber(
    raw.defaultAmountMl,
    DEFAULT_FEEDING_SETTINGS.defaultAmountMl,
    1,
    1000,
  )
  const intervalHours = clampNumber(
    raw.intervalHours,
    DEFAULT_FEEDING_SETTINGS.intervalHours,
    0.5,
    24,
  )
  const notifyBeforeMinutes = clampNumber(
    raw.notifyBeforeMinutes,
    DEFAULT_FEEDING_SETTINGS.notifyBeforeMinutes,
    0,
    180,
  )

  return {
    defaultAmountMl: Math.round(defaultAmountMl),
    intervalHours: Math.round(intervalHours * 100) / 100,
    notifyBeforeMinutes: Math.round(notifyBeforeMinutes),
    notificationsEnabled:
      typeof raw.notificationsEnabled === 'boolean'
        ? raw.notificationsEnabled
        : DEFAULT_FEEDING_SETTINGS.notificationsEnabled,
  }
}

function clampNumber(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback
  }
  return Math.min(max, Math.max(min, value))
}
