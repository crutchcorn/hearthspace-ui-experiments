import type { FrameEdge } from '../frame-layout'
import styles from './FrameGuides.module.css'

interface FrameGuidesProps {
  target: { edge: FrameEdge; position: number } | null
}

const edges = ['top', 'right', 'bottom', 'left'] as const
const corners = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const
const edgeCorners = {
  top: ['top-left', 'top-right'],
  right: ['top-right', 'bottom-right'],
  bottom: ['bottom-left', 'bottom-right'],
  left: ['top-left', 'bottom-left'],
} as const

export default function FrameGuides({ target }: FrameGuidesProps) {
  const activeCorner =
    target && (target.position === 0 || target.position === 1)
      ? edgeCorners[target.edge][target.position === 0 ? 0 : 1]
      : null

  return (
    <div className={styles.guides} aria-hidden="true">
      {edges.map((edge) => (
        <div
          key={edge}
          className={styles.zone}
          data-frame-guide={edge}
          data-active={target?.edge === edge && activeCorner === null}
        />
      ))}
      {corners.map((corner) => (
        <div
          key={corner}
          className={styles.zone}
          data-frame-guide={corner}
          data-active={activeCorner === corner}
        />
      ))}
    </div>
  )
}
