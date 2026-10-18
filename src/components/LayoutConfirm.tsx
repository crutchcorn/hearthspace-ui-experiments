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
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      data-layout-editor
      onCancel={onCancel}
      aria-label={title}
    >
      <h2>{title}</h2>
      <p>{children}</p>
      <div>
        <button autoFocus onClick={onCancel}>
          Cancel
        </button>
        <button data-destructive={destructive} onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </dialog>
  )
}
