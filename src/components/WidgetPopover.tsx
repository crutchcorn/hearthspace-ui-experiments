import { useContext, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { WidgetPopoverContext } from './widget-popover-context'
import styles from './WidgetPopover.module.css'

/** Only a detached control's popup leaves the canvas stacking context. */
export default function WidgetPopover({ children }: { children: ReactNode }) {
  const placement = useContext(WidgetPopoverContext)
  if (!placement) return children
  if (!placement.host) return null
  return createPortal(
    <div
      className={styles.anchor}
      style={placement.style}
      data-widget-popover={placement.id}
      data-shell-controls
    >
      {children}
    </div>,
    placement.host,
  )
}
