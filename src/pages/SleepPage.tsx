import { type FormEvent, useEffect, useMemo, useState } from 'react'
import type { Baby } from '../domain/baby'
import {
  SLEEP_KIND_LABELS,
  sessionDurationMs,
  timerElapsedMs,
  type SleepKind,
  type SleepSession,
} from '../domain/sleep'
import {
  addDaysToKey,
  formatDayTitleRu,
  formatDurationRu,
  formatTimeRu,
  formatTimerClock,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
  toLocalDateKey,
} from '../domain/time'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { notifySleepStarted } from '../app/notifications'
import { useSleepContext } from '../hooks/SleepContext'

type SleepPageProps = {
  activeBaby: Baby | null
  onOpenSettings: () => void
}

type SleepView =
  | { kind: 'main' }
  | { kind: 'manual' }
  | { kind: 'edit'; session: SleepSession }

export function SleepPage({ activeBaby, onOpenSettings }: SleepPageProps) {
  const sleep = useSleepContext()
  const [view, setView] = useState<SleepView>({ kind: 'main' })
  const [dayKey, setDayKey] = useState(() => toLocalDateKey(new Date()))
  const [pendingDelete, setPendingDelete] = useState<SleepSession | null>(null)
  const [pendingStart, setPendingStart] = useState<SleepKind | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!sleep.activeTimer || sleep.activeTimer.pausedAt) {
      return
    }
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [sleep.activeTimer])

  useEffect(() => {
    const timer = sleep.activeTimer
    if (!timer) {
      document.title = 'Baby Care'
      return
    }

    const tick = () => {
      const ms = timerElapsedMs(timer, Date.now())
      const status = timer.pausedAt ? 'пауза' : 'сон'
      document.title = `${formatTimerClock(ms)} · ${status}`
    }

    tick()
    const id = window.setInterval(tick, 1000)
    return () => {
      window.clearInterval(id)
      document.title = 'Baby Care'
    }
  }, [sleep.activeTimer])

  useEffect(() => {
    const timer = sleep.activeTimer
    if (!timer || timer.pausedAt) {
      return
    }

    let wakeLock: WakeLockSentinel | null = null
    let cancelled = false

    const requestLock = async () => {
      try {
        if (!('wakeLock' in navigator)) {
          return
        }
        wakeLock = await navigator.wakeLock.request('screen')
      } catch {
        // Browser may deny wake lock — ignore.
      }
    }

    void requestLock()

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !cancelled) {
        void requestLock()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      document.removeEventListener('visibilitychange', onVisibility)
      void wakeLock?.release()
    }
  }, [sleep.activeTimer])

  const daySessions = useMemo(
    () => sleep.forDay(dayKey),
    [sleep.forDay, dayKey, sleep.sessions],
  )
  const dayTotalMs = useMemo(
    () => sleep.totalForDay(dayKey),
    [sleep.totalForDay, dayKey, sleep.sessions],
  )
  const todayKey = toLocalDateKey(new Date())

  if (!activeBaby) {
    return (
      <div className="page sleep-page">
        <header className="page-hero">
          <p className="page-hero__kicker">Отдых</p>
          <h1 className="page-hero__title">Сон</h1>
        </header>
        <section className="empty-state">
          <p className="empty-state__title">Сначала добавьте малыша</p>
          <p className="empty-state__text">
            Таймер и история сна привязаны к профилю.
          </p>
          <button type="button" className="btn btn--primary" onClick={onOpenSettings}>
            Открыть настройки
          </button>
        </section>
      </div>
    )
  }

  if (view.kind === 'manual' || view.kind === 'edit') {
    return (
      <SleepForm
        mode={view.kind === 'edit' ? 'edit' : 'create'}
        initial={
          view.kind === 'edit'
            ? {
                kind: view.session.kind,
                startAt: view.session.startAt,
                endAt: view.session.endAt,
              }
            : undefined
        }
        onBack={() => setView({ kind: 'main' })}
        onSubmit={(values) => {
          if (view.kind === 'edit') {
            sleep.update(view.session.id, values)
          } else {
            sleep.addManual(values)
            setDayKey(toLocalDateKey(new Date(values.startAt)))
          }
          setView({ kind: 'main' })
        }}
      />
    )
  }

  const timer = sleep.activeTimer
  const elapsed = timer ? timerElapsedMs(timer, now) : 0
  const isPaused = Boolean(timer?.pausedAt)

  const handleStop = () => {
    const startedAt = timer?.startedAt
    sleep.stop()
    if (startedAt) {
      setDayKey(toLocalDateKey(new Date(startedAt)))
    } else {
      setDayKey(toLocalDateKey(new Date()))
    }
  }

  return (
    <div className="page sleep-page">
      <header className="page-hero">
        <p className="page-hero__kicker">{activeBaby.name}</p>
        <h1 className="page-hero__title">Сон</h1>
      </header>

      {timer ? (
        <section className={`timer-card${isPaused ? ' timer-card--paused' : ''}`}>
          <p className="timer-card__kind">{SLEEP_KIND_LABELS[timer.kind]} сон</p>
          <p className="timer-card__clock">{formatTimerClock(elapsed)}</p>
          <p className="timer-card__meta">
            {isPaused ? 'На паузе' : 'Идёт запись'} · с {formatTimeRu(timer.startedAt)}
          </p>
          <div className="timer-card__actions">
            {isPaused ? (
              <button type="button" className="btn btn--primary" onClick={sleep.resume}>
                Продолжить
              </button>
            ) : (
              <button type="button" className="btn btn--secondary" onClick={sleep.pause}>
                Пауза
              </button>
            )}
            <button type="button" className="btn btn--primary" onClick={handleStop}>
              Завершить
            </button>
          </div>
        </section>
      ) : (
        <section className="sleep-actions">
          <button
            type="button"
            className="sleep-start sleep-start--day"
            onClick={() => setPendingStart('day')}
          >
            <span className="sleep-start__label">Дневной сон</span>
            <span className="sleep-start__hint">Запустить таймер</span>
          </button>
          <button
            type="button"
            className="sleep-start sleep-start--night"
            onClick={() => setPendingStart('night')}
          >
            <span className="sleep-start__label">Ночной сон</span>
            <span className="sleep-start__hint">Запустить таймер</span>
          </button>
          <button
            type="button"
            className="btn btn--secondary btn--block"
            onClick={() => setView({ kind: 'manual' })}
          >
            Внести вручную
          </button>
        </section>
      )}

      <section className="sleep-history" aria-label="История сна">
        <div className="sleep-history__nav">
          <button
            type="button"
            className="icon-btn"
            aria-label="Предыдущий день"
            onClick={() => setDayKey((key) => addDaysToKey(key, -1))}
          >
            ‹
          </button>
          <div className="sleep-history__day">
            <p className="sleep-history__title">{formatDayTitleRu(dayKey)}</p>
            <p className="sleep-history__total">
              {dayTotalMs > 0 ? `Всего ${formatDurationRu(dayTotalMs)}` : 'Пока без записей'}
            </p>
          </div>
          <button
            type="button"
            className="icon-btn"
            aria-label="Следующий день"
            disabled={dayKey >= todayKey}
            onClick={() => setDayKey((key) => addDaysToKey(key, 1))}
          >
            ›
          </button>
        </div>

        {daySessions.length === 0 ? (
          <p className="sleep-history__empty">В этот день сна ещё не записано.</p>
        ) : (
          <ul className="sleep-history__list">
            {daySessions.map((session) => (
              <li key={session.id} className="sleep-item">
                <div className="sleep-item__main">
                  <span className={`sleep-item__badge sleep-item__badge--${session.kind}`}>
                    {SLEEP_KIND_LABELS[session.kind]}
                  </span>
                  <p className="sleep-item__duration">
                    {formatDurationRu(sessionDurationMs(session))}
                  </p>
                  <p className="sleep-item__range">
                    {formatTimeRu(session.startAt)} – {formatTimeRu(session.endAt)}
                    {session.source === 'manual' ? ' · вручную' : ''}
                  </p>
                </div>
                <div className="sleep-item__tools">
                  <button
                    type="button"
                    className="text-action"
                    onClick={() => setView({ kind: 'edit', session })}
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="text-action text-action--danger"
                    onClick={() => setPendingDelete(session)}
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmDialog
        open={pendingStart !== null}
        title={
          pendingStart === 'night' ? 'Начать ночной сон?' : 'Начать дневной сон?'
        }
        message="Таймер начнёт отсчёт прямо сейчас. Его можно поставить на паузу или завершить."
        confirmLabel="Начать"
        cancelLabel="Отмена"
        onCancel={() => setPendingStart(null)}
        onConfirm={() => {
          if (!pendingStart) {
            setPendingStart(null)
            return
          }
          const kind = pendingStart
          setPendingStart(null)
          sleep.start(kind)
          void notifySleepStarted(kind, activeBaby.name)
        }}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Удалить запись сна?"
        message="Эта запись исчезнет из истории."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            sleep.remove(pendingDelete.id)
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

type SleepFormValues = {
  kind: SleepKind
  startAt: string
  endAt: string
}

type SleepFormProps = {
  mode: 'create' | 'edit'
  initial?: SleepFormValues
  onBack: () => void
  onSubmit: (values: SleepFormValues) => void
}

function SleepForm({ mode, initial, onBack, onSubmit }: SleepFormProps) {
  const now = new Date()
  const defaultEnd = toDateTimeLocalValue(now)
  const defaultStart = toDateTimeLocalValue(new Date(now.getTime() - 60 * 60_000))

  const [kind, setKind] = useState<SleepKind>(initial?.kind ?? 'day')
  const [startLocal, setStartLocal] = useState(
    initial ? toDateTimeLocalValue(new Date(initial.startAt)) : defaultStart,
  )
  const [endLocal, setEndLocal] = useState(
    initial ? toDateTimeLocalValue(new Date(initial.endAt)) : defaultEnd,
  )
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const start = fromDateTimeLocalValue(startLocal)
    const end = fromDateTimeLocalValue(endLocal)
    if (!start || !end) {
      setError('Укажите начало и конец сна')
      return
    }
    if (end.getTime() <= start.getTime()) {
      setError('Конец должен быть позже начала')
      return
    }
    if (end.getTime() - start.getTime() < 60_000) {
      setError('Минимальная длительность — 1 минута')
      return
    }

    onSubmit({
      kind,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
    })
  }

  return (
    <div className="page form-page">
      <header className="form-page__header">
        <button type="button" className="back-btn" onClick={onBack}>
          <span aria-hidden="true">‹</span>
          Назад
        </button>
        <h1 className="form-page__title">
          {mode === 'edit' ? 'Изменить сон' : 'Сон вручную'}
        </h1>
        <p className="form-page__lead">Укажите тип сна, начало и окончание</p>
      </header>

      <form className="composer" onSubmit={handleSubmit}>
        <div className="kind-switch" role="group" aria-label="Тип сна">
          <button
            type="button"
            className={`kind-switch__btn${kind === 'day' ? ' kind-switch__btn--active' : ''}`}
            onClick={() => setKind('day')}
          >
            Дневной
          </button>
          <button
            type="button"
            className={`kind-switch__btn${kind === 'night' ? ' kind-switch__btn--active' : ''}`}
            onClick={() => setKind('night')}
          >
            Ночной
          </button>
        </div>

        <div className="composer__fields">
          <label className="field">
            <span className="field__label">Начало</span>
            <input
              className="field__input field__input--datetime"
              type="datetime-local"
              value={startLocal}
              onChange={(event) => setStartLocal(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Конец</span>
            <input
              className="field__input field__input--datetime"
              type="datetime-local"
              value={endLocal}
              onChange={(event) => setEndLocal(event.target.value)}
            />
          </label>
        </div>

        {error ? <p className="composer__error">{error}</p> : null}

        <div className="composer__actions">
          <button type="submit" className="btn btn--primary btn--block">
            {mode === 'edit' ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </form>
    </div>
  )
}
