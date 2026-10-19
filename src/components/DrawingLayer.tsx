import type { PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Bounds } from '../desktop'
import type { SearchPlacement } from '../canvas-search'
import type { CanvasDrawing, DrawingLayerName } from '../drawings'
import type { GesturePoint } from '../gestures'
import {
  getPlacement,
  targetKey,
  type FrameLayout,
  type ObjectPlacement,
} from '../frame-layout'
import styles from './DrawingLayer.module.css'

interface DrawingLayerProps {
  drawings: CanvasDrawing[]
  layer: DrawingLayerName
  selectedId: string | null
  consumingIds?: string[]
  placements?: Map<string, SearchPlacement>
  frameLayout?: FrameLayout
  view?: Bounds
  pinnedHost?: HTMLElement | null
  dragHost?: HTMLElement | null
  draggingId?: string
  draft?: { points: GesturePoint[]; layer: DrawingLayerName; pinned?: boolean }
  interactive: boolean
  onPointerDown: (event: PointerEvent<SVGSVGElement>, id: string) => void
  onSelect?: (id: string) => void
  onOpen?: (id: string) => void
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
  consumingIds = [],
  placements,
  frameLayout,
  view,
  pinnedHost,
  dragHost,
  draggingId,
  draft,
  interactive,
  onPointerDown,
  onSelect,
  onOpen,
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
  const draftStroke = draftPoints.length > 0 && (
    <svg
      className={styles.drawing}
      aria-hidden="true"
      data-drawing-draft
      viewBox={`0 0 ${draftWidth} ${draftHeight}`}
      style={{
        position: draft?.pinned ? 'fixed' : undefined,
        left: draftX - (draft?.pinned ? (view?.x ?? 0) : 0),
        top: draftY - (draft?.pinned ? (view?.y ?? 0) : 0),
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
  )

  return (
    <div className={styles.layer} data-drawing-layer={layer}>
      {drawings.map((drawing, index) => {
        const placement = placements?.get(drawing.id)
        const layout: ObjectPlacement = frameLayout?.placements[
          targetKey({ kind: 'drawing', id: drawing.id })
        ]
          ? getPlacement(frameLayout, { kind: 'drawing', id: drawing.id })
          : {
              surface: drawing.layer === 'below' ? 'background' : 'canvas',
            }
        const effectiveLayer = placements
          ? 'above'
          : layout.surface === 'background'
            ? 'below'
            : 'above'
        if (effectiveLayer !== layer || (placements && !placement)) return null
        const pinned = !placements && layout.surface === 'pinned'
        const bounds = pinned
          ? { ...drawing, x: layout.x, y: layout.y }
          : drawing
        const drawingInteractive =
          !consumingIds.includes(drawing.id) &&
          (placements ? placement?.matches === true : interactive)
        const element = (
          <svg
            key={drawing.id}
            className={styles.drawing}
            data-drawing-id={drawing.id}
            data-surface={placements ? 'canvas' : layout.surface}
            data-preview-match={placement?.matches}
            data-preview-selected={
              placement ? selectedId === drawing.id : undefined
            }
            data-selected={selectedId === drawing.id}
            data-consuming={consumingIds.includes(drawing.id)}
            data-interactive={drawingInteractive}
            role={drawingInteractive ? 'button' : 'img'}
            aria-label={`Drawing ${index + 1}`}
            aria-pressed={
              drawingInteractive ? selectedId === drawing.id : undefined
            }
            tabIndex={drawingInteractive ? 0 : undefined}
            viewBox={`0 0 ${drawing.width} ${drawing.height}`}
            style={{
              position: pinned ? 'fixed' : undefined,
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: bounds.height,
              transform: placement
                ? `translate(${placement.x - drawing.x}px, ${placement.y - drawing.y}px) scale(${placement.scale})`
                : 'translate(0px, 0px) scale(1)',
            }}
            onPointerDown={
              drawingInteractive
                ? (event) => {
                    if (placements) event.stopPropagation()
                    else onPointerDown(event, drawing.id)
                  }
                : undefined
            }
            onClick={
              placement?.matches
                ? (event) => {
                    event.stopPropagation()
                    onOpen?.(drawing.id)
                  }
                : undefined
            }
            onKeyDown={(event) => {
              const activate = placements ? onOpen : onSelect
              if (!drawingInteractive || !activate) return
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              event.stopPropagation()
              activate(drawing.id)
            }}
          >
            {placement?.matches && (
              <rect
                className={styles.previewHitTarget}
                width={drawing.width}
                height={drawing.height}
                rx={6}
              />
            )}
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
            {drawingInteractive &&
              drawing.strokes.map((points, strokeIndex) => (
                <Stroke key={strokeIndex} points={points} hitTarget />
              ))}
          </svg>
        )
        if (pinned)
          return pinnedHost
            ? createPortal(element, pinnedHost, drawing.id)
            : null
        if (dragHost && draggingId === drawing.id)
          return createPortal(element, dragHost, drawing.id)
        return element
      })}
      {draft?.pinned && pinnedHost
        ? createPortal(draftStroke, pinnedHost)
        : draftStroke}
    </div>
  )
}
