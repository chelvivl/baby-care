import { useEffect, useState } from 'react'
import type { Baby } from '../domain/baby'
import {
  calculateAge,
  formatBirthDateRu,
  formatCalendarAge,
  formatWeeksAge,
  unitRu,
} from '../domain/age'

type HomePageProps = {
  activeBaby: Baby | null
  onOpenSettings: () => void
}

export function HomePage({ activeBaby, onOpenSettings }: HomePageProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])

  const today = new Intl.DateTimeFormat('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now)

  return (
    <div className="page home-page">
      <header className="home-page__header">
        <p className="home-page__date">{today}</p>
        <h1 className="home-page__brand">Baby Care</h1>
      </header>

      {activeBaby ? (
        <AgeCard baby={activeBaby} now={now} />
      ) : (
        <section className="age-empty">
          <p className="age-empty__title">Добавьте малыша</p>
          <p className="age-empty__text">
            Укажите имя и дату рождения в настройках — здесь появится подробный возраст.
          </p>
          <button type="button" className="btn btn--primary" onClick={onOpenSettings}>
            Открыть настройки
          </button>
        </section>
      )}

      <section className="home-page__summary" aria-label="Сводка за сегодня">
        <article className="stat-tile">
          <span className="stat-tile__label">Сон</span>
          <span className="stat-tile__value">—</span>
          <span className="stat-tile__hint">записей пока нет</span>
        </article>
        <article className="stat-tile">
          <span className="stat-tile__label">Кормление</span>
          <span className="stat-tile__value">—</span>
          <span className="stat-tile__hint">записей пока нет</span>
        </article>
      </section>

      <section className="home-page__actions" aria-label="Быстрые действия">
        <button type="button" className="action-chip" disabled>
          Начать сон
        </button>
        <button type="button" className="action-chip" disabled>
          Записать кормление
        </button>
      </section>
    </div>
  )
}

function AgeCard({ baby, now }: { baby: Baby; now: Date }) {
  const age = calculateAge(baby.birthDate, now)
  const weeksLine = formatWeeksAge(age)

  return (
    <section className="age-card" aria-label={`Возраст: ${baby.name}`}>
      <p className="age-card__eyebrow">Сейчас</p>
      <h2 className="age-card__name">{baby.name}</h2>
      <p className="age-card__primary">{formatCalendarAge(age)}</p>
      {weeksLine ? <p className="age-card__weeks">или {weeksLine}</p> : null}

      {!age.isFuture ? (
        <dl className="age-grid">
          <div className="age-grid__item">
            <dt>Всего дней</dt>
            <dd>{age.totalDays.toLocaleString('ru-RU')}</dd>
          </div>
          <div className="age-grid__item">
            <dt>Недель</dt>
            <dd>
              {age.totalWeeks}
              {age.weekDays > 0 ? `+${age.weekDays}` : ''}
            </dd>
          </div>
          <div className="age-grid__item">
            <dt>Часов</dt>
            <dd>{age.totalHours.toLocaleString('ru-RU')}</dd>
          </div>
          <div className="age-grid__item">
            <dt>Минут</dt>
            <dd>{age.totalMinutes.toLocaleString('ru-RU')}</dd>
          </div>
        </dl>
      ) : null}

      <p className="age-card__birth">
        {age.isToday
          ? 'День рождения сегодня'
          : `Дата рождения: ${formatBirthDateRu(baby.birthDate)}`}
        {!age.isFuture && !age.isToday
          ? ` · ${unitRu(age.totalDays, ['полный день', 'полных дня', 'полных дней'])}`
          : ''}
      </p>
    </section>
  )
}
