import { useState } from 'react'
import type { Baby } from '../domain/baby'
import { formatBirthDateRu } from '../domain/age'
import { ConfirmDialog } from '../components/ConfirmDialog'
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
