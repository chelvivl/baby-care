import { useState } from 'react'
import type { AppTab } from './app/tabs'
import { BottomNav } from './components/BottomNav'
import { InstallBanner } from './components/InstallBanner'
import { HomePage } from './pages/HomePage'
import { PlaceholderPage } from './pages/PlaceholderPage'

function App() {
  const [tab, setTab] = useState<AppTab>('home')

  let content = <HomePage />

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
  } else if (tab === 'more') {
    content = (
      <PlaceholderPage
        title="Ещё"
        description="Настройки профиля малыша, экспорт данных и дополнительные разделы."
      />
    )
  }

  return (
    <div className="app-shell">
      <main className="app-shell__main">{content}</main>
      <InstallBanner />
      <BottomNav active={tab} onChange={setTab} />
    </div>
  )
}

export default App
