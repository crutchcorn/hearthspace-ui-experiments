import type { PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import type { Bounds } from '../desktop'
import type { SearchPlacement } from '../canvas-search'
import type { CanvasDrawing, DrawingLayerName } from '../drawings'
import type { GesturePoint } from '../gestures'
import {
  getFrameBounds,
  getPlacement,
  getTargetGroup,
  targetKey,
  type FrameEdge,
  type FrameLayout,
  type ObjectPlacement,
} from '../frame-layout'
import styles from './DrawingLayer.module.css'
import type { FramePreviewBounds } from './FramePreviewSlot'

interface DrawingLayerProps {
  drawings: CanvasDrawing[]
  layer: DrawingLayerName
  selectedId: string | null
  consumingIds?: string[]
  placements?: Map<string, SearchPlacement>
  frameLayout?: FrameLayout
  view?: Bounds
  frameHost?: HTMLElement | null
  dragHost?: HTMLElement | null
  draggingId?: string
  groupBounds?: Map<string, FramePreviewBounds>
  draggingWidget?: { id: string; edge?: FrameEdge } | null
  frameDropTarget?: Extract<ObjectPlacement, { surface: 'frame' }> | null
  draft?: { points: GesturePoint[]; layer: DrawingLayerName }
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
  frameHost,
  dragHost,
  draggingId,
  groupBounds,
  draggingWidget,
  frameDropTarget,
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

  return (
    <div className={styles.layer} data-drawing-layer={layer}>
      {drawings.map((drawing, index) => {
        const placement = placements?.get(drawing.id)
        const group =
          frameLayout &&
          getTargetGroup(frameLayout, { kind: 'drawing', id: drawing.id })
        const movingGroup =
          group && draggingWidget?.id === group.id ? draggingWidget : null
        const savedLayout =
          group && frameLayout
            ? getPlacement(frameLayout, { kind: 'drawing', id: drawing.id })
            : (frameLayout?.placements[
                targetKey({ kind: 'drawing', id: drawing.id })
              ] ?? {
                surface: drawing.layer === 'below' ? 'background' : 'canvas',
              })
        const layout =
          movingGroup && savedLayout.surface !== 'frame'
            ? (frameDropTarget ?? { surface: 'canvas' as const })
            : savedLayout
        const effectiveLayer = placements
          ? 'above'
          : layout.surface === 'background'
            ? 'below'
            : 'above'
        if (effectiveLayer !== layer || (placements && !placement)) return null
        const framed =
          !placements && layout.surface === 'frame' && view && frameHost
        const slot = groupBounds?.get(`drawing:${drawing.id}`)
        const bounds = framed
          ? getFrameBounds(layout, drawing.width, drawing.height, view)
          : movingGroup && !placements && slot && view
            ? {
                x: slot.x + view.x,
                y: slot.y + view.y,
                width: slot.width,
                height: slot.height,
              }
            : drawing
        if (framed && group && slot) {
          bounds.x = slot.x
          bounds.y = slot.y
          bounds.width = slot.width
          bounds.height = slot.height
        }
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
              clipPath:
                framed && group && slot
                  ? `inset(${Math.max(0, slot.frame.y - bounds.y)}px ${Math.max(0, bounds.x + bounds.width - slot.frame.x - slot.frame.width)}px ${Math.max(0, bounds.y + bounds.height - slot.frame.y - slot.frame.height)}px ${Math.max(0, slot.frame.x - bounds.x)}px)`
                  : undefined,
              position: framed ? 'fixed' : undefined,
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: bounds.height,
              pointerEvents: framed && drawingInteractive ? 'auto' : undefined,
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
        if (dragHost && (draggingId === drawing.id || movingGroup))
          return createPortal(element, dragHost, drawing.id)
        return framed ? createPortal(element, frameHost, drawing.id) : element
      })}
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
