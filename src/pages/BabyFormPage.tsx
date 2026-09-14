import { type FormEvent, useState } from 'react'

export type BabyFormValues = {
  name: string
  birthDate: string
}

type BabyFormPageProps = {
  mode: 'create' | 'edit'
  initial?: BabyFormValues
  onBack: () => void
  onSubmit: (values: BabyFormValues) => void
}

const empty: BabyFormValues = {
  name: '',
  birthDate: '',
}

export function BabyFormPage({ mode, initial, onBack, onSubmit }: BabyFormPageProps) {
  const [form, setForm] = useState<BabyFormValues>(initial ?? empty)
  const [error, setError] = useState<string | null>(null)
  const todayIso = toLocalIsoDate(new Date())

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

    onSubmit({ name, birthDate: form.birthDate })
  }

  return (
    <div className="page form-page">
      <header className="form-page__header">
        <button type="button" className="back-btn" onClick={onBack}>
          <span aria-hidden="true">‹</span>
          Назад
        </button>
        <h1 className="form-page__title">
          {mode === 'edit' ? 'Изменить профиль' : 'Новый профиль'}
        </h1>
        <p className="form-page__lead">Имя и дата рождения — возраст посчитаем сами</p>
      </header>

      <form className="composer" onSubmit={handleSubmit}>
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
              autoFocus
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
            {mode === 'edit' ? 'Сохранить' : 'Добавить'}
          </button>
        </div>
      </form>
    </div>
  )
}

function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
