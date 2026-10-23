import { useEffect, useRef, type ReactNode } from 'react'
import styles from './LayoutConfirm.module.css'

export default function LayoutConfirm({
  title,
  children,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  title: string
  children: ReactNode
  confirmLabel: string
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    return () => element.close()
  }, [])

  function finish(action: () => void) {
    // Close while mounted so the browser restores the invoking control's focus.
    dialog.current?.close()
    action()
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-layout-editor
      onCancel={(event) => {
        event.preventDefault()
        finish(onCancel)
      }}
      aria-label={title}
    >
      <h2>{title}</h2>
      <p>{children}</p>
      <div>
        <button type="button" autoFocus onClick={() => finish(onCancel)}>
          Cancel
        </button>
        <button
          type="button"
          data-destructive={destructive}
          onClick={() => finish(onConfirm)}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
