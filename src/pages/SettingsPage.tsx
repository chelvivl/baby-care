import { type FormEvent, useState } from 'react'
import type { Baby } from '../domain/baby'
import { formatBirthDateRu } from '../domain/age'
import { ConfirmDialog } from '../components/ConfirmDialog'

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
  const [pendingDelete, setPendingDelete] = useState<Baby | null>(null)

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
      <header className="page-hero">
        <p className="page-hero__kicker">Профили</p>
        <h1 className="page-hero__title">Настройки</h1>
      </header>

      <form className="composer" onSubmit={handleSubmit}>
        <div className="composer__head">
          <h2 className="composer__title">
            {isEditing ? 'Редактирование' : 'Добавить малыша'}
          </h2>
          <p className="composer__hint">Имя и дата рождения — остальное посчитаем сами</p>
        </div>

        <div className="composer__fields">
          <label className="field">
            <span className="field__label">Имя</span>
            <input
              className="field__input"
              type="text"
              name="name"
              autoComplete="off"
              enterKeyHint="next"
              maxLength={40}
              placeholder="Самуил"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </label>

          <label className="field">
            <span className="field__label">Дата рождения</span>
            <span className="field__date">
              {!form.birthDate ? (
                <span className="field__placeholder">Выберите дату</span>
              ) : null}
              <input
                className={`field__input field__input--date${form.birthDate ? '' : ' field__input--empty'}`}
                type="date"
                name="birthDate"
                max={todayIso}
                value={form.birthDate}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, birthDate: event.target.value }))
                }
              />
            </span>
          </label>
        </div>

        {error ? <p className="composer__error">{error}</p> : null}

        <div className="composer__actions">
          <button type="submit" className="btn btn--primary btn--block">
            {isEditing ? 'Сохранить' : 'Добавить'}
          </button>
          {isEditing ? (
            <button type="button" className="btn btn--quiet" onClick={resetForm}>
              Отмена
            </button>
          ) : null}
        </div>
      </form>

      <section className="roster" aria-label="Список малышей">
        <div className="roster__head">
          <h2 className="roster__title">Малыши</h2>
          <span className="roster__count">{babies.length}</span>
        </div>

        {babies.length === 0 ? (
          <p className="roster__empty">Список пуст — добавьте первого выше.</p>
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
                      onClick={() => startEdit(baby)}
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
          if (editingId === pendingDelete.id) {
            resetForm()
          }
          onRemove(pendingDelete.id)
          setPendingDelete(null)
        }}
      />
    </div>
  )
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
