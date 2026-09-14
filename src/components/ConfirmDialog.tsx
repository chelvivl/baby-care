import { useEffect } from 'react'
import { createPortal } from 'react-dom'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Удалить',
  cancelLabel = 'Отмена',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onCancel])

  if (!open || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="sheet-root" role="presentation">
      <button
        type="button"
        className="sheet-backdrop"
        aria-label="Закрыть"
        onClick={onCancel}
      />
      <div
        className="sheet"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-sheet-title"
        aria-describedby="confirm-sheet-desc"
      >
        <div className="sheet__handle" aria-hidden="true" />
        <h2 id="confirm-sheet-title" className="sheet__title">
          {title}
        </h2>
        <p id="confirm-sheet-desc" className="sheet__text">
          {message}
        </p>
        <div className="sheet__actions">
          <button
            type="button"
            className={`sheet__btn ${danger ? 'sheet__btn--danger' : 'sheet__btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
          <button type="button" className="sheet__btn sheet__btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
