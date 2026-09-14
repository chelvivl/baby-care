import { createBabyId, type BabiesState, type Baby } from '../domain/baby'

const STORAGE_KEY = 'baby-care.babies.v1'

const EMPTY: BabiesState = {
  babies: [],
  activeBabyId: null,
}

export function loadBabiesState(): BabiesState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return EMPTY
    }

    const parsed = JSON.parse(raw) as Partial<BabiesState>
    const babies = Array.isArray(parsed.babies)
      ? parsed.babies.filter(isBaby).map(normalizeBaby)
      : []

    const activeBabyId =
      typeof parsed.activeBabyId === 'string' &&
      babies.some((baby) => baby.id === parsed.activeBabyId)
        ? parsed.activeBabyId
        : babies[0]?.id ?? null

    return { babies, activeBabyId }
  } catch {
    return EMPTY
  }
}

export function saveBabiesState(state: BabiesState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function addBaby(
  state: BabiesState,
  input: { name: string; birthDate: string },
): BabiesState {
  const baby: Baby = {
    id: createBabyId(),
    name: input.name.trim(),
    birthDate: input.birthDate,
    createdAt: new Date().toISOString(),
  }

  return {
    babies: [...state.babies, baby],
    activeBabyId: state.activeBabyId ?? baby.id,
  }
}

export function updateBaby(
  state: BabiesState,
  id: string,
  input: { name: string; birthDate: string },
): BabiesState {
  return {
    ...state,
    babies: state.babies.map((baby) =>
      baby.id === id
        ? {
            ...baby,
            name: input.name.trim(),
            birthDate: input.birthDate,
          }
        : baby,
    ),
  }
}

export function removeBaby(state: BabiesState, id: string): BabiesState {
  const babies = state.babies.filter((baby) => baby.id !== id)
  const activeBabyId =
    state.activeBabyId === id ? babies[0]?.id ?? null : state.activeBabyId

  return { babies, activeBabyId }
}

export function setActiveBaby(state: BabiesState, id: string): BabiesState {
  if (!state.babies.some((baby) => baby.id === id)) {
    return state
  }
  return { ...state, activeBabyId: id }
}

function isBaby(value: unknown): value is Baby {
  if (!value || typeof value !== 'object') {
    return false
  }
  const baby = value as Baby
  return (
    typeof baby.id === 'string' &&
    typeof baby.name === 'string' &&
    typeof baby.birthDate === 'string' &&
    typeof baby.createdAt === 'string'
  )
}

function normalizeBaby(baby: Baby): Baby {
  return {
    id: baby.id,
    name: baby.name.trim(),
    birthDate: baby.birthDate,
    createdAt: baby.createdAt,
  }
}
