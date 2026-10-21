import type { CSSProperties } from 'react'
import {
  FRAME_GUIDE_GAP,
  FRAME_GUIDE_INSET,
  getFrameGuideSize,
  type FrameGuideZone,
} from '../frame-layout'
import styles from './FrameGuides.module.css'

interface FrameGuidesProps {
  target: { zone: FrameGuideZone } | null
  viewport: { width: number; height: number }
  layer: 'fill' | 'outline'
}

const edges = ['top', 'right', 'bottom', 'left'] as const
const corners = [
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
] as const
export default function FrameGuides({
  target,
  layer,
  viewport,
}: FrameGuidesProps) {
  return (
    <div
      className={styles.guides}
      style={
        {
          '--guide-inset': `${FRAME_GUIDE_INSET}px`,
          '--guide-gap': `${FRAME_GUIDE_GAP}px`,
          '--zone-size': `${getFrameGuideSize(viewport)}px`,
        } as CSSProperties
      }
      data-guide-layer={layer}
      aria-hidden="true"
    >
      {[...edges, ...corners].map((zone) => (
        <div
          key={zone}
          className={styles.zone}
          data-frame-guide={layer === 'outline' ? zone : undefined}
          data-guide-zone={zone}
          data-active={target?.zone === zone}
        />
      ))}
    </div>
  )
}
