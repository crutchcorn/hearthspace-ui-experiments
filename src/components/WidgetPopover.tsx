import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { WidgetPopoverContext } from './widget-popover-context'
import styles from './WidgetPopover.module.css'

/** Popups leave their control's stack so frame attachments can't cover them. */
export default function WidgetPopover({ children }: { children: ReactNode }) {
  const placement = useContext(WidgetPopoverContext)
  if (!placement) return children
  if (!placement.host) return null
  return createPortal(
    <div
      className={styles.anchor}
      style={placement.style}
      data-widget-popover={placement.id}
      data-frame-edge={placement.edge}
      data-shell-controls
    >
      {children}
    </div>,
    placement.host,
  )
}
