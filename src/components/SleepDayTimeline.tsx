import { useState } from 'react'
import {
  SLEEP_KIND_LABELS,
  sessionDurationMs,
  sessionPausedMs,
  sessionSegments,
  type SleepSession,
} from '../domain/sleep'
import { formatDurationRu, formatTimeRu } from '../domain/time'

type SleepDayTimelineProps = {
  sessions: SleepSession[]
  awakeUntilNowMs: number | null
  onEdit: (session: SleepSession) => void
  onDelete: (session: SleepSession) => void
}

export function SleepDayTimeline({
  sessions,
  awakeUntilNowMs,
  onEdit,
  onDelete,
}: SleepDayTimelineProps) {
  return (
    <div className="sleep-feed">
      {awakeUntilNowMs !== null && awakeUntilNowMs >= 60_000 ? (
        <div className="sleep-wake">
          <span className="sleep-wake__line" aria-hidden="true" />
          <span className="sleep-wake__pill">
            Бодрствование {formatDurationRu(awakeUntilNowMs)}
          </span>
          <span className="sleep-wake__line" aria-hidden="true" />
        </div>
      ) : null}

      {sessions.map((session, index) => {
        const older = sessions[index + 1]
        // Newest-first: gap between this session and the older one below.
        const gapMs = older
          ? Math.max(
              0,
              new Date(session.startAt).getTime() -
                new Date(older.endAt).getTime(),
            )
          : null

        return (
          <div key={session.id} className="sleep-feed__block">
            <SleepSessionCard
              session={session}
              onEdit={() => onEdit(session)}
              onDelete={() => onDelete(session)}
            />
            {gapMs !== null && gapMs >= 60_000 ? (
              <div className="sleep-wake">
                <span className="sleep-wake__line" aria-hidden="true" />
                <span className="sleep-wake__pill">
                  Бодрствование {formatDurationRu(gapMs)}
                </span>
                <span className="sleep-wake__line" aria-hidden="true" />
              </div>
            ) : gapMs !== null ? (
              <div className="sleep-feed__gap" aria-hidden="true" />
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function SleepSessionCard({
  session,
  onEdit,
  onDelete,
}: {
  session: SleepSession
  onEdit: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const segments = sessionSegments(session)
  const pauseCount = session.pauseCount ?? 0
  const pausedMs = sessionPausedMs(session)
  const sleepMs = sessionDurationMs(session)

  const summary =
    pauseCount > 0
      ? `${formatDurationRu(sleepMs)}, паузы ${pauseCount}`
      : formatDurationRu(sleepMs)

  return (
    <article className={`sleep-card sleep-card--${session.kind}`}>
      <header className="sleep-card__head">
        <div className="sleep-card__identity">
          <span className="sleep-card__icon" aria-hidden="true">
            {session.kind === 'day' ? <SunIcon /> : <MoonIcon />}
          </span>
          <div>
            <p className="sleep-card__title">{SLEEP_KIND_LABELS[session.kind]} сон</p>
            <p className="sleep-card__summary">{summary}</p>
          </div>
        </div>
        <div className="sleep-card__times">
          <span>{formatTimeRu(session.startAt)}</span>
          <span>{formatTimeRu(session.endAt)}</span>
        </div>
      </header>

      <button
        type="button"
        className="sleep-card__track"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <div className="sleep-card__rail" aria-hidden="true">
          {segments.map((segment, index) => {
            if (segment.kind === 'pause') {
              return (
                <span key={`${session.id}-p-${index}`} className="sleep-card__pause-chip">
                  <PauseIcon />
                  {formatDurationRu(segment.durationMs)}
                </span>
              )
            }
            return (
              <span key={`${session.id}-s-${index}`} className="sleep-card__sleep-chip">
                {session.kind === 'day' ? <SunIcon /> : <MoonIcon />}
                {segments.length > 1 ? formatDurationRu(segment.durationMs) : null}
              </span>
            )
          })}
        </div>
        <span className={`sleep-card__chevron${expanded ? ' sleep-card__chevron--open' : ''}`}>
          ‹
        </span>
      </button>

      {expanded ? (
        <div className="sleep-card__details">
          <ul className="sleep-card__segments">
            {segments.map((segment, index) => (
              <li key={`${session.id}-d-${index}`} className="sleep-card__segment">
                <span className="sleep-card__segment-icon" aria-hidden="true">
                  {segment.kind === 'pause' ? (
                    <PauseIcon />
                  ) : session.kind === 'day' ? (
                    <SunIcon />
                  ) : (
                    <MoonIcon />
                  )}
                </span>
                <span className="sleep-card__segment-text">
                  {segment.kind === 'pause' ? (
                    <>
                      {formatDurationRu(segment.durationMs)}, {formatTimeRu(segment.startAt)} –{' '}
                      {formatTimeRu(segment.endAt)}
                    </>
                  ) : (
                    <>
                      {formatTimeRu(segment.startAt)} – {formatTimeRu(segment.endAt)}
                    </>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {pausedMs > 0 ? (
            <p className="sleep-card__paused-total">
              Всего просыпался {formatDurationRu(pausedMs)}
            </p>
          ) : null}
          <div className="sleep-card__tools">
            <button type="button" className="text-action" onClick={onEdit}>
              Изменить
            </button>
            <button type="button" className="text-action text-action--danger" onClick={onDelete}>
              Удалить
            </button>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.4v1.8M12 18.8v1.8M3.4 12h1.8M18.8 12h1.8M6 6l1.3 1.3M16.7 16.7 18 18M18 6l-1.3 1.3M7.3 16.7 6 18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M14.2 4.4A7.8 7.8 0 1 0 19.6 14 6.4 6.4 0 0 1 14.2 4.4Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M8 6.5h2.4v11H8zM13.6 6.5H16v11h-2.4z"
        fill="currentColor"
      />
    </svg>
  )
}
