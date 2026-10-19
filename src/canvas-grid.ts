import {
  CANVAS_GRID_SIZE,
  clamp,
  MIN_HEIGHT,
  MIN_WIDTH,
  resizeBounds,
  type Bounds,
} from './desktop.ts'

export function snapCanvasCoordinate(value: number, min: number, max: number) {
  // The wallpaper's radial gradient centers each dot inside its grid cell.
  const offset = CANVAS_GRID_SIZE / 2
  const first = Math.ceil((min - offset) / CANVAS_GRID_SIZE)
  const last = Math.floor((max - offset) / CANVAS_GRID_SIZE)
  if (first > last) return clamp(value, min, max)
  const point = Math.round((value - offset) / CANVAS_GRID_SIZE)
  return clamp(point, first, last) * CANVAS_GRID_SIZE + offset
}

function moveAxis(
  origin: number,
  delta: number,
  min: number,
  max: number,
  snap: boolean,
) {
  if (!snap) return clamp(delta, min, max)
  return (
    snapCanvasCoordinate(origin + delta, origin + min, origin + max) - origin
  )
}

export function getCanvasMoveDelta(
  items: Bounds[],
  anchor: Bounds,
  delta: { x: number; y: number },
  world: { width: number; height: number },
  snap: boolean,
) {
  return {
    x: moveAxis(
      anchor.x,
      delta.x,
      -Math.min(...items.map((item) => item.x)),
      world.width - Math.max(...items.map((item) => item.x + item.width)),
      snap,
    ),
    y: moveAxis(
      anchor.y,
      delta.y,
      -Math.min(...items.map((item) => item.y)),
      world.height - Math.max(...items.map((item) => item.y + item.height)),
      snap,
    ),
  }
}

export function getCanvasResizeBounds(
  bounds: Bounds,
  edge: string,
  dx: number,
  dy: number,
  world: { width: number; height: number },
  snap: boolean,
): Bounds {
  if (snap) {
    const right = bounds.x + bounds.width
    const bottom = bounds.y + bounds.height
    if (edge.includes('w'))
      dx = moveAxis(bounds.x, dx, -bounds.x, bounds.width - MIN_WIDTH, true)
    else if (edge.includes('e'))
      dx = moveAxis(
        right,
        dx,
        MIN_WIDTH - bounds.width,
        world.width - right,
        true,
      )
    if (edge.includes('n'))
      dy = moveAxis(bounds.y, dy, -bounds.y, bounds.height - MIN_HEIGHT, true)
    else if (edge.includes('s'))
      dy = moveAxis(
        bottom,
        dy,
        MIN_HEIGHT - bounds.height,
        world.height - bottom,
        true,
      )
  }
  return resizeBounds(bounds, edge, dx, dy, world)
}
