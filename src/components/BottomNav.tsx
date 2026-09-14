import type { AppTab } from '../app/tabs'
import { TAB_LABELS } from '../app/tabs'

type BottomNavProps = {
  active: AppTab
  onChange: (tab: AppTab) => void
}

const tabs: AppTab[] = ['home', 'sleep', 'feeding', 'more']

const icons: Record<AppTab, string> = {
  home: '◎',
  sleep: '☾',
  feeding: '◔',
  more: '⋯',
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Разделы приложения">
      {tabs.map((tab) => {
        const isActive = tab === active
        return (
          <button
            key={tab}
            type="button"
            className={`bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onChange(tab)}
          >
            <span className="bottom-nav__icon" aria-hidden="true">
              {icons[tab]}
            </span>
            <span className="bottom-nav__label">{TAB_LABELS[tab]}</span>
          </button>
        )
      })}
    </nav>
  )
}
