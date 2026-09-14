import { useLayoutEffect, useRef, useState } from 'react'
import { TAB_LABELS, TAB_ORDER, type AppTab } from '../app/tabs'

type BottomNavProps = {
  active: AppTab
  onChange: (tab: AppTab) => void
}

function TabIcon({ tab }: { tab: AppTab }) {
  if (tab === 'home') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M4.5 10.8 12 4.5l7.5 6.3V19a1.5 1.5 0 0 1-1.5 1.5h-3.2v-5.1h-5.6V20.5H6A1.5 1.5 0 0 1 4.5 19v-8.2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (tab === 'sleep') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M14.2 4.4A7.8 7.8 0 1 0 19.6 14 6.4 6.4 0 0 1 14.2 4.4Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  if (tab === 'feeding') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M8 4.5v6.2a4 4 0 0 0 8 0V4.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M12 14.7V19.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
        <path
          d="M9 19.5h6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3.1" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 3.6v2.2M12 18.2v2.2M3.6 12h2.2M18.2 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BottomNav({ active, onChange }: BottomNavProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0, ready: false })
  const activeIndex = TAB_ORDER.indexOf(active)

  useLayoutEffect(() => {
    const list = listRef.current
    if (!list) {
      return
    }

    const updateIndicator = () => {
      const styles = getComputedStyle(list)
      const padLeft = Number.parseFloat(styles.paddingLeft) || 0
      const padRight = Number.parseFloat(styles.paddingRight) || 0
      const innerWidth = list.clientWidth - padLeft - padRight
      if (innerWidth <= 0) {
        return
      }

      const width = innerWidth / TAB_ORDER.length
      setIndicator({
        left: padLeft + activeIndex * width,
        width,
        ready: true,
      })
    }

    updateIndicator()

    const observer = new ResizeObserver(() => updateIndicator())
    observer.observe(list)

    let cancelled = false
    void document.fonts.ready.then(() => {
      if (!cancelled) {
        updateIndicator()
      }
    })

    const raf = window.requestAnimationFrame(updateIndicator)
    const timeout = window.setTimeout(updateIndicator, 120)

    window.addEventListener('resize', updateIndicator)
    return () => {
      cancelled = true
      observer.disconnect()
      window.cancelAnimationFrame(raf)
      window.clearTimeout(timeout)
      window.removeEventListener('resize', updateIndicator)
    }
  }, [activeIndex])

  return (
    <nav className="bottom-nav" aria-label="Разделы приложения">
      <div className="bottom-nav__cloud" ref={listRef}>
        <span
          className={`bottom-nav__indicator${indicator.ready ? ' bottom-nav__indicator--ready' : ''}`}
          style={{
            transform: `translate3d(${indicator.left}px, 0, 0)`,
            width: `${indicator.width}px`,
          }}
          aria-hidden="true"
        />
        {TAB_ORDER.map((tab) => {
          const isActive = tab === active
          return (
            <button
              key={tab}
              type="button"
              className={`bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(tab)}
            >
              <span className="bottom-nav__icon">
                <TabIcon tab={tab} />
              </span>
              <span className="bottom-nav__label">{TAB_LABELS[tab]}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
