import { useRef, useState, type ReactNode } from 'react'
import { TAB_ORDER, type AppTab } from './app/tabs'
import { BottomNav } from './components/BottomNav'
import { InstallBanner } from './components/InstallBanner'
import { useBabies } from './hooks/useBabies'
import { SleepProvider, useSleepContext } from './hooks/SleepContext'
import { formatDurationRu, toLocalDateKey } from './domain/time'
import { HomePage } from './pages/HomePage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SettingsPage } from './pages/SettingsPage'
import { SleepPage } from './pages/SleepPage'

type BabiesApi = ReturnType<typeof useBabies>

function AppContent({ babies }: { babies: BabiesApi }) {
  const [tab, setTab] = useState<AppTab>('home')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const previousTab = useRef<AppTab>('home')
  const sleep = useSleepContext()
  const todaySleepMs = sleep.totalForDay(toLocalDateKey(new Date()))

  const handleTabChange = (next: AppTab) => {
    if (next === tab) {
      return
    }

    const from = TAB_ORDER.indexOf(previousTab.current)
    const to = TAB_ORDER.indexOf(next)
    setDirection(to >= from ? 'forward' : 'back')
    previousTab.current = next
    setTab(next)
  }

  let content: ReactNode

  if (tab === 'sleep') {
    content = (
      <SleepPage
        activeBaby={babies.activeBaby}
        onOpenSettings={() => handleTabChange('settings')}
      />
    )
  } else if (tab === 'feeding') {
    content = (
      <PlaceholderPage
        title="Кормление"
        description="Здесь будут записи кормлений: время, тип, объём или длительность."
      />
    )
  } else if (tab === 'settings') {
    content = (
      <SettingsPage
        babies={babies.babies}
        activeBabyId={babies.activeBabyId}
        onCreate={babies.create}
        onUpdate={babies.update}
        onRemove={babies.remove}
        onSelect={babies.select}
      />
    )
  } else {
    content = (
      <HomePage
        activeBaby={babies.activeBaby}
        todaySleepLabel={todaySleepMs > 0 ? formatDurationRu(todaySleepMs) : null}
        sleepInProgress={Boolean(sleep.activeTimer)}
        onOpenSettings={() => handleTabChange('settings')}
        onOpenSleep={() => handleTabChange('sleep')}
      />
    )
  }

  return (
    <div className="app-shell">
      <main className="app-shell__main">
        <div
          key={tab}
          className={`app-shell__pane app-shell__pane--${direction}`}
        >
          {content}
        </div>
      </main>
      <InstallBanner />
      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  )
}

function App() {
  const babies = useBabies()

  return (
    <SleepProvider babyId={babies.activeBaby?.id ?? null}>
      <AppContent babies={babies} />
    </SleepProvider>
  )
}

export default App
