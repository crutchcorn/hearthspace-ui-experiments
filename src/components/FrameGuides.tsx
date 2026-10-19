import type { FrameEdge } from '../frame-layout'
import styles from './FrameGuides.module.css'

interface FrameGuidesProps {
  target: { edge: FrameEdge; position: number } | null
  layer: 'fill' | 'outline'
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

export default function FrameGuides({ target, layer }: FrameGuidesProps) {
  const activeCorner =
    target && (target.position === 0 || target.position === 1)
      ? edgeCorners[target.edge][target.position === 0 ? 0 : 1]
      : null

  return (
    <div className={styles.guides} data-guide-layer={layer} aria-hidden="true">
      {[...edges, ...corners].map((zone) => (
        <div
          key={zone}
          className={styles.zone}
          data-frame-guide={layer === 'outline' ? zone : undefined}
          data-guide-zone={zone}
          data-active={
            activeCorner === zone ||
            (activeCorner === null && target?.edge === zone)
          }
        />
      ))}
    </div>
  )
}
