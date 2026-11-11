import type { ComponentProps } from 'react'
import { RotateCcw, ZoomIn, ZoomOut } from '../../../components/icons'
import Minimap from './minimap'
import styles from '../desktop.module.css'
import shellStyles from './shell-controls.module.css'

export default function CanvasOverview({
  workspace,
  view,
  onNavigate,
}: ComponentProps<typeof Minimap>) {
  return (
    <aside className={styles.mapPanel} data-shell-controls>
      <div className={styles.panelHeading}>
        <h2>Overview</h2>
        <output
          className={styles.zoomPercentage}
          aria-label="Current canvas zoom"
        >
          100%
        </output>
      </div>
      <Minimap workspace={workspace} view={view} onNavigate={onNavigate} />
      <div
        className={styles.zoomControls}
        role="group"
        aria-label="Canvas zoom"
      >
        <button
          type="button"
          className={`${styles.zoomButton} ${shellStyles.control}`}
          aria-label="Reset canvas zoom to 100%"
          title="Reset canvas zoom to 100%"
          disabled
        >
          <RotateCcw size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${styles.zoomButton} ${shellStyles.control}`}
          aria-label="Zoom out"
        >
          <ZoomOut size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={`${styles.zoomButton} ${shellStyles.control}`}
          aria-label="Zoom in"
        >
          <ZoomIn size={18} aria-hidden="true" />
        </button>
      </div>
    </aside>
  )
}
