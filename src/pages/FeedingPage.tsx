import { type FormEvent, useEffect, useMemo, useState } from 'react'
import type { Baby } from '../domain/baby'
import {
  FEEDING_KIND_LABELS,
  formatAmountMl,
  formatIntervalHours,
  type FeedingEvent,
  type FeedingKind,
} from '../domain/feeding'
import {
  addDaysToKey,
  formatDayTitleRu,
  formatDurationRu,
  formatTimeRu,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
  toLocalDateKey,
} from '../domain/time'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ensureNotificationPermission } from '../app/notifications'
import { useFeedingContext } from '../hooks/FeedingContext'

type FeedingPageProps = {
  activeBaby: Baby | null
  onOpenSettings: () => void
}

type FeedingView =
  | { kind: 'main' }
  | { kind: 'create' }
  | { kind: 'edit'; event: FeedingEvent }

export function FeedingPage({ activeBaby, onOpenSettings }: FeedingPageProps) {
  const feeding = useFeedingContext()
  const [view, setView] = useState<FeedingView>({ kind: 'main' })
  const [dayKey, setDayKey] = useState(() => toLocalDateKey(new Date()))
  const [pendingDelete, setPendingDelete] = useState<FeedingEvent | null>(null)
  const [quickKind, setQuickKind] = useState<FeedingKind>('formula')
  const [quickAmount, setQuickAmount] = useState(() =>
    String(feeding.settings.defaultAmountMl),
  )

  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    setQuickAmount(String(feeding.settings.defaultAmountMl))
  }, [feeding.settings.defaultAmountMl])

  const dayEvents = useMemo(
    () => feeding.forDay(dayKey),
    [feeding.forDay, dayKey, feeding.events],
  )
  const dayTotalMl = useMemo(
    () => feeding.totalMlForDay(dayKey),
    [feeding.totalMlForDay, dayKey, feeding.events],
  )
  const todayKey = toLocalDateKey(new Date())

  if (!activeBaby) {
    return (
      <div className="page feeding-page">
        <header className="page-hero">
          <p className="page-hero__kicker">Питание</p>
          <h1 className="page-hero__title">Кормление</h1>
        </header>
        <section className="empty-state">
          <p className="empty-state__title">Сначала добавьте малыша</p>
          <p className="empty-state__text">
            Записи кормления привязаны к профилю.
          </p>
          <button type="button" className="btn btn--primary" onClick={onOpenSettings}>
            Открыть настройки
          </button>
        </section>
      </div>
    )
  }

  if (view.kind === 'create' || view.kind === 'edit') {
    return (
      <FeedingForm
        mode={view.kind === 'edit' ? 'edit' : 'create'}
        defaultAmountMl={feeding.settings.defaultAmountMl}
        initial={
          view.kind === 'edit'
            ? {
                kind: view.event.kind,
                fedAt: view.event.fedAt,
                amountMl: view.event.amountMl,
              }
            : {
                kind: quickKind,
                fedAt: new Date().toISOString(),
                amountMl: Number(quickAmount) || feeding.settings.defaultAmountMl,
              }
        }
        onBack={() => setView({ kind: 'main' })}
        onSubmit={(values) => {
          if (view.kind === 'edit') {
            feeding.update(view.event.id, values)
          } else {
            feeding.add(values)
            setDayKey(toLocalDateKey(new Date(values.fedAt)))
            void ensureNotificationPermission()
          }
          setView({ kind: 'main' })
        }}
      />
    )
  }

  const handleQuickAdd = () => {
    const amount = Number(quickAmount)
    if (!Number.isFinite(amount) || amount <= 0) {
      return
    }
    const fedAt = new Date().toISOString()
    feeding.add({
      kind: quickKind,
      fedAt,
      amountMl: amount,
    })
    setDayKey(toLocalDateKey(new Date(fedAt)))
    void ensureNotificationPermission()
  }

  const scheduleHint = (() => {
    if (!feeding.latest || !feeding.schedule) {
      return null
    }
    const dueMs = feeding.schedule.dueAt.getTime() - now
    if (dueMs <= 0) {
      return 'Пора кормить'
    }
    return `Следующее через ${formatDurationRu(dueMs)} · ${formatTimeRu(feeding.schedule.dueAt.toISOString())}`
  })()

  return (
    <div className="page feeding-page">
      <header className="page-hero">
        <p className="page-hero__kicker">{activeBaby.name}</p>
        <h1 className="page-hero__title">Кормление</h1>
      </header>

      <section className="feed-quick" aria-label="Быстрая запись">
        <div className="kind-switch" role="group" aria-label="Что дали">
          <button
            type="button"
            className={`kind-switch__btn${quickKind === 'formula' ? ' kind-switch__btn--active' : ''}`}
            onClick={() => setQuickKind('formula')}
          >
            Смесь
          </button>
          <button
            type="button"
            className={`kind-switch__btn${quickKind === 'water' ? ' kind-switch__btn--active' : ''}`}
            onClick={() => setQuickKind('water')}
          >
            Вода
          </button>
        </div>

        <label className="field feed-quick__amount">
          <span className="field__label">Объём, мл</span>
          <input
            className="field__input"
            type="number"
            inputMode="numeric"
            min={1}
            max={1000}
            step={5}
            value={quickAmount}
            onChange={(event) => setQuickAmount(event.target.value)}
          />
        </label>

        <div className="feed-quick__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleQuickAdd}
          >
            Записать сейчас
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => setView({ kind: 'create' })}
          >
            Другое время
          </button>
        </div>

        {scheduleHint ? (
          <p className="feed-quick__hint">
            {scheduleHint}
            {feeding.settings.notificationsEnabled
              ? ` · напоминание за ${feeding.settings.notifyBeforeMinutes} мин`
              : null}
          </p>
        ) : (
          <p className="feed-quick__hint">
            Интервал по умолчанию: каждые{' '}
            {formatIntervalHours(feeding.settings.intervalHours)}
          </p>
        )}
      </section>

      <section className="sleep-history" aria-label="История кормлений">
        <div className="sleep-history__nav">
          <button
            type="button"
            className="sleep-history__arrow"
            aria-label="Предыдущий день"
            onClick={() => setDayKey((key) => addDaysToKey(key, -1))}
          >
            ‹
          </button>
          <div className="sleep-history__day">
            <p className="sleep-history__title">{formatDayTitleRu(dayKey)}</p>
            <p className="sleep-history__total">
              {dayTotalMl > 0 ? formatAmountMl(dayTotalMl) : 'нет записей'}
            </p>
          </div>
          <button
            type="button"
            className="sleep-history__arrow"
            aria-label="Следующий день"
            disabled={dayKey >= todayKey}
            onClick={() => setDayKey((key) => addDaysToKey(key, 1))}
          >
            ›
          </button>
        </div>

        {dayEvents.length === 0 ? (
          <div className="sleep-empty">
            <p className="sleep-empty__title">Пока пусто</p>
            <p className="sleep-empty__text">
              Запишите кормление кнопкой выше — появится в истории дня.
            </p>
          </div>
        ) : (
          <ul className="feed-list">
            {dayEvents.map((event) => (
              <li key={event.id} className="feed-card">
                <div className="feed-card__main">
                  <div className="feed-card__identity">
                    <span
                      className={`feed-card__badge feed-card__badge--${event.kind}`}
                    >
                      {FEEDING_KIND_LABELS[event.kind]}
                    </span>
                    <p className="feed-card__amount">
                      {formatAmountMl(event.amountMl)}
                    </p>
                  </div>
                  <p className="feed-card__time">{formatTimeRu(event.fedAt)}</p>
                </div>
                <div className="feed-card__tools">
                  <button
                    type="button"
                    className="text-action"
                    onClick={() => setView({ kind: 'edit', event })}
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    className="text-action text-action--danger"
                    onClick={() => setPendingDelete(event)}
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
        open={pendingDelete !== null}
        title="Удалить кормление?"
        message="Эта запись исчезнет из истории."
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) {
            feeding.remove(pendingDelete.id)
          }
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

type FeedingFormValues = {
  kind: FeedingKind
  fedAt: string
  amountMl: number
}

function FeedingForm({
  mode,
  initial,
  defaultAmountMl,
  onBack,
  onSubmit,
}: {
  mode: 'create' | 'edit'
  initial?: FeedingFormValues
  defaultAmountMl: number
  onBack: () => void
  onSubmit: (values: FeedingFormValues) => void
}) {
  const [kind, setKind] = useState<FeedingKind>(initial?.kind ?? 'formula')
  const [fedLocal, setFedLocal] = useState(
    toDateTimeLocalValue(
      initial ? new Date(initial.fedAt) : new Date(),
    ),
  )
  const [amount, setAmount] = useState(
    String(initial?.amountMl ?? defaultAmountMl),
  )
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const fedAt = fromDateTimeLocalValue(fedLocal)
    const amountMl = Number(amount)
    if (!fedAt) {
      setError('Укажите время кормления')
      return
    }
    if (!Number.isFinite(amountMl) || amountMl <= 0) {
      setError('Укажите объём больше 0 мл')
      return
    }

    onSubmit({
      kind,
      fedAt: fedAt.toISOString(),
      amountMl,
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
          {mode === 'edit' ? 'Изменить кормление' : 'Кормление'}
        </h1>
        <p className="form-page__lead">Что дали, сколько и когда</p>
      </header>

      <form className="composer" onSubmit={handleSubmit}>
        <div className="kind-switch" role="group" aria-label="Что дали">
          <button
            type="button"
            className={`kind-switch__btn${kind === 'formula' ? ' kind-switch__btn--active' : ''}`}
            onClick={() => setKind('formula')}
          >
            Смесь
          </button>
          <button
            type="button"
            className={`kind-switch__btn${kind === 'water' ? ' kind-switch__btn--active' : ''}`}
            onClick={() => setKind('water')}
          >
            Вода
          </button>
        </div>

        <div className="composer__fields">
          <label className="field">
            <span className="field__label">Время</span>
            <input
              className="field__input field__input--datetime"
              type="datetime-local"
              value={fedLocal}
              onChange={(event) => setFedLocal(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Объём, мл</span>
            <input
              className="field__input"
              type="number"
              inputMode="numeric"
              min={1}
              max={1000}
              step={5}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
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
