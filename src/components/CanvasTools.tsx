import { useEffect, useId, useRef } from 'react'
import {
  Compass,
  Ellipsis,
  Hand,
  LassoSelect,
  LayoutGrid,
  Map,
  Plus,
  RotateCcw,
  Scan,
} from 'lucide-react'
import styles from './CanvasTools.module.css'

interface CanvasToolsProps {
  mode: 'pan' | 'lasso'
  onModeChange: (mode: 'pan' | 'lasso') => void
  mapOpen: boolean
  onToggleMap: () => void
  moreOpen: boolean
  onToggleMore: () => void
  onCloseMore: () => void
  onNewWindow: () => void
  onHome: () => void
  onReset: () => void
  onHelp: () => void
  windowCount: number
  selectedCount: number
  showHint: boolean
}

export default function CanvasTools({
  mode,
  onModeChange,
  mapOpen,
  onToggleMap,
  moreOpen,
  onToggleMore,
  onCloseMore,
  onNewWindow,
  onHome,
  onReset,
  onHelp,
  windowCount,
  selectedCount,
  showHint,
}: CanvasToolsProps) {
  const container = useRef<HTMLDivElement>(null)
  const moreButton = useRef<HTMLButtonElement>(null)
  const panelId = useId()

  useEffect(() => {
    if (!moreOpen) return

    function onPointerDown(event: PointerEvent) {
      if (!container.current?.contains(event.target as Node)) onCloseMore()
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      onCloseMore()
      moreButton.current?.focus()
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [moreOpen, onCloseMore])

  function onAction(action: () => void) {
    onCloseMore()
    action()
  }

  return (
    <div className={styles.container} ref={container}>
      {showHint && mode === 'lasso' && !moreOpen && (
        <div className={styles.selectionHint} role="status">
          <span>
            {selectedCount > 0
              ? `${selectedCount} ${selectedCount === 1 ? 'window' : 'windows'} selected`
              : 'Drag around windows'}
          </span>
          <kbd>Esc</kbd>
        </div>
      )}
      <div className={styles.dock} role="group" aria-label="Canvas tools">
        <button
          type="button"
          className={styles.tool}
          aria-pressed={mode === 'pan'}
          title="Pan the canvas (H)"
          onClick={() => onAction(() => onModeChange('pan'))}
        >
          <Hand size={18} aria-hidden="true" />
          <span>Pan</span>
        </button>
        <button
          type="button"
          className={styles.tool}
          aria-pressed={mode === 'lasso'}
          title="Select windows (L)"
          onClick={() => onAction(() => onModeChange('lasso'))}
        >
          <LassoSelect size={18} aria-hidden="true" />
          <span>Select</span>
        </button>
        <button
          type="button"
          className={styles.tool}
          aria-pressed={mapOpen}
          title="Toggle canvas map (M)"
          onClick={() => onAction(onToggleMap)}
        >
          <Map size={18} aria-hidden="true" />
          <span>Map</span>
        </button>
        <button
          type="button"
          className={styles.tool}
          aria-expanded={moreOpen}
          aria-controls={panelId}
          title="More canvas tools"
          ref={moreButton}
          onClick={onToggleMore}
        >
          <Ellipsis size={18} aria-hidden="true" />
          <span>More</span>
        </button>
      </div>
      {moreOpen && (
        <section
          id={panelId}
          className={styles.popover}
          aria-label="More canvas tools"
        >
          <header className={styles.panelHeading}>
            <h2>Canvas tools</h2>
            <span>
              {windowCount} {windowCount === 1 ? 'window' : 'windows'}
            </span>
          </header>
          <div className={styles.actions}>
            <button type="button" onClick={() => onAction(onNewWindow)}>
              <Plus size={17} aria-hidden="true" />
              <span>New window</span>
            </button>
            <button type="button" onClick={() => onAction(onHelp)}>
              <Compass size={17} aria-hidden="true" />
              <span>How to explore</span>
            </button>
            <button
              type="button"
              className={styles.textOnlyAction}
              onClick={() => onAction(onHome)}
            >
              Return to starting area
            </button>
            <button type="button" onClick={() => onAction(onReset)}>
              <RotateCcw size={17} aria-hidden="true" />
              <span>Reset layout</span>
            </button>
            <div className={styles.divider} />
            <button type="button" disabled>
              <Scan size={17} aria-hidden="true" />
              <span>Frame a space</span>
              <span className={styles.later}>Later</span>
            </button>
            <button type="button" disabled>
              <LayoutGrid size={17} aria-hidden="true" />
              <span>Arrange windows</span>
              <span className={styles.later}>Later</span>
            </button>
          </div>
        </section>
      )}
    </div>
  )
}
