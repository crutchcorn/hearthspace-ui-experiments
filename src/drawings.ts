import type { Bounds } from './desktop'
import type { GesturePoint } from './gestures'

export type DrawingLayerName = 'below' | 'above'
export type CanvasDrawing = Bounds & {
  id: string
  strokes: GesturePoint[][]
  layer: DrawingLayerName
  peekOrigin?: Pick<Bounds, 'x' | 'y'>
}

export const MAX_DRAWING_STROKES = 64
const maximumPoints = 4096
const padding = 4
type World = { width: number; height: number }

function validWorld(world: World) {
  return (
    Number.isFinite(world.width) &&
    Number.isFinite(world.height) &&
    world.width > 0 &&
    world.height > 0
  )
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object'
}

/** Strokes use coordinates local to the drawing, regardless of its surface. */
export function readDrawingStrokes(
  value: unknown,
  size: World,
): GesturePoint[][] | null {
  if (
    !validWorld(size) ||
    !Array.isArray(value) ||
    value.length === 0 ||
    value.length > MAX_DRAWING_STROKES
  )
    return null
  const strokes: GesturePoint[][] = []
  for (const stroke of value) {
    if (
      !Array.isArray(stroke) ||
      !stroke.length ||
      stroke.length > maximumPoints
    )
      return null
    const points: GesturePoint[] = []
    for (const point of stroke) {
      if (
        !record(point) ||
        typeof point.x !== 'number' ||
        typeof point.y !== 'number' ||
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y) ||
        point.x < 0 ||
        point.y < 0 ||
        point.x > size.width ||
        point.y > size.height
      )
        return null
      points.push({ x: point.x, y: point.y })
    }
    strokes.push(points)
  }
  return strokes
}

export function addDrawingStroke(
  existing: CanvasDrawing | null,
  points: GesturePoint[],
  layer: DrawingLayerName,
  world: World,
): CanvasDrawing {
  if (!validWorld(world))
    throw new RangeError('Drawing bounds must be finite and positive.')
  if (
    !points.length ||
    points.some(
      (point) => !Number.isFinite(point.x) || !Number.isFinite(point.y),
    )
  )
    throw new RangeError('A drawing stroke needs at least one finite point.')
  if (existing && existing.strokes.length >= MAX_DRAWING_STROKES)
    throw new RangeError('Start a new drawing after 64 strokes.')

  const stroke =
    points.length <= maximumPoints
      ? points
      : Array.from(
          { length: maximumPoints },
          (_, index) =>
            points[
              Math.round((index * (points.length - 1)) / (maximumPoints - 1))
            ],
        )
  const worldStrokes = [
    ...(existing?.strokes.map((saved) =>
      saved.map((point) => ({
        x: existing.x + point.x,
        y: existing.y + point.y,
      })),
    ) ?? []),
    stroke,
  ].map((saved) =>
    saved.map((point) => ({
      x: Math.max(0, Math.min(world.width, point.x)),
      y: Math.max(0, Math.min(world.height, point.y)),
    })),
  )
  let minX = world.width
  let minY = world.height
  let maxX = 0
  let maxY = 0
  for (const saved of worldStrokes)
    for (const point of saved) {
      minX = Math.min(minX, point.x)
      minY = Math.min(minY, point.y)
      maxX = Math.max(maxX, point.x)
      maxY = Math.max(maxY, point.y)
    }
  const x = Math.max(0, minX - padding)
  const y = Math.max(0, minY - padding)
  return {
    id: existing?.id ?? crypto.randomUUID(),
    layer,
    x,
    y,
    width: Math.min(world.width, maxX + padding) - x,
    height: Math.min(world.height, maxY + padding) - y,
    strokes: worldStrokes.map((saved) =>
      saved.map((point) => ({ x: point.x - x, y: point.y - y })),
    ),
  }
}
