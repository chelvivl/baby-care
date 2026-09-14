import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Baby } from '../domain/baby'
import {
  addBaby,
  loadBabiesState,
  removeBaby,
  saveBabiesState,
  setActiveBaby,
  updateBaby,
} from '../storage/babiesStore'

export function useBabies() {
  const [state, setState] = useState(() => loadBabiesState())

  useEffect(() => {
    saveBabiesState(state)
  }, [state])

  const activeBaby = useMemo(
    () => state.babies.find((baby) => baby.id === state.activeBabyId) ?? null,
    [state.babies, state.activeBabyId],
  )

  const create = useCallback((input: { name: string; birthDate: string }) => {
    setState((prev) => addBaby(prev, input))
  }, [])

  const update = useCallback(
    (id: string, input: { name: string; birthDate: string }) => {
      setState((prev) => updateBaby(prev, id, input))
    },
    [],
  )

  const remove = useCallback((id: string) => {
    setState((prev) => removeBaby(prev, id))
  }, [])

  const select = useCallback((id: string) => {
    setState((prev) => setActiveBaby(prev, id))
  }, [])

  return {
    babies: state.babies as Baby[],
    activeBaby,
    activeBabyId: state.activeBabyId,
    create,
    update,
    remove,
    select,
  }
}
