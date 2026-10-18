import type { Bounds, DesktopItem, DesktopWindow, Workspace } from './desktop'

const windowPeek = 24
const iconPeek = 32
const epsilon = 0.000001
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

type Interval = { start: number; end: number }

function intersect(a: Bounds, b: Bounds): Bounds | null {
  const x = Math.max(a.x, b.x)
  const y = Math.max(a.y, b.y)
  const width = Math.min(a.x + a.width, b.x + b.width) - x
  const height = Math.min(a.y + a.height, b.y + b.height) - y
  return width > epsilon && height > epsilon ? { x, y, width, height } : null
}

function fullyCovered(body: Bounds, higher: Bounds[]): boolean {
  const intersections = higher.flatMap((other) => {
    const overlap = intersect(body, other)
    return overlap ? [overlap] : []
  })
  if (!intersections.length) return false
  const edges = [
    ...new Set([
      body.x,
      body.x + body.width,
      ...intersections.flatMap((item) => [item.x, item.x + item.width]),
    ]),
  ].sort((a, b) => a - b)

  // Coverage can change only at a vertical edge of one of the rectangles.
  for (let index = 0; index < edges.length - 1; index++) {
    if (edges[index + 1] - edges[index] <= epsilon) continue
    const x = (edges[index] + edges[index + 1]) / 2
    const intervals = intersections
      .filter((item) => item.x < x && item.x + item.width > x)
      .map((item) => ({ start: item.y, end: item.y + item.height }))
      .sort((a, b) => a.start - b.start)
    let coveredTo = body.y
    for (const interval of intervals) {
      if (interval.start > coveredTo + epsilon) return false
      coveredTo = Math.max(coveredTo, interval.end)
    }
    if (coveredTo < body.y + body.height - epsilon) return false
  }
  return true
}

function freeIntervals(
  blocked: Interval[],
  minimum: number,
  maximum: number,
): Interval[] {
  const free: Interval[] = []
  let cursor = minimum
  for (const interval of blocked.sort((a, b) => a.start - b.start)) {
    if (interval.end < cursor) continue
    if (interval.start >= cursor) {
      free.push({ start: cursor, end: Math.min(maximum, interval.start) })
    }
    cursor = Math.max(cursor, interval.end)
    if (cursor > maximum) break
  }
  if (cursor <= maximum) free.push({ start: cursor, end: maximum })
  return free
}

function revealPosition(
  item: Bounds,
  body: Bounds,
  higher: Bounds[],
  world: { width: number; height: number },
  peek: number,
): { x: number; y: number } | null {
  const width = Math.min(peek, body.width)
  const height = Math.min(peek, body.height)
  const offsetX = body.x - item.x
  const offsetY = body.y - item.y
  const maximumX = world.width - item.width
  const maximumY = world.height - item.height
  const minimumPatchX = offsetX
  const maximumPatchX = maximumX + offsetX + body.width - width
  const minimumPatchY = offsetY
  const maximumPatchY = maximumY + offsetY + body.height - height
  if (maximumX < 0 || maximumY < 0) return null

  // A patch intersects an occluder while its top-left corner is inside this
  // expanded rectangle. Touching its edge is allowed: that exposes the patch.
  const blocked = higher.map((other) => ({
    left: other.x - width,
    right: other.x + other.width,
    top: other.y - height,
    bottom: other.y + other.height,
  }))
  const candidates = [
    ...new Set([
      minimumPatchX,
      maximumPatchX,
      body.x,
      body.x + body.width - width,
      ...blocked.flatMap((other) => [other.left, other.right]),
    ]),
  ].filter((x) => x >= minimumPatchX && x <= maximumPatchX)
  let best: { x: number; y: number } | null = null
  let bestDistance = Infinity

  // Sweep the obstacle edges, rather than stepping through canvas pixels.
  // Within a strip the free vertical intervals are constant, so its closest
  // feasible placement is either at an edge or at the original body position.
  for (const patchX of candidates) {
    const intervals = blocked
      .filter((other) => patchX > other.left && patchX < other.right)
      .map((other) => ({ start: other.top, end: other.bottom }))
    for (const free of freeIntervals(intervals, minimumPatchY, maximumPatchY)) {
      const patchY = clamp(body.y, free.start, free.end)
      const x = clamp(
        clamp(item.x, patchX - offsetX - body.width + width, patchX - offsetX),
        0,
        maximumX,
      )
      const y = clamp(
        clamp(
          item.y,
          patchY - offsetY - body.height + height,
          patchY - offsetY,
        ),
        0,
        maximumY,
      )
      const distance = (x - item.x) ** 2 + (y - item.y) ** 2
      // Equal distances prefer the upper edge, then the left edge.
      if (
        distance < bestDistance - epsilon ||
        (Math.abs(distance - bestDistance) <= epsilon &&
          (!best || y < best.y || (y === best.y && x < best.x)))
      ) {
        best = { x, y }
        bestDistance = distance
      }
    }
  }
  return best
}

function iconBody(item: DesktopItem): Bounds {
  // DesktopItems uses a centered 56px icon above its label. Empty button
  // padding should not count as an exposed icon, or obscure another one.
  const size = Math.min(56, item.width, item.height)
  return {
    x: item.x + (item.width - size) / 2,
    y: item.y + Math.max(0, (item.height - size - 20) / 2),
    width: size,
    height: size,
  }
}

function moveWindow(
  item: DesktopWindow,
  position: { x: number; y: number },
  world: Workspace,
): DesktopWindow {
  const dx = position.x - item.x
  const dy = position.y - item.y
  if (!dx && !dy) return item
  return {
    ...item,
    ...position,
    ...(item.restore && {
      restore: {
        ...item.restore,
        x: clamp(item.restore.x + dx, 0, world.width - item.restore.width),
        y: clamp(item.restore.y + dy, 0, world.height - item.restore.height),
      },
    }),
  }
}

/** Reveal fully covered bodies without changing their size or stacking order. */
export function settleCoveredItems(workspace: Workspace): Workspace {
  const windows = [...workspace.windows]
  const items = [...workspace.items]
  const higher: Bounds[] = []
  let changed = false
  for (let index = windows.length - 1; index >= 0; index--) {
    const item = windows[index]
    if (fullyCovered(item, higher)) {
      const position = revealPosition(item, item, higher, workspace, windowPeek)
      if (position) {
        windows[index] = moveWindow(item, position, workspace)
        changed ||= windows[index] !== item
      }
    }
    higher.push(windows[index])
  }
  // Desktop items always live below every window, including a dropped item.
  for (let index = items.length - 1; index >= 0; index--) {
    const item = items[index]
    const body = iconBody(item)
    if (fullyCovered(body, higher)) {
      const position = revealPosition(item, body, higher, workspace, iconPeek)
      if (position && (position.x !== item.x || position.y !== item.y)) {
        items[index] = { ...item, ...position }
        changed = true
      }
    }
    higher.push(iconBody(items[index]))
  }
  return changed ? { ...workspace, windows, items } : workspace
}
