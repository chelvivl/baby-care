/** Ограничения поведения браузера — ближе к нативному приложению. */
export function applyNativeAppBehavior() {
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
