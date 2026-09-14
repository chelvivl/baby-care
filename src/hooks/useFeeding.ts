import { useCallback, useEffect, useMemo, useState } from 'react'
import type { FeedingEvent, FeedingKind, FeedingSettings } from '../domain/feeding'
import { nextFeedingDueAt, nextReminderAt } from '../domain/feeding'
import { syncFeedingReminder } from '../app/feedingReminders'
import {
  addFeedingEvent,
  eventsForBabyDay,
  latestFeedingForBaby,
  loadFeedingState,
  removeFeedingEvent,
  saveFeedingState,
  totalMlForBabyDay,
  updateFeedingEvent,
  updateFeedingSettings,
} from '../storage/feedingStore'

export function useFeeding(babyId: string | null, babyName?: string | null) {
  const [state, setState] = useState(() => loadFeedingState())

  useEffect(() => {
    saveFeedingState(state)
  }, [state])

  const babyEvents = useMemo(
    () =>
      babyId
        ? state.events.filter((event) => event.babyId === babyId)
        : [],
    [state.events, babyId],
  )

  const latest = useMemo(
    () => (babyId ? latestFeedingForBaby(state.events, babyId) : null),
    [babyId, state.events],
  )

  useEffect(() => {
    void syncFeedingReminder({
      lastFedAt: latest?.fedAt ?? null,
      settings: state.settings,
      babyName,
    })
  }, [latest?.fedAt, state.settings, babyName])

  const add = useCallback(
    (input: { kind: FeedingKind; fedAt: string; amountMl: number }) => {
      if (!babyId) {
        return
      }
      setState((prev) =>
        addFeedingEvent(prev, {
          babyId,
          kind: input.kind,
          fedAt: input.fedAt,
          amountMl: input.amountMl,
        }),
      )
    },
    [babyId],
  )

  const update = useCallback(
    (
      id: string,
      input: { kind: FeedingKind; fedAt: string; amountMl: number },
    ) => {
      setState((prev) => updateFeedingEvent(prev, id, input))
    },
    [],
  )

  const remove = useCallback((id: string) => {
    setState((prev) => removeFeedingEvent(prev, id))
  }, [])

  const updateSettings = useCallback((patch: Partial<FeedingSettings>) => {
    setState((prev) => updateFeedingSettings(prev, patch))
  }, [])

  const forDay = useCallback(
    (dayKey: string): FeedingEvent[] => {
      if (!babyId) {
        return []
      }
      return eventsForBabyDay(state.events, babyId, dayKey)
    },
    [babyId, state.events],
  )

  const totalMlForDay = useCallback(
    (dayKey: string): number => {
      if (!babyId) {
        return 0
      }
      return totalMlForBabyDay(state.events, babyId, dayKey)
    },
    [babyId, state.events],
  )

  const schedule = useMemo(() => {
    if (!latest) {
      return null
    }
    return {
      dueAt: nextFeedingDueAt(latest.fedAt, state.settings),
      remindAt: nextReminderAt(latest.fedAt, state.settings),
    }
  }, [latest, state.settings])

  return {
    events: babyEvents,
    settings: state.settings,
    latest,
    schedule,
    add,
    update,
    remove,
    updateSettings,
    forDay,
    totalMlForDay,
  }
}
