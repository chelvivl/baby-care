import { useLayoutEffect, useRef, useState } from 'react'
import { TAB_LABELS, TAB_ORDER, type AppTab } from '../app/tabs'

type BottomNavProps = {
  active: AppTab
  onChange: (tab: AppTab) => void
}

const icons: Record<AppTab, string> = {
  home: '◎',
  sleep: '☾',
  feeding: '◔',
  settings: '⚙',
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Partial<Record<AppTab, HTMLButtonElement | null>>>({})
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })

  useLayoutEffect(() => {
    const updateIndicator = () => {
      const list = listRef.current
      const activeItem = itemRefs.current[active]
      if (!list || !activeItem) {
        return
      }

      const listRect = list.getBoundingClientRect()
      const itemRect = activeItem.getBoundingClientRect()

      setIndicator({
        left: itemRect.left - listRect.left,
        width: itemRect.width,
        ready: true,
      })
    }

    updateIndicator()
    window.addEventListener('resize', updateIndicator)
    return () => window.removeEventListener('resize', updateIndicator)
  }, [active])

  return (
    <nav className="bottom-nav" aria-label="Разделы приложения">
      <div className="bottom-nav__cloud" ref={listRef}>
        <span
          className={`bottom-nav__indicator${indicator.ready ? ' bottom-nav__indicator--ready' : ''}`}
          style={{
            transform: `translateX(${indicator.left}px)`,
            width: `${indicator.width}px`,
          }}
          aria-hidden="true"
        />
        {TAB_ORDER.map((tab) => {
          const isActive = tab === active
          return (
            <button
              key={tab}
              ref={(node) => {
                itemRefs.current[tab] = node
              }}
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
      </div>
    </nav>
  )
}
