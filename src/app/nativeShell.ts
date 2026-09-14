/** Ограничения поведения браузера — ближе к нативному приложению. */
export function applyNativeAppBehavior() {
  ensureIosStandaloneClass()
  ensureIosStatusBarMeta()

  const blockPinchZoom = (event: Event) => {
    event.preventDefault()
  }

  document.addEventListener('gesturestart', blockPinchZoom, { passive: false })
  document.addEventListener('gesturechange', blockPinchZoom, { passive: false })
  document.addEventListener('gestureend', blockPinchZoom, { passive: false })

  document.addEventListener(
    'touchmove',
    (event) => {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    },
    { passive: false },
  )

  document.addEventListener(
    'wheel',
    (event) => {
      if (event.ctrlKey) {
        event.preventDefault()
      }
    },
    { passive: false },
  )

  document.addEventListener('contextmenu', (event) => {
    const target = event.target
    if (!(target instanceof HTMLElement)) {
      return
    }
    if (target.closest('input, textarea, [contenteditable="true"]')) {
      return
    }
    event.preventDefault()
  })
}

function ensureIosStandaloneClass() {
  const nav = window.navigator as Navigator & { standalone?: boolean }
  const standalone =
    nav.standalone === true ||
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches

  document.documentElement.classList.toggle('ios-standalone', standalone)
}

/** iOS caches this meta; keep it explicit for installed PWAs. */
function ensureIosStatusBarMeta() {
  const name = 'apple-mobile-web-app-status-bar-style'
  let meta = document.querySelector(`meta[name="${name}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', name)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', 'black-translucent')

  let capable = document.querySelector('meta[name="apple-mobile-web-app-capable"]')
  if (!capable) {
    capable = document.createElement('meta')
    capable.setAttribute('name', 'apple-mobile-web-app-capable')
    document.head.appendChild(capable)
  }
  capable.setAttribute('content', 'yes')
}
