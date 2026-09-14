import { type FormEvent, useState } from 'react'
import type { Baby } from '../domain/baby'
import { formatBirthDateRu } from '../domain/age'
import {
  formatIntervalHours,
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
  const [intervalHours, setIntervalHours] = useState(String(settings.intervalHours))
  const [notifyBeforeMinutes, setNotifyBeforeMinutes] = useState(
    String(settings.notifyBeforeMinutes),
  )
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    settings.notificationsEnabled,
  )
  const [savedHint, setSavedHint] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    const amount = Number(defaultAmountMl)
    const interval = Number(intervalHours)
    const lead = Number(notifyBeforeMinutes)

    if (!Number.isFinite(amount) || amount < 1) {
      setError('Объём по умолчанию — от 1 мл')
      return
    }
    if (!Number.isFinite(interval) || interval < 0.5) {
      setError('Интервал — не меньше 0.5 часа')
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
      intervalHours: Math.round(interval * 100) / 100,
      notifyBeforeMinutes: Math.round(lead),
      notificationsEnabled,
    })
    setError(null)
    setSavedHint(
      `Сохранено: ${Math.round(amount)} мл · каждые ${formatIntervalHours(interval)} · за ${Math.round(lead)} мин`,
    )
  }

  return (
    <section className="settings-block" aria-label="Кормление">
      <div className="roster__head">
        <h2 className="roster__title">Кормление</h2>
      </div>
      <p className="settings-block__lead">
        Значения по умолчанию для быстрой записи и напоминаний о следующем
        кормлении.
      </p>

      <form className="composer settings-block__form" onSubmit={handleSubmit}>
        <div className="composer__fields">
          <label className="field">
            <span className="field__label">Объём по умолчанию, мл</span>
            <input
              className="field__input"
              type="number"
              inputMode="numeric"
              min={1}
              max={1000}
              step={5}
              value={defaultAmountMl}
              onChange={(event) => setDefaultAmountMl(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Интервал, часов</span>
            <input
              className="field__input"
              type="number"
              inputMode="decimal"
              min={0.5}
              max={24}
              step={0.5}
              value={intervalHours}
              onChange={(event) => setIntervalHours(event.target.value)}
            />
          </label>
          <label className="field">
            <span className="field__label">Напомнить за, минут</span>
            <input
              className="field__input"
              type="number"
              inputMode="numeric"
              min={0}
              max={180}
              step={5}
              value={notifyBeforeMinutes}
              onChange={(event) => setNotifyBeforeMinutes(event.target.value)}
            />
          </label>
        </div>

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
          Сохранить кормление
        </button>
      </form>
    </section>
  )
}
