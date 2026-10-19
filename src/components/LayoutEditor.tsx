import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import {
  Check,
  Layers2,
  PanelsTopLeft,
  Trash2,
  Wallpaper,
  Ungroup,
  List,
  Square,
} from 'lucide-react'
import type { LayoutTarget, ObjectPlacement } from '../frame-layout'
import styles from './LayoutEditor.module.css'
import shellStyles from './ShellControls.module.css'

interface LayoutEditorProps {
  target: LayoutTarget | null
  title: string
  placement: ObjectPlacement | null
  expanded?: boolean
  grouped: boolean
  onToggleExpanded: () => void
  onUngroup: () => void
  onPlacementChange: (placement: ObjectPlacement) => void
  onFrame: () => void
  onRemove: () => void
  onDone: () => void
  children?: ReactNode
}

const choices = [
  { label: 'Canvas', Icon: Layers2, surface: 'canvas' },
  { label: 'Background', Icon: Wallpaper, surface: 'background' },
  { label: 'Frame', Icon: PanelsTopLeft, surface: 'frame' },
] as const

export default function LayoutEditor({
  target,
  title,
  placement,
  expanded,
  grouped,
  onToggleExpanded,
  onUngroup,
  onPlacementChange,
  onFrame,
  onRemove,
  onDone,
  children,
}: LayoutEditorProps) {
  const [hint, setHint] = useState<string | null>(null)
  const hintId = useId()
  const hintTimeout = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(hintTimeout.current), [])

  function showHint(label: string) {
    window.clearTimeout(hintTimeout.current)
    setHint(label)
    hintTimeout.current = window.setTimeout(() => setHint(null), 2500)
  }

  function hideHint() {
    window.clearTimeout(hintTimeout.current)
    setHint(null)
  }

  function choosePlacement(choice: (typeof choices)[number]) {
    hideHint()
    if (choice.surface === 'frame') {
      onFrame()
      return
    }
    onPlacementChange({
      ...(placement?.surface === 'canvas' || placement?.surface === 'background'
        ? placement
        : {}),
      surface: choice.surface,
    })
  }

  const canRemove =
    target?.kind === 'widget' ||
    target?.kind === 'group' ||
    placement?.surface === 'frame'
  const removeLabel =
    target?.kind === 'widget' || target?.kind === 'group'
      ? 'Remove'
      : 'Remove from frame'

  return (
    <section
      className={styles.anchor}
      data-layout-editor
      aria-label="Change layout"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className={`${styles.editor} ${shellStyles.surface}`}>
        <div className={styles.header}>
          <span className={styles.title} title={target ? title : undefined}>
            {target ? title : 'Choose an item to place'}
          </span>
          <div className={styles.actions}>
            {target && canRemove && (
              <button
                type="button"
                className={`${styles.button} ${shellStyles.control}`}
                aria-label={removeLabel}
                aria-describedby={hint === removeLabel ? hintId : undefined}
                onPointerEnter={() => showHint(removeLabel)}
                onPointerLeave={hideHint}
                onFocus={() => showHint(removeLabel)}
                onBlur={hideHint}
                onClick={() => {
                  hideHint()
                  onRemove()
                }}
              >
                <Trash2 size={19} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              className={`${styles.button} ${shellStyles.control}`}
              aria-label="Done changing layout"
              aria-describedby={hint === 'Done' ? hintId : undefined}
              onPointerEnter={() => showHint('Done')}
              onPointerLeave={hideHint}
              onFocus={() => showHint('Done')}
              onBlur={hideHint}
              onClick={onDone}
            >
              <Check size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
        {target && (expanded !== undefined || grouped) && (
          <div className={styles.options}>
            {expanded !== undefined && (
              <button
                type="button"
                className={`${styles.option} ${shellStyles.control}`}
                onClick={onToggleExpanded}
                aria-label={expanded ? 'Shrink to icon' : 'Show details'}
              >
                {expanded ? (
                  <Square size={18} aria-hidden="true" />
                ) : (
                  <List size={18} aria-hidden="true" />
                )}
                <span>{expanded ? 'Icon only' : 'Show details'}</span>
              </button>
            )}
            {grouped && (
              <button
                type="button"
                className={`${styles.option} ${shellStyles.control}`}
                onClick={onUngroup}
                aria-label={
                  target.kind === 'group'
                    ? 'Ungroup items'
                    : 'Remove from group'
                }
              >
                <Ungroup size={18} aria-hidden="true" />
                <span>{target.kind === 'group' ? 'Ungroup' : 'Separate'}</span>
              </button>
            )}
          </div>
        )}
        {target && children}
        {target && (
          <div className={styles.placements} role="group" aria-label="Place on">
            {choices.map((choice) => {
              const active = placement?.surface === choice.surface
              return (
                <button
                  key={choice.label}
                  type="button"
                  className={`${styles.button} ${shellStyles.control}`}
                  aria-label={choice.label}
                  aria-pressed={active}
                  aria-describedby={hint === choice.label ? hintId : undefined}
                  onPointerEnter={() => showHint(choice.label)}
                  onPointerLeave={hideHint}
                  onFocus={() => showHint(choice.label)}
                  onBlur={hideHint}
                  onClick={() => choosePlacement(choice)}
                >
                  <choice.Icon size={19} aria-hidden="true" />
                </button>
              )
            })}
          </div>
        )}
      </div>
      {hint && (
        <span id={hintId} role="tooltip" className={styles.tooltip}>
          {hint}
        </span>
      )}
    </section>
  )
}
