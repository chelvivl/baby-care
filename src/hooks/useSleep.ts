import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SleepKind, SleepSession } from '../domain/sleep'
import {
  addManualSession,
  loadSleepState,
  pauseTimer,
  removeSession,
  resumeTimer,
  saveSleepState,
  sessionsForBabyDay,
  startTimer,
  stopTimer,
  totalSleepMsForBabyDay,
  updateSession,
} from '../storage/sleepStore'

export function useSleep(babyId: string | null) {
  const [state, setState] = useState(() => loadSleepState())

  useEffect(() => {
    saveSleepState(state)
  }, [state])

  const activeTimer =
    babyId && state.activeTimer?.babyId === babyId ? state.activeTimer : null

  const babySessions = useMemo(
    () =>
      babyId
        ? state.sessions.filter((session) => session.babyId === babyId)
        : [],
    [state.sessions, babyId],
  )

  const start = useCallback(
    (kind: SleepKind) => {
      if (!babyId) {
        return
      }
      setState((prev) => startTimer(prev, { babyId, kind }))
    },
    [babyId],
  )

  const pause = useCallback(() => {
    setState((prev) => pauseTimer(prev))
  }, [])

  const resume = useCallback(() => {
    setState((prev) => resumeTimer(prev))
  }, [])

  const stop = useCallback(() => {
    setState((prev) => stopTimer(prev))
  }, [])

  const addManual = useCallback(
    (input: { kind: SleepKind; startAt: string; endAt: string }) => {
      if (!babyId) {
        return
      }
      setState((prev) =>
        addManualSession(prev, {
          babyId,
          kind: input.kind,
          startAt: input.startAt,
          endAt: input.endAt,
        }),
      )
    },
    [babyId],
  )

  const update = useCallback(
    (id: string, input: { kind: SleepKind; startAt: string; endAt: string }) => {
      setState((prev) => updateSession(prev, id, input))
    },
    [],
  )

  const remove = useCallback((id: string) => {
    setState((prev) => removeSession(prev, id))
  }, [])

  const forDay = useCallback(
    (dayKey: string): SleepSession[] => {
      if (!babyId) {
        return []
      }
      return sessionsForBabyDay(state.sessions, babyId, dayKey)
    },
    [babyId, state.sessions],
  )

  const totalForDay = useCallback(
    (dayKey: string): number => {
      if (!babyId) {
        return 0
      }
      return totalSleepMsForBabyDay(state.sessions, babyId, dayKey)
    },
    [babyId, state.sessions],
  )

  return {
    sessions: babySessions,
    activeTimer,
    foreignTimer:
      state.activeTimer && state.activeTimer.babyId !== babyId
        ? state.activeTimer
        : null,
    start,
    pause,
    resume,
    stop,
    addManual,
    update,
    remove,
    forDay,
    totalForDay,
  }
}
