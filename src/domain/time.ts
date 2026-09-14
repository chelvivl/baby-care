/** Local calendar day YYYY-MM-DD */
export function toLocalDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function addDaysToKey(key: string, delta: number): string {
  const date = parseLocalDateKey(key)
  date.setDate(date.getDate() + delta)
  return toLocalDateKey(date)
}

export function formatDayTitleRu(key: string): string {
  const date = parseLocalDateKey(key)
  const today = toLocalDateKey(new Date())
  const yesterday = addDaysToKey(today, -1)

  if (key === today) {
    return 'Сегодня'
  }
  if (key === yesterday) {
    return 'Вчера'
  }

  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(date)
}

/** datetime-local value */
export function toDateTimeLocalValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function fromDateTimeLocalValue(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value.trim())
  if (!match) {
    return null
  }
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    0,
    0,
  )
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatTimeRu(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDateTimeShortRu(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function formatDurationRu(ms: number): string {
  const totalMinutes = Math.max(0, Math.floor(ms / 60_000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (hours === 0) {
    return `${minutes} мин`
  }
  if (minutes === 0) {
    return `${hours} ч`
  }
  return `${hours} ч ${minutes} мин`
}

export function formatTimerClock(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const mm = String(minutes).padStart(2, '0')
  const ss = String(seconds).padStart(2, '0')
  if (hours > 0) {
    return `${hours}:${mm}:${ss}`
  }
  return `${mm}:${ss}`
}
