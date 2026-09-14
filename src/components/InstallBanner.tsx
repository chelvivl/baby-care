import { useEffect, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  }, [])

  if (hidden || !deferred) {
    return null
  }

  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true

  if (isStandalone) {
    return null
  }

  return (
    <aside className="install-banner">
      <div>
        <p className="install-banner__title">Добавить на экран</p>
        <p className="install-banner__text">
          На iPhone: «Поделиться» → «На экран Домой». После обновлений иногда нужно
          удалить иконку и добавить снова — иначе status bar останется белой полосой.
        </p>
      </div>
      <div className="install-banner__actions">
        <button
          type="button"
          className="install-banner__primary"
          onClick={async () => {
            await deferred.prompt()
            setHidden(true)
            setDeferred(null)
          }}
        >
          Установить
        </button>
        <button
          type="button"
          className="install-banner__ghost"
          onClick={() => setHidden(true)}
        >
          Позже
        </button>
      </div>
    </aside>
  )
}
