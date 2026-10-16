import { Hand, LassoSelect, LayoutGrid, Map } from 'lucide-react'
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
        <button
          type="button"
          className={styles.tool}
          aria-pressed={mode === 'pan'}
          title="Pan the canvas (H)"
          onClick={() => onModeChange('pan')}
        >
          <Hand size={18} aria-hidden="true" />
          <span>Pan</span>
        </button>
        <button
          type="button"
          className={styles.tool}
          aria-pressed={mode === 'lasso'}
          title="Select windows (L)"
          onClick={() => onModeChange('lasso')}
        >
          <LassoSelect size={18} aria-hidden="true" />
          <span>Select</span>
        </button>
        <button
          type="button"
          className={styles.tool}
          aria-pressed={mapOpen}
          title="Toggle canvas map (M)"
          onClick={onToggleMap}
        >
          <Map size={18} aria-hidden="true" />
          <span>Map</span>
        </button>
        <button
          type="button"
          className={styles.tool}
          title="Arrange all windows (A)"
          onClick={onArrange}
          disabled={windowCount === 0}
        >
          <LayoutGrid size={18} aria-hidden="true" />
          <span>Arrange</span>
        </button>
      </div>
    </div>
  )
}
