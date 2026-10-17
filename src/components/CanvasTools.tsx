import { Hand, LassoSelect, Map } from 'lucide-react'
import { useId } from 'react'
import styles from './CanvasTools.module.css'

interface CanvasToolsProps {
  mode: 'pan' | 'lasso'
  onModeChange: (mode: 'pan' | 'lasso') => void
  mapOpen: boolean
  onToggleMap: () => void
  onArrange: () => void
  windowCount: number
  selectedCount: number
  showHint: boolean
}

export default function CanvasTools({
  mode,
  onModeChange,
  mapOpen,
  onToggleMap,
  onArrange,
  windowCount,
  selectedCount,
  showHint,
}: CanvasToolsProps) {
  const arrangeHintId = useId()
  return (
    <div className={styles.container}>
      {showHint && mode === 'lasso' && (
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
        <div className={styles.toolGrid}>
          <button
            type="button"
            className={`${styles.tool} ${styles.move}`}
            aria-pressed={mode === 'pan'}
            aria-label="Pan the canvas"
            title="Pan the canvas (H)"
            onClick={() => onModeChange('pan')}
          >
            <Hand size={20} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={styles.tool}
            aria-pressed={mode === 'lasso'}
            aria-label="Select windows"
            title="Select windows (L)"
            onClick={() => onModeChange('lasso')}
          >
            <LassoSelect size={18} aria-hidden="true" />
          </button>
          <span className={styles.divider} aria-hidden="true" />
          <button
            type="button"
            className={styles.tool}
            aria-pressed={mapOpen}
            aria-label="Toggle canvas map"
            title="Toggle canvas map (M)"
            onClick={onToggleMap}
          >
            <Map size={18} aria-hidden="true" />
          </button>
          <div className={styles.organize}>
            <button
              type="button"
              className={styles.tool}
              aria-label="Arrange all windows"
              aria-describedby={arrangeHintId}
              onClick={onArrange}
              disabled={windowCount === 0}
            >
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <rect x={2} y={3} width={9} height={18} rx={1.5} />
                <rect x={15} y={3} width={7} height={7} rx={1.5} />
                <rect x={15} y={14} width={7} height={7} rx={1.5} />
              </svg>
            </button>
            <span id={arrangeHintId} className={styles.tooltip} role="tooltip">
              Arrange windows in a grid <kbd>A</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
