import { useLayoutEffect, useId, useRef, type ReactNode } from 'react'
import { X } from '../../../components/icons'
import styles from './wireless-dialog.module.css'

interface WirelessDialogProps {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
  actions?: ReactNode
}

export default function WirelessDialog({
  title,
  description,
  onClose,
  children,
  actions,
}: WirelessDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  useLayoutEffect(() => {
    const element = dialog.current!
    element.showModal()
    const focus =
      element.querySelector<HTMLElement>(
        '[autofocus], input:not(:disabled):not([type="checkbox"]):not([type="hidden"]), select:not(:disabled)',
      ) ?? element.querySelector<HTMLElement>('footer button:not(:disabled)')
    focus?.focus({ preventScroll: true })
    return () => element.close()
  }, [])

  function close() {
    dialog.current?.close()
    onClose()
  }

  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <header className={styles.header}>
        <div>
          <h2 id={titleId}>{title}</h2>
          {description && <p id={descriptionId}>{description}</p>}
        </div>
        <button
          type="button"
          className={styles.close}
          aria-label="Close dialog"
          title="Close"
          onClick={close}
        >
          <X size={18} />
        </button>
      </header>
      <div className={styles.body}>{children}</div>
      {actions && <footer className={styles.actions}>{actions}</footer>}
    </dialog>
  )
}
