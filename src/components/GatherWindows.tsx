import { useEffect, useId, useRef, useState } from 'react'
import type { Bounds, DesktopWindow } from '../desktop'
import { clamp } from '../desktop'
import { getWindowClearance } from '../window-layout'
import styles from './GatherWindows.module.css'
import shellStyles from './ShellControls.module.css'

interface GatherWindowsProps {
  windows: DesktopWindow[]
  view: Bounds
  enabled: boolean
  downloading: boolean
}

export default function GatherWindows({
  windows,
  view,
  enabled,
  downloading,
}: GatherWindowsProps) {
  const [hint, setHint] = useState<'label' | 'preview' | null>(null)
  const hintId = useId()
  const timeout = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timeout.current), [])

  if (
    !windows.some(
      (item) =>
        item.x < view.x + view.width &&
        item.x + item.width > view.x &&
        item.y < view.y + view.height &&
        item.y + item.height > view.y,
    )
  )
    return null

  const left = Math.min(...windows.map((item) => item.x)) - view.x
  const right = Math.max(...windows.map((item) => item.x + item.width)) - view.x
  const top = Math.min(...windows.map((item) => item.y)) - view.y
  const clearance = getWindowClearance(view.width)
  const size = 54
  const gap = 12
  const fitsRight = right + gap + size <= view.width - clearance.side
  const fitsLeft = left - gap - size >= clearance.side
  const x = clamp(
    fitsRight ? right + gap : fitsLeft ? left - gap - size : right - size - gap,
    clearance.side,
    Math.max(clearance.side, view.width - clearance.side - size),
  )
  const y = clamp(
    fitsRight || fitsLeft
      ? top
      : top - size - gap >= clearance.top
        ? top - size - gap
        : Math.max(top, clearance.top) + 44 + gap,
    clearance.top,
    Math.max(clearance.top, view.height - clearance.bottom - size),
  )

  function showHint(nextHint: 'label' | 'preview') {
    window.clearTimeout(timeout.current)
    setHint(nextHint)
    timeout.current = window.setTimeout(() => setHint(null), 2500)
  }

  function hideHint() {
    window.clearTimeout(timeout.current)
    setHint(null)
  }

  return (
    <div className={styles.anchor} style={{ left: x, top: y }}>
      <div className={`${styles.surface} ${shellStyles.surface}`}>
        <button
          type="button"
          className={`${styles.button} ${shellStyles.control}`}
          aria-label="Gather similar windows"
          aria-disabled={!enabled}
          aria-describedby={hint ? hintId : undefined}
          onPointerEnter={() => showHint('label')}
          onPointerLeave={hideHint}
          onFocus={() => showHint('label')}
          onBlur={hideHint}
          onClick={() => showHint(enabled ? 'preview' : 'label')}
        >
          <svg
            width={22}
            height={22}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M16 7V4a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h4" />
            <rect x={8} y={9} width={14} height={12} rx={1} />
          </svg>
        </button>
      </div>
      {hint && (
        <div
          id={hintId}
          role="tooltip"
          className={styles.tooltip}
          style={{
            left: clamp(x, 12, Math.max(12, view.width - 242)) - x,
            top: y + size + 84 < view.height - clearance.bottom ? size + 8 : -8,
            transform:
              y + size + 84 < view.height - clearance.bottom
                ? undefined
                : 'translateY(-100%)',
          }}
        >
          <strong>Gather similar windows</strong>
          <span>
            {!enabled
              ? downloading
                ? 'Available when the AI download finishes.'
                : 'Enable in Settings → AI.'
              : hint === 'preview'
                ? 'Preview only. Your windows stay where they are.'
                : 'Bring related windows into view.'}
          </span>
        </div>
      )}
    </div>
  )
}
