import { type FormEvent, useEffect, useMemo, useState } from 'react'
import type { Baby } from '../domain/baby'
import {
  FEEDING_KIND_LABELS,
  formatAmountMl,
  formatIntervalHours,
  intervalHoursFromMinutes,
  intervalMinutesFromHours,
  type FeedingEvent,
  type FeedingKind,
  type FeedingSettings,
} from '../domain/feeding'
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
import { ensureNotificationPermission } from '../app/notifications'
import { useFeedingContext } from '../hooks/FeedingContext'

type FeedingPageProps = {
  activeBaby: Baby | null
  onOpenSettings: () => void
}

type FeedingView =
  | { kind: 'main' }
  | { kind: 'prefs' }
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
    const id = window.setInterval(() => setNow(Date.now()), 1000)
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

  const dueMs =
    feeding.latest && feeding.schedule
      ? feeding.schedule.dueAt.getTime() - now
      : null
  const isDue = dueMs !== null && dueMs <= 0

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

  if (view.kind === 'prefs') {
    return (
      <FeedingPrefsForm
        settings={feeding.settings}
        onBack={() => setView({ kind: 'main' })}
        onSave={(patch) => {
          feeding.updateSettings(patch)
          setView({ kind: 'main' })
        }}
      />
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

  return (
    <div className="page feeding-page">
      <header className="page-hero feeding-page__hero">
        <div className="feeding-page__hero-copy">
          <p className="page-hero__kicker">{activeBaby.name}</p>
          <h1 className="page-hero__title">Кормление</h1>
        </div>
        <button
          type="button"
          className="feeding-page__prefs"
          onClick={() => setView({ kind: 'prefs' })}
        >
          Параметры
        </button>
      </header>

      <section
        className={`feed-schedule${isDue ? ' feed-schedule--due' : ''}`}
        aria-label="Следующее кормление"
        aria-live="polite"
      >
        <p className="feed-schedule__label">
          {dueMs === null
            ? 'Интервал'
            : isDue
              ? 'Кормление'
              : 'До кормления'}
        </p>
        {dueMs === null ? (
          <p className="feed-schedule__countdown">
            {formatIntervalHours(feeding.settings.intervalHours)}
          </p>
        ) : isDue ? (
          <p className="feed-schedule__countdown feed-schedule__countdown--due">
            Пора кормить
          </p>
        ) : (
          <p className="feed-schedule__countdown">{formatTimerClock(dueMs)}</p>
        )}
        <p className="feed-schedule__meta">
          {dueMs === null
            ? 'Запишите кормление — появится обратный отсчёт'
            : isDue
              ? `Прошло ${formatDurationRu(Math.abs(dueMs))}`
              : `около ${formatTimeRu(feeding.schedule!.dueAt.toISOString())}`}
          {feeding.settings.notificationsEnabled
            ? ` · пуш за ${feeding.settings.notifyBeforeMinutes} мин`
            : ''}
        </p>
      </section>

      <section className="feed-quick" aria-label="Быстрая запись">
        <p className="feed-quick__eyebrow">Новая запись</p>

        <div className="feed-kind" role="group" aria-label="Что дали">
          <button
            type="button"
            className={`feed-kind__btn${quickKind === 'formula' ? ' feed-kind__btn--active' : ''}`}
            onClick={() => setQuickKind('formula')}
          >
            Смесь
          </button>
          <button
            type="button"
            className={`feed-kind__btn${quickKind === 'water' ? ' feed-kind__btn--active' : ''}`}
            onClick={() => setQuickKind('water')}
          >
            Вода
          </button>
        </div>

        <label className="feed-amount">
          <span className="feed-amount__label">Объём</span>
          <span className="feed-amount__row">
            <input
              className="feed-amount__input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={quickAmount}
              onChange={(event) => setQuickAmount(event.target.value.replace(/[^\d]/g, ''))}
            />
            <span className="feed-amount__unit">мл</span>
          </span>
        </label>

        <div className="feed-quick__actions">
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={handleQuickAdd}
          >
            Записать сейчас
          </button>
          <button
            type="button"
            className="feed-quick__manual"
            onClick={() => setView({ kind: 'create' })}
          >
            Указать другое время
          </button>
        </div>
      </section>

      <section className="feed-history" aria-label="История кормлений">
        <div className="feed-history__nav">
          <button
            type="button"
            className="feed-history__arrow"
            aria-label="Предыдущий день"
            onClick={() => setDayKey((key) => addDaysToKey(key, -1))}
          >
            ‹
          </button>
          <div className="feed-history__day">
            <p className="feed-history__title">{formatDayTitleRu(dayKey)}</p>
            <p className="feed-history__total">
              {dayTotalMl > 0 ? formatAmountMl(dayTotalMl) : 'нет записей'}
            </p>
          </div>
          <button
            type="button"
            className="feed-history__arrow"
            aria-label="Следующий день"
            disabled={dayKey >= todayKey}
            onClick={() => setDayKey((key) => addDaysToKey(key, 1))}
          >
            ›
          </button>
        </div>

        {dayEvents.length === 0 ? (
          <div className="feed-empty">
            <p className="feed-empty__title">Пока пусто</p>
            <p className="feed-empty__text">
              Запишите кормление выше — оно появится в истории дня.
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

function FeedingPrefsForm({
  settings,
  onBack,
  onSave,
}: {
  settings: FeedingSettings
  onBack: () => void
  onSave: (patch: Partial<FeedingSettings>) => void
}) {
  const [defaultAmountMl, setDefaultAmountMl] = useState(
    String(settings.defaultAmountMl),
  )
  const [intervalMinutes, setIntervalMinutes] = useState(
    String(intervalMinutesFromHours(settings.intervalHours)),
  )
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState(
    String(settings.notifyBeforeMinutes),
  )
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings.notificationsEnabled,
  )
  const [error, setError] = useState<string | null>(null)

  const intervalPreviewHours = (() => {
    const minutes = Number(intervalMinutes)
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return null
    }
    return intervalHoursFromMinutes(minutes)
  })()

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(defaultAmountMl)
    const minutes = Number(intervalMinutes)
    const lead = Number(notifyBeforeMinutes)

    if (!Number.isFinite(amount) || amount < 1) {
      setError('Укажите объём больше 0 мл')
      return
    }
    if (!Number.isFinite(minutes) || minutes < 1) {
      setError('Укажите интервал в минутах')
      return
    }
    if (!Number.isFinite(lead) || lead < 0) {
      setError('Минуты до напоминания не могут быть отрицательными')
      return
    }

    if (notificationsEnabled) {
      await ensureNotificationPermission()
    }

    onSave({
      defaultAmountMl: Math.round(amount),
      intervalHours: intervalHoursFromMinutes(minutes),
      notifyBeforeMinutes: Math.round(lead),
      notificationsEnabled,
    })
  }

  return (
    <div className="page form-page">
      <header className="form-page__header">
        <button type="button" className="back-btn" onClick={onBack}>
          <span aria-hidden="true">‹</span>
          Назад
        </button>
        <h1 className="form-page__title">Параметры кормления</h1>
        <p className="form-page__lead">
          Объём по умолчанию, интервал и напоминания
        </p>
      </header>

      <form className="feed-settings" onSubmit={handleSubmit} noValidate>
        <label className="feed-settings__field">
          <span className="feed-settings__label">Объём по умолчанию</span>
          <span className="feed-settings__control">
            <input
              className="feed-settings__input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={defaultAmountMl}
              onChange={(event) =>
                setDefaultAmountMl(event.target.value.replace(/[^\d]/g, ''))
              }
            />
            <span className="feed-settings__unit">мл</span>
          </span>
        </label>

        <label className="feed-settings__field">
          <span className="feed-settings__label">Интервал между кормлениями</span>
          <span className="feed-settings__control">
            <input
              className="feed-settings__input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={intervalMinutes}
              onChange={(event) =>
                setIntervalMinutes(event.target.value.replace(/[^\d]/g, ''))
              }
            />
            <span className="feed-settings__unit">мин</span>
          </span>
          {intervalPreviewHours !== null ? (
            <span className="feed-settings__hint">
              Это {formatIntervalHours(intervalPreviewHours)}
            </span>
          ) : null}
        </label>

        <label className="feed-settings__field">
          <span className="feed-settings__label">Напомнить заранее</span>
          <span className="feed-settings__control">
            <input
              className="feed-settings__input"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={notifyBeforeMinutes}
              onChange={(event) =>
                setNotifyBeforeMinutes(event.target.value.replace(/[^\d]/g, ''))
              }
            />
            <span className="feed-settings__unit">мин</span>
          </span>
        </label>

        <label className="settings-toggle">
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(event) => setNotificationsEnabled(event.target.checked)}
          />
          <span>Уведомлять о скором кормлении</span>
        </label>

        {error ? <p className="composer__error">{error}</p> : null}

        <button type="submit" className="btn btn--primary btn--block">
          Сохранить
        </button>
      </form>
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

      <form className="composer" onSubmit={handleSubmit} noValidate>
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
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              autoComplete="off"
              value={amount}
              onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))}
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
