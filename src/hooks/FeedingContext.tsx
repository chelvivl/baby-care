import {
  createContext,
  useContext,
  type ReactNode,
} from 'react'
import { useFeeding } from './useFeeding'

type FeedingContextValue = ReturnType<typeof useFeeding>

const FeedingContext = createContext<FeedingContextValue | null>(null)

export function FeedingProvider({
  babyId,
  babyName,
  children,
}: {
  babyId: string | null
  babyName?: string | null
  children: ReactNode
}) {
  const value = useFeeding(babyId, babyName)
  return (
    <FeedingContext.Provider value={value}>{children}</FeedingContext.Provider>
  )
}

export function useFeedingContext(): FeedingContextValue {
  const value = useContext(FeedingContext)
  if (!value) {
    throw new Error('useFeedingContext must be used within FeedingProvider')
  }
  return value
}
