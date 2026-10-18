import { CANVAS_GRID_SIZE, clamp, type Bounds } from './desktop.ts'

function moveAxis(
  origin: number,
  delta: number,
  min: number,
  max: number,
  snap: boolean,
) {
  if (!snap) return clamp(delta, min, max)

  // The wallpaper's radial gradient centers each dot inside its grid cell.
  const offset = CANVAS_GRID_SIZE / 2
  const first = Math.ceil((origin + min - offset) / CANVAS_GRID_SIZE)
  const last = Math.floor((origin + max - offset) / CANVAS_GRID_SIZE)
  if (first > last) return clamp(delta, min, max)
  const point = Math.round((origin + delta - offset) / CANVAS_GRID_SIZE)
  return clamp(point, first, last) * CANVAS_GRID_SIZE + offset - origin
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
