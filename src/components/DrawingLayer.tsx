import type { PointerEvent } from 'react'
import type { CanvasDrawing, DrawingLayerName } from '../drawings'
import type { GesturePoint } from '../gestures'
import styles from './DrawingLayer.module.css'

interface DrawingLayerProps {
  drawings: CanvasDrawing[]
  layer: DrawingLayerName
  selectedId: string | null
  draft?: { points: GesturePoint[]; layer: DrawingLayerName }
  interactive: boolean
  onPointerDown: (event: PointerEvent<SVGSVGElement>, id: string) => void
  onSelect?: (id: string) => void
}

function Stroke({
  points,
  hitTarget = false,
}: {
  points: GesturePoint[]
  hitTarget?: boolean
}) {
  if (!points.length) return null
  const className = hitTarget ? styles.hitTarget : styles.stroke
  return points.length === 1 ? (
    <circle
      className={className}
      cx={points[0].x}
      cy={points[0].y}
      r={hitTarget ? 10 : 1.5}
      data-dot
    />
  ) : (
    <polyline
      className={className}
      points={points.map(({ x, y }) => `${x},${y}`).join(' ')}
      vectorEffect="non-scaling-stroke"
    />
  )
}

export default function DrawingLayer({
  drawings,
  layer,
  selectedId,
  draft,
  interactive,
  onPointerDown,
  onSelect,
}: DrawingLayerProps) {
  const draftPoints = draft?.layer === layer ? draft.points : []
  const draftX = draftPoints.length
    ? Math.min(...draftPoints.map(({ x }) => x))
    : 0
  const draftY = draftPoints.length
    ? Math.min(...draftPoints.map(({ y }) => y))
    : 0
  const draftWidth = draftPoints.length
    ? Math.max(1, Math.max(...draftPoints.map(({ x }) => x)) - draftX)
    : 1
  const draftHeight = draftPoints.length
    ? Math.max(1, Math.max(...draftPoints.map(({ y }) => y)) - draftY)
    : 1

  return (
    <div className={styles.layer} data-drawing-layer={layer}>
      {drawings
        .filter((drawing) => drawing.layer === layer)
        .map((drawing, index) => (
          <svg
            key={drawing.id}
            className={styles.drawing}
            data-drawing-id={drawing.id}
            data-selected={selectedId === drawing.id}
            data-interactive={interactive}
            role={interactive ? 'button' : 'img'}
            aria-label={`Drawing ${index + 1}`}
            aria-pressed={interactive ? selectedId === drawing.id : undefined}
            tabIndex={interactive ? 0 : undefined}
            viewBox={`0 0 ${drawing.width} ${drawing.height}`}
            style={{
              left: drawing.x,
              top: drawing.y,
              width: drawing.width,
              height: drawing.height,
            }}
            onPointerDown={
              interactive
                ? (event) => onPointerDown(event, drawing.id)
                : undefined
            }
            onKeyDown={(event) => {
              if (!interactive || !onSelect) return
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              event.stopPropagation()
              onSelect(drawing.id)
            }}
          >
            {selectedId === drawing.id && (
              <rect
                className={styles.selection}
                x={-7}
                y={-7}
                width={drawing.width + 14}
                height={drawing.height + 14}
                rx={6}
                vectorEffect="non-scaling-stroke"
              />
            )}
            {drawing.strokes.map((points, strokeIndex) => (
              <Stroke key={strokeIndex} points={points} />
            ))}
            {interactive &&
              drawing.strokes.map((points, strokeIndex) => (
                <Stroke key={strokeIndex} points={points} hitTarget />
              ))}
          </svg>
        ))}
      {draftPoints.length > 0 && (
        <svg
          className={styles.drawing}
          aria-hidden="true"
          data-drawing-draft
          viewBox={`0 0 ${draftWidth} ${draftHeight}`}
          style={{
            left: draftX,
            top: draftY,
            width: draftWidth,
            height: draftHeight,
          }}
        >
          <Stroke
            points={draftPoints.map(({ x, y }) => ({
              x: x - draftX,
              y: y - draftY,
            }))}
          />
        </svg>
      )}
    </div>
  )
}
