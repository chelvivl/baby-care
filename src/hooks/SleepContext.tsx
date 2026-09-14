import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import { useSleep } from '../hooks/useSleep'

type SleepContextValue = ReturnType<typeof useSleep>

const SleepContext = createContext<SleepContextValue | null>(null)

export function SleepProvider({
  babyId,
  children,
}: {
  babyId: string | null
  children: ReactNode
}) {
  const value = useSleep(babyId)
  return <SleepContext.Provider value={value}>{children}</SleepContext.Provider>
}

export function useSleepContext(): SleepContextValue {
  const value = useContext(SleepContext)
  if (!value) {
    throw new Error('useSleepContext must be used within SleepProvider')
  }
  return value
}
