import { useRef, useState } from 'react'
import type { AppTab } from './app/tabs'
import { BottomNav } from './components/BottomNav'
import { InstallBanner } from './components/InstallBanner'
import { HomePage } from './pages/HomePage'
import { PlaceholderPage } from './pages/PlaceholderPage'

const TAB_ORDER: AppTab[] = ['home', 'sleep', 'feeding', 'more']

function renderTab(tab: AppTab) {
  if (tab === 'sleep') {
    return (
      <PlaceholderPage
        title="Сон"
        description="Здесь появится таймер сна, история и статистика по вашему ТЗ."
      />
    )
  }

  if (tab === 'feeding') {
    return (
      <PlaceholderPage
        title="Кормление"
        description="Здесь будут записи кормлений: время, тип, объём или длительность."
      />
    )
  }

  if (tab === 'more') {
    return (
      <PlaceholderPage
        title="Ещё"
        description="Настройки профиля малыша, экспорт данных и дополнительные разделы."
      />
    )
  }

  return <HomePage />
}

function App() {
  const [tab, setTab] = useState<AppTab>('home')
  const [direction, setDirection] = useState<'forward' | 'back'>('forward')
  const previousTab = useRef<AppTab>('home')

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

  return (
    <div className="app-shell">
      <main className="app-shell__main">
        <div
          key={tab}
          className={`app-shell__pane app-shell__pane--${direction}`}
        >
          {renderTab(tab)}
        </div>
      </main>
      <InstallBanner />
      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  )
}

export default App
