import {
  useContext,
  useLayoutEffect,
  useId,
  useRef,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { X } from '../../../components/icons'
import { SettingsDialogContext } from '../constants/settings-dialog-context'
import styles from './wireless-dialog.module.css'
import scopeStyles from './settings-dialog-boundary.module.css'

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
  const scope = useContext(SettingsDialogContext)
  const host = scope?.host
  const registerDialog = scope?.registerDialog

  useLayoutEffect(() => {
    const element = dialog.current
    if (!element) return
    const unregister = registerDialog?.(element)
    if (host) element.show()
    else element.showModal()
    const focus =
      element.querySelector<HTMLElement>(
        '[autofocus], input:not(:disabled):not([type="checkbox"]):not([type="hidden"]), select:not(:disabled)',
      ) ?? element.querySelector<HTMLElement>('footer button:not(:disabled)')
    focus?.focus({ preventScroll: true })
    return () => {
      unregister?.()
      element.close()
    }
  }, [host, registerDialog])

  function close() {
    onClose()
  }

  const content = (
    <dialog
      ref={dialog}
      className={`${styles.dialog}${scope ? ` ${scopeStyles.dialog}` : ''}`}
      data-window-dialog={scope ? '' : undefined}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        close()
      }}
      onKeyDown={(event) => {
        event.stopPropagation()
        if (!scope) return
        if (event.key === 'Escape') {
          event.preventDefault()
          close()
        }
        if (event.key === 'Tab') {
          const fields = [
            ...event.currentTarget.querySelectorAll<HTMLElement>(
              'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]',
            ),
          ].filter((field) => field.getClientRects().length > 0)
          const first = fields[0]
          const last = fields.at(-1)
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last?.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first?.focus()
          }
        }
      }}
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

  if (!scope) return content
  return host
    ? createPortal(<div className={scopeStyles.backdrop}>{content}</div>, host)
    : null
}
