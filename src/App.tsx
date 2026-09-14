import { useRef, useState, type ReactNode } from 'react'
import { TAB_ORDER, type AppTab } from './app/tabs'
import { BottomNav } from './components/BottomNav'
import { InstallBanner } from './components/InstallBanner'
import { useBabies } from './hooks/useBabies'
import { HomePage } from './pages/HomePage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { SettingsPage } from './pages/SettingsPage'

function App() {
  const [tab, setTab] = useState<AppTab>('home')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const previousTab = useRef<AppTab>('home')
  const babies = useBabies()

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
      <PlaceholderPage
        title="Сон"
        description="Здесь появится таймер сна, история и статистика по вашему ТЗ."
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
        onOpenSettings={() => handleTabChange('settings')}
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

export default App
