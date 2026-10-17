import type { Bounds } from './desktop'

export type DisplayRect = Bounds

export const DISPLAY_LAYOUT_WIDTH = 800
export const DISPLAY_LAYOUT_HEIGHT = 450

export const INITIAL_DISPLAY_LAYOUT: [DisplayRect, DisplayRect] = [
  { x: 176, y: 165, width: 192, height: 120 },
  { x: 368, y: 153, width: 256, height: 144 },
]

const MIN_SHARED_EDGE = 24
const ALIGNMENT_DISTANCE = 12

export function clampDisplayPosition(display: DisplayRect): DisplayRect {
  return {
    ...display,
    x: Math.max(0, Math.min(display.x, DISPLAY_LAYOUT_WIDTH - display.width)),
    y: Math.max(0, Math.min(display.y, DISPLAY_LAYOUT_HEIGHT - display.height)),
  }
}

export function centerDisplayLayout([first, second]: [
  DisplayRect,
  DisplayRect,
]): [DisplayRect, DisplayRect] {
  const left = Math.min(first.x, second.x)
  const top = Math.min(first.y, second.y)
  const right = Math.max(first.x + first.width, second.x + second.width)
  const bottom = Math.max(first.y + first.height, second.y + second.height)
  const dx = (DISPLAY_LAYOUT_WIDTH - (right - left)) / 2 - left
  const dy = (DISPLAY_LAYOUT_HEIGHT - (bottom - top)) / 2 - top

  return [
    { ...first, x: first.x + dx, y: first.y + dy },
    { ...second, x: second.x + dx, y: second.y + dy },
  ]
}

function connectedOffset(
  position: number,
  size: number,
  neighborPosition: number,
  neighborSize: number,
): number {
  const minimum = neighborPosition - size + MIN_SHARED_EDGE
  const maximum = neighborPosition + neighborSize - MIN_SHARED_EDGE
  const offset = Math.max(minimum, Math.min(position, maximum))
  const alignments = [
    neighborPosition,
    neighborPosition + neighborSize - size,
    neighborPosition + (neighborSize - size) / 2,
  ]
    .filter((alignment) => alignment >= minimum && alignment <= maximum)
    .sort((a, b) => Math.abs(a - offset) - Math.abs(b - offset))

  const closest = alignments[0]
  return closest !== undefined &&
    Math.abs(closest - offset) <= ALIGNMENT_DISTANCE
    ? closest
    : offset
}

export function snapDisplayToNeighbor(
  moved: DisplayRect,
  neighbor: DisplayRect,
): DisplayRect {
  const x = connectedOffset(moved.x, moved.width, neighbor.x, neighbor.width)
  const y = connectedOffset(moved.y, moved.height, neighbor.y, neighbor.height)
  const candidates: DisplayRect[] = [
    { ...moved, x: neighbor.x - moved.width, y },
    { ...moved, x: neighbor.x + neighbor.width, y },
    { ...moved, x, y: neighbor.y - moved.height },
    { ...moved, x, y: neighbor.y + neighbor.height },
  ]

  const distance = (display: DisplayRect) =>
    (display.x - moved.x) ** 2 + (display.y - moved.y) ** 2

  return candidates.reduce((nearest, candidate) =>
    distance(candidate) < distance(nearest) ? candidate : nearest,
  )
}
