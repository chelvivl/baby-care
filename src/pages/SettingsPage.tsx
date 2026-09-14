import { type FormEvent, useState } from 'react'
import type { Baby } from '../domain/baby'
import { formatBirthDateRu } from '../domain/age'
import {
  formatIntervalHours,
  intervalHoursFromMinutes,
  intervalMinutesFromHours,
  type FeedingSettings,
} from '../domain/feeding'
import { ensureNotificationPermission } from '../app/notifications'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { useFeedingContext } from '../hooks/FeedingContext'
import { BabyFormPage, type BabyFormValues } from './BabyFormPage'

type SettingsPageProps = {
  babies: Baby[]
  activeBabyId: string | null
  onCreate: (input: BabyFormValues) => void
  onUpdate: (id: string, input: BabyFormValues) => void
  onRemove: (id: string) => void
  onSelect: (id: string) => void
}

type SettingsView =
  | { kind: 'list' }
  | { kind: 'create' }
  | { kind: 'edit'; baby: Baby }

export function SettingsPage({
  babies,
  activeBabyId,
  onCreate,
  onUpdate,
  onRemove,
  onSelect,
}: SettingsPageProps) {
  const feeding = useFeedingContext()
  const [view, setView] = useState<SettingsView>({ kind: 'list' })
  const [pendingDelete, setPendingDelete] = useState<Baby | null>(null)

  if (view.kind === 'create') {
    return (
      <BabyFormPage
        mode="create"
        onBack={() => setView({ kind: 'list' })}
        onSubmit={(values) => {
          onCreate(values)
          setView({ kind: 'list' })
        }}
      />
    )
  }

  if (view.kind === 'edit') {
    return (
      <BabyFormPage
        mode="edit"
        initial={{ name: view.baby.name, birthDate: view.baby.birthDate }}
        onBack={() => setView({ kind: 'list' })}
        onSubmit={(values) => {
          onUpdate(view.baby.id, values)
          setView({ kind: 'list' })
        }}
      />
    )
  }

  return (
    <div className="page settings-page">
      <header className="page-hero">
        <p className="page-hero__kicker">Профили</p>
        <h1 className="page-hero__title">Настройки</h1>
      </header>

      <button
        type="button"
        className="btn btn--primary btn--block settings-page__add"
        onClick={() => setView({ kind: 'create' })}
      >
        Добавить малыша
      </button>

      <section className="roster" aria-label="Список малышей">
        <div className="roster__head">
          <h2 className="roster__title">Малыши</h2>
          <span className="roster__count">{babies.length}</span>
        </div>

        {babies.length === 0 ? (
          <p className="roster__empty">
            Пока никого нет — нажмите «Добавить малыша».
          </p>
        ) : (
          <ul className="roster__list">
            {babies.map((baby) => {
              const isActive = baby.id === activeBabyId
              return (
                <li
                  key={baby.id}
                  className={`roster__item${isActive ? ' roster__item--active' : ''}`}
                >
                  <button
                    type="button"
                    className="roster__main"
                    onClick={() => onSelect(baby.id)}
                  >
                    <span className="roster__avatar" aria-hidden="true">
                      {baby.name.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <span className="roster__copy">
                      <span className="roster__name">{baby.name}</span>
                      <span className="roster__meta">
                        {formatBirthDateRu(baby.birthDate)}
                      </span>
                    </span>
                    {isActive ? <span className="roster__badge">активный</span> : null}
                  </button>
                  <div className="roster__tools">
                    <button
                      type="button"
                      className="text-action"
                      onClick={() => setView({ kind: 'edit', baby })}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="text-action text-action--danger"
                      onClick={() => setPendingDelete(baby)}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <FeedingSettingsCard
        settings={feeding.settings}
        onSave={feeding.updateSettings}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Удалить профиль?"
        message={
          pendingDelete
            ? `Профиль «${pendingDelete.name}» будет удалён с этого устройства.`
            : ''
        }
        confirmLabel="Удалить"
        cancelLabel="Отмена"
        danger
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete) {
            return
          }
          onRemove(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function FeedingSettingsCard({
  settings,
  onSave,
}: {
  settings: FeedingSettings
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
  const [savedHint, setSavedHint] = useState<string | null>(null)
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

    const intervalHours = intervalHoursFromMinutes(minutes)
    onSave({
      defaultAmountMl: Math.round(amount),
      intervalHours,
      notifyBeforeMinutes: Math.round(lead),
      notificationsEnabled,
    })
    setError(null)
    setSavedHint(
      `Сохранено: ${Math.round(amount)} мл · каждые ${formatIntervalHours(intervalHours)} · за ${Math.round(lead)} мин`,
    )
  }

  return (
    <section className="settings-block" aria-label="Кормление">
      <div className="settings-block__head">
        <h2 className="settings-block__title">Кормление</h2>
        <p className="settings-block__lead">
          Значения по умолчанию и напоминания о следующем кормлении.
        </p>
      </div>

      <form className="feed-settings" onSubmit={handleSubmit} noValidate>
        <label className="feed-settings__field">
          <span className="feed-settings__label">Объём по умолчанию</span>
          <span className="feed-settings__control">
            <input
              className="feed-settings__input"
              type="number"
              inputMode="numeric"
              step="any"
              value={defaultAmountMl}
              onChange={(event) => setDefaultAmountMl(event.target.value)}
            />
            <span className="feed-settings__unit">мл</span>
          </span>
        </label>

        <label className="feed-settings__field">
          <span className="feed-settings__label">Интервал между кормлениями</span>
          <span className="feed-settings__control">
            <input
              className="feed-settings__input"
              type="number"
              inputMode="numeric"
              step="any"
              value={intervalMinutes}
              onChange={(event) => setIntervalMinutes(event.target.value)}
            />
            <span className="feed-settings__unit">мин</span>
          </span>
          {intervalPreviewHours !== null ? (
            <span className="feed-settings__hint">
              При сохранении: {formatIntervalHours(intervalPreviewHours)}
            </span>
          ) : null}
        </label>

        <label className="feed-settings__field">
          <span className="feed-settings__label">Напомнить заранее</span>
          <span className="feed-settings__control">
            <input
              className="feed-settings__input"
              type="number"
              inputMode="numeric"
              step="any"
              value={notifyBeforeMinutes}
              onChange={(event) => setNotifyBeforeMinutes(event.target.value)}
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
        {savedHint ? <p className="settings-block__saved">{savedHint}</p> : null}

        <button type="submit" className="btn btn--primary btn--block">
          Сохранить
        </button>
      </form>
    </section>
  )
}
