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
  todaySleepLabel: string | null
  sleepInProgress: boolean
  onOpenSettings: () => void
  onOpenSleep: () => void
}

export function HomePage({
  activeBaby,
  todaySleepLabel,
  sleepInProgress,
  onOpenSettings,
  onOpenSleep,
}: HomePageProps) {
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
      <header className="page-hero home-page__hero">
        <p className="page-hero__kicker">{today}</p>
        <h1 className="page-hero__brand">Baby Care</h1>
      </header>

      {activeBaby ? (
        <AgeHero baby={activeBaby} now={now} />
      ) : (
        <section className="empty-state">
          <p className="empty-state__title">Кто ваш малыш?</p>
          <p className="empty-state__text">
            Добавьте имя и дату рождения — покажем точный возраст до часов и минут.
          </p>
          <button type="button" className="btn btn--primary" onClick={onOpenSettings}>
            Добавить малыша
          </button>
        </section>
      )}

      <section className="pulse" aria-label="Сводка за сегодня">
        <button type="button" className="pulse__tile" onClick={onOpenSleep}>
          <span className="pulse__label">Сон</span>
          <span className="pulse__value">{todaySleepLabel ?? '—'}</span>
          <span className="pulse__hint">
            {sleepInProgress ? 'сейчас спит' : todaySleepLabel ? 'за сегодня' : 'нет записей'}
          </span>
        </button>
        <article className="pulse__tile">
          <span className="pulse__label">Кормление</span>
          <span className="pulse__value">—</span>
          <span className="pulse__hint">скоро</span>
        </article>
      </section>
    </div>
  )
}

function AgeHero({ baby, now }: { baby: Baby; now: Date }) {
  const age = calculateAge(baby.birthDate, now)
  const weeksLine = formatWeeksAge(age)

  return (
    <section className="age-hero" aria-label={`Возраст: ${baby.name}`}>
      <div className="age-hero__top">
        <p className="age-hero__label">Сейчас</p>
        <h2 className="age-hero__name">{baby.name}</h2>
        <p className="age-hero__age">{formatCalendarAge(age)}</p>
        {weeksLine ? <p className="age-hero__alt">{weeksLine}</p> : null}
      </div>

      {!age.isFuture ? (
        <div className="metrics" role="list">
          <div className="metrics__item" role="listitem">
            <span className="metrics__value">{age.totalDays.toLocaleString('ru-RU')}</span>
            <span className="metrics__label">дней</span>
          </div>
          <div className="metrics__item" role="listitem">
            <span className="metrics__value">
              {age.totalWeeks}
              {age.weekDays > 0 ? (
                <span className="metrics__frac">+{age.weekDays}</span>
              ) : null}
            </span>
            <span className="metrics__label">недель</span>
          </div>
          <div className="metrics__item" role="listitem">
            <span className="metrics__value">{age.totalHours.toLocaleString('ru-RU')}</span>
            <span className="metrics__label">часов</span>
          </div>
          <div className="metrics__item" role="listitem">
            <span className="metrics__value">{age.totalMinutes.toLocaleString('ru-RU')}</span>
            <span className="metrics__label">минут</span>
          </div>
        </div>
      ) : null}

      <p className="age-hero__foot">
        {age.isToday
          ? 'День рождения сегодня'
          : `Родился ${formatBirthDateRu(baby.birthDate)}`}
        {!age.isFuture && !age.isToday
          ? ` · ${unitRu(age.totalDays, ['полный день', 'полных дня', 'полных дней'])}`
          : ''}
      </p>
    </section>
  )
}
