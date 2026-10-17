import { clamp, MIN_HEIGHT, MIN_WIDTH, type Bounds } from './desktop'

export function getWindowClearance(viewportWidth: number) {
  return viewportWidth <= 760
    ? { side: 12, top: 78, bottom: 78 }
    : { side: 24, top: 96, bottom: 96 }
}

export function getMaximizedBounds(
  view: Bounds,
  world: { width: number; height: number },
): Bounds {
  const { side, top, bottom } = getWindowClearance(view.width)
  const width = Math.min(
    world.width,
    Math.max(MIN_WIDTH, view.width - side * 2),
  )
  const height = Math.min(
    world.height,
    Math.max(MIN_HEIGHT, view.height - top - bottom),
  )

  return {
    x: clamp(view.x + side, 0, world.width - width),
    y: clamp(view.y + top, 0, world.height - height),
    width,
    height,
  }
}
