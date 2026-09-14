export type BabyAge = {
  years: number
  months: number
  days: number
  totalWeeks: number
  weekDays: number
  totalDays: number
  totalHours: number
  totalMinutes: number
  isFuture: boolean
  isToday: boolean
}

/** Birth at local midnight of birthDate; age relative to `now`. */
export function calculateAge(birthDateIso: string, now = new Date()): BabyAge {
  const birth = parseLocalDate(birthDateIso)
  if (!birth) {
    return emptyAge()
  }

  const birthMs = birth.getTime()
  const nowMs = now.getTime()

  if (nowMs < birthMs) {
    return { ...emptyAge(), isFuture: true }
  }

  const totalMinutes = Math.floor((nowMs - birthMs) / 60_000)
  const totalHours = Math.floor(totalMinutes / 60)
  const totalDays = Math.floor((startOfLocalDay(now).getTime() - birthMs) / 86_400_000)
  const totalWeeks = Math.floor(totalDays / 7)
  const weekDays = totalDays % 7

  let years = now.getFullYear() - birth.getFullYear()
  let months = now.getMonth() - birth.getMonth()
  let days = now.getDate() - birth.getDate()

  if (days < 0) {
    months -= 1
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0)
    days += prevMonth.getDate()
  }

  if (months < 0) {
    years -= 1
    months += 12
  }

  return {
    years,
    months,
    days,
    totalWeeks,
    weekDays,
    totalDays,
    totalHours,
    totalMinutes,
    isFuture: false,
    isToday: totalDays === 0,
  }
}

export function formatBirthDateRu(birthDateIso: string): string {
  const birth = parseLocalDate(birthDateIso)
  if (!birth) {
    return birthDateIso
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(birth)
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const last = abs % 10
  if (abs > 10 && abs < 20) {
    return many
  }
  if (last === 1) {
    return one
  }
  if (last >= 2 && last <= 4) {
    return few
  }
  return many
}

export function unitRu(
  n: number,
  forms: [string, string, string],
): string {
  return `${n} ${pluralRu(n, forms[0], forms[1], forms[2])}`
}

/** Primary calendar line: years/months/days, or "сегодня" for day 0. */
export function formatCalendarAge(age: BabyAge): string {
  if (age.isFuture) {
    return 'Дата рождения ещё не наступила'
  }
  if (age.isToday) {
    return 'Сегодня — день рождения'
  }

  const parts: string[] = []
  if (age.years > 0) {
    parts.push(unitRu(age.years, ['год', 'года', 'лет']))
  }
  if (age.months > 0 || age.years > 0) {
    if (age.months > 0 || age.years === 0) {
      parts.push(unitRu(age.months, ['месяц', 'месяца', 'месяцев']))
    }
  }
  if (age.days > 0 || parts.length === 0) {
    parts.push(unitRu(age.days, ['день', 'дня', 'дней']))
  }

  return parts.join(' ')
}

/** Weeks-focused line useful for infants. */
export function formatWeeksAge(age: BabyAge): string {
  if (age.isFuture || age.isToday) {
    return ''
  }

  if (age.totalWeeks === 0) {
    return unitRu(age.totalDays, ['день', 'дня', 'дней'])
  }

  const weeks = unitRu(age.totalWeeks, ['неделя', 'недели', 'недель'])
  if (age.weekDays === 0) {
    return weeks
  }
  return `${weeks} ${unitRu(age.weekDays, ['день', 'дня', 'дней'])}`
}

function parseLocalDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!match) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null
  }
  return date
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function emptyAge(): BabyAge {
  return {
    years: 0,
    months: 0,
    days: 0,
    totalWeeks: 0,
    weekDays: 0,
    totalDays: 0,
    totalHours: 0,
    totalMinutes: 0,
    isFuture: false,
    isToday: false,
  }
}
