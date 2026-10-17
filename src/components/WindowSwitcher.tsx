import { useLayoutEffect, type RefObject } from 'react'
import styles from './WindowSwitcher.module.css'

interface WindowSwitcherProps {
  title: string
  position: { x: number; y: number; width: number }
  focusTarget: RefObject<HTMLDivElement | null>
}

export default function WindowSwitcher({
  title,
  position,
  focusTarget,
}: WindowSwitcherProps) {
  useLayoutEffect(() => {
    focusTarget.current?.focus({ preventScroll: true })
  }, [focusTarget])

  return (
    <div
      className={styles.caption}
      data-window-switcher
      aria-hidden="true"
      style={{ left: position.x, top: position.y, width: position.width }}
    >
      <span>{title}</span>
    </div>
  )
}
