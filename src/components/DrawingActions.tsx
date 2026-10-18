import { useEffect, useId, useRef, useState } from 'react'
import { Check, Pin, PinOff, Trash2 } from 'lucide-react'
import { clamp, type Bounds } from '../desktop'
import type { CanvasDrawing, DrawingLayerName } from '../drawings'
import { getWindowClearance } from '../window-layout'
import styles from './DrawingActions.module.css'
import shellStyles from './ShellControls.module.css'

interface DrawingActionsProps {
  drawing: CanvasDrawing
  view: Bounds
  editing: boolean
  onLayerChange: (layer: DrawingLayerName) => void
  onDelete: () => void
  onFinish: () => void
}

type Action = 'layer' | 'delete' | 'finish'

export default function DrawingActions({
  drawing,
  view,
  editing,
  onLayerChange,
  onDelete,
  onFinish,
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
  const height = editing ? 150 : 102
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
  const pinned = drawing.layer === 'above'
  const PinIcon = pinned ? PinOff : Pin
  const labels = {
    layer: pinned ? 'Move drawing below windows' : 'Keep drawing above windows',
    delete: 'Delete drawing',
    finish: 'Finish drawing',
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
          aria-pressed={pinned}
          aria-label={labels.layer}
          aria-describedby={hint === 'layer' ? hintId : undefined}
          onPointerEnter={() => showHint('layer')}
          onPointerLeave={hideHint}
          onFocus={() => showHint('layer')}
          onBlur={hideHint}
          onClick={() => {
            hideHint()
            onLayerChange(pinned ? 'below' : 'above')
          }}
        >
          <PinIcon size={18} aria-hidden="true" />
        </button>
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
