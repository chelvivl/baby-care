import { type FormEvent, useState } from 'react'
import type { Baby } from '../domain/baby'
import { formatBirthDateRu } from '../domain/age'

type BabyInput = {
  name: string
  birthDate: string
}

type SettingsPageProps = {
  babies: Baby[]
  activeBabyId: string | null
  onCreate: (input: BabyInput) => void
  onUpdate: (id: string, input: BabyInput) => void
  onRemove: (id: string) => void
  onSelect: (id: string) => void
}

const emptyForm: BabyInput = {
  name: '',
  birthDate: '',
}

export function SettingsPage({
  babies,
  activeBabyId,
  onCreate,
  onUpdate,
  onRemove,
  onSelect,
}: SettingsPageProps) {
  const [form, setForm] = useState<BabyInput>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const todayIso = toLocalIsoDate(new Date())
  const isEditing = editingId !== null

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setError(null)
  }

  const startEdit = (baby: Baby) => {
    setEditingId(baby.id)
    setForm({ name: baby.name, birthDate: baby.birthDate })
    setError(null)
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const name = form.name.trim()
    if (!name) {
      setError('Введите имя малыша')
      return
    }
    if (!form.birthDate) {
      setError('Укажите дату рождения')
      return
    }
    if (form.birthDate > todayIso) {
      setError('Дата рождения не может быть в будущем')
      return
    }

    if (editingId) {
      onUpdate(editingId, { name, birthDate: form.birthDate })
    } else {
      onCreate({ name, birthDate: form.birthDate })
    }
    resetForm()
  }

  return (
    <div className="page settings-page">
      <header className="settings-page__header">
        <h1 className="settings-page__title">Настройки</h1>
        <p className="settings-page__lead">
          Добавьте малышей — имя и дату рождения. На вкладке «Сегодня» будет точный возраст.
        </p>
      </header>

      <form className="baby-form" onSubmit={handleSubmit}>
        <h2 className="baby-form__title">
          {isEditing ? 'Редактировать' : 'Новый малыш'}
        </h2>

        <label className="field">
          <span className="field__label">Имя</span>
          <input
            className="field__input"
            type="text"
            name="name"
            autoComplete="off"
            enterKeyHint="next"
            maxLength={40}
            placeholder="Например, Миша"
            value={form.name}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, name: event.target.value }))
            }
          />
        </label>

        <label className="field">
          <span className="field__label">Дата рождения</span>
          <input
            className="field__input"
            type="date"
            name="birthDate"
            max={todayIso}
            value={form.birthDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, birthDate: event.target.value }))
            }
          />
        </label>

        {error ? <p className="baby-form__error">{error}</p> : null}

        <div className="baby-form__actions">
          <button type="submit" className="btn btn--primary">
            {isEditing ? 'Сохранить' : 'Добавить'}
          </button>
          {isEditing ? (
            <button type="button" className="btn btn--ghost" onClick={resetForm}>
              Отмена
            </button>
          ) : null}
        </div>
      </form>

      <section className="baby-list" aria-label="Список малышей">
        <h2 className="baby-list__title">Малыши</h2>
        {babies.length === 0 ? (
          <p className="baby-list__empty">Пока никого нет — добавьте первого выше.</p>
        ) : (
          <ul className="baby-list__items">
            {babies.map((baby) => {
              const isActive = baby.id === activeBabyId
              return (
                <li key={baby.id} className="baby-card">
                  <button
                    type="button"
                    className={`baby-card__select${isActive ? ' baby-card__select--active' : ''}`}
                    onClick={() => onSelect(baby.id)}
                  >
                    <span className="baby-card__name">{baby.name}</span>
                    <span className="baby-card__meta">
                      {formatBirthDateRu(baby.birthDate)}
                      {isActive ? ' · активный' : ''}
                    </span>
                  </button>
                  <div className="baby-card__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--compact"
                      onClick={() => startEdit(baby)}
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--compact"
                      onClick={() => {
                        if (window.confirm(`Удалить профиль «${baby.name}»?`)) {
                          if (editingId === baby.id) {
                            resetForm()
                          }
                          onRemove(baby.id)
                        }
                      }}
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
    </div>
  )
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
