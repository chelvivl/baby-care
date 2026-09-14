export type Baby = {
  id: string
  name: string
  /** ISO date YYYY-MM-DD (local calendar day of birth) */
  birthDate: string
  createdAt: string
}

export type BabiesState = {
  babies: Baby[]
  activeBabyId: string | null
}

export function createBabyId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `baby-${Date.now()}-${Math.random().toString(16).slice(2)}`
}
