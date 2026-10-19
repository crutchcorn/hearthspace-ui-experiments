import { useEffect, useId, useRef, useState } from 'react'
import { Check, FrameLayout, Play, Trash2 } from '../icons'
import { clamp, type Bounds } from '../desktop'
import type { CanvasDrawing } from '../drawings'
import { getWindowClearance } from '../window-layout'
import styles from './DrawingActions.module.css'
import shellStyles from './ShellControls.module.css'

interface DrawingActionsProps {
  drawing: CanvasDrawing
  view: Bounds
  editing: boolean
  onChangeLayout: () => void
  onDelete: () => void
  onFinish: () => void
  onPlay?: () => boolean
}

type Action = 'layout' | 'delete' | 'finish' | 'play' | 'no-match'

export default function DrawingActions({
  drawing,
  view,
  editing,
  onChangeLayout,
  onDelete,
  onFinish,
  onPlay,
}: DrawingActionsProps) {
  const [hint, setHint] = useState<Action | null>(null)
  const hintId = useId()
  const hintTimeout = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(hintTimeout.current), [])

  if (
    drawing.x >= view.x + view.width ||
    drawing.x + drawing.width <= view.x ||
    drawing.y >= view.y + view.height ||
    drawing.y + drawing.height <= view.y
  )
    return null

  const clearance = getWindowClearance(view.width)
  const width = 54
  const height = 102 + (editing ? 48 : 0) + (onPlay ? 48 : 0)
  const gap = 14
  const right = drawing.x - view.x + drawing.width + gap
  const left = drawing.x - view.x - width - gap
  const x = clamp(
    right + width <= view.width - clearance.side ? right : left,
    clearance.side,
    Math.max(clearance.side, view.width - clearance.side - width),
  )
  const y = clamp(
    drawing.y - view.y + (drawing.height - height) / 2,
    clearance.top,
    Math.max(clearance.top, view.height - clearance.bottom - height),
  )
  const labels = {
    layout: 'Change layout',
    delete: 'Delete drawing',
    finish: 'Finish drawing',
    play: 'Launch matching app',
    'no-match': 'No match found',
  }

  function showHint(action: Action) {
    window.clearTimeout(hintTimeout.current)
    setHint(action)
    hintTimeout.current = window.setTimeout(() => setHint(null), 2500)
  }

  function hideHint() {
    window.clearTimeout(hintTimeout.current)
    setHint(null)
  }

  return (
    <div
      className={styles.anchor}
      data-drawing-actions
      style={{ left: x, top: y }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div
        className={`${styles.surface} ${shellStyles.surface}`}
        role="group"
        aria-label="Drawing actions"
      >
        <button
          type="button"
          className={`${styles.button} ${shellStyles.control}`}
          aria-label={labels.layout}
          aria-describedby={hint === 'layout' ? hintId : undefined}
          onPointerEnter={() => showHint('layout')}
          onPointerLeave={hideHint}
          onFocus={() => showHint('layout')}
          onBlur={hideHint}
          onClick={() => {
            hideHint()
            onChangeLayout()
          }}
        >
          <FrameLayout size={18} aria-hidden="true" />
        </button>
        {onPlay && (
          <button
            type="button"
            className={`${styles.button} ${shellStyles.control}`}
            aria-label={labels.play}
            aria-describedby={
              hint === 'play' || hint === 'no-match' ? hintId : undefined
            }
            onPointerEnter={() => showHint('play')}
            onPointerLeave={() => {
              if (hint !== 'no-match') hideHint()
            }}
            onFocus={() => showHint('play')}
            onBlur={() => {
              if (hint !== 'no-match') hideHint()
            }}
            onClick={() => {
              if (!onPlay()) showHint('no-match')
            }}
          >
            <Play size={18} aria-hidden="true" />
          </button>
        )}
        <button
          type="button"
          className={`${styles.button} ${styles.deleteButton} ${shellStyles.control}`}
          aria-label={labels.delete}
          aria-describedby={hint === 'delete' ? hintId : undefined}
          onPointerEnter={() => showHint('delete')}
          onPointerLeave={hideHint}
          onFocus={() => showHint('delete')}
          onBlur={hideHint}
          onClick={() => {
            hideHint()
            onDelete()
          }}
        >
          <Trash2 size={18} aria-hidden="true" />
        </button>
        {editing && (
          <button
            type="button"
            className={`${styles.button} ${shellStyles.control}`}
            aria-label={labels.finish}
            aria-describedby={hint === 'finish' ? hintId : undefined}
            onPointerEnter={() => showHint('finish')}
            onPointerLeave={hideHint}
            onFocus={() => showHint('finish')}
            onBlur={hideHint}
            onClick={() => {
              hideHint()
              onFinish()
            }}
          >
            <Check size={19} aria-hidden="true" />
          </button>
        )}
      </div>
      {hint && (
        <span
          id={hintId}
          role="tooltip"
          className={styles.tooltip}
          style={{
            left: clamp(x, 12, Math.max(12, view.width - 242)) - x,
            top: y >= clearance.top + 48 ? -8 : height + 8,
            transform:
              y >= clearance.top + 48 ? 'translateY(-100%)' : undefined,
          }}
        >
          {labels[hint]}
        </span>
      )}
    </div>
  )
}
