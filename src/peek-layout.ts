import type { Bounds, DesktopItem, DesktopWindow, Workspace } from './desktop'
import type { CanvasDrawing } from './drawings'
import type { GesturePoint } from './gestures'

const windowPeek = 24
const iconPeek = 32
const drawingPeek = 16
const epsilon = 0.000001
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

type Interval = { start: number; end: number }

export interface PeekLayers {
  backgroundWindowIds?: ReadonlySet<string>
  raisedItemIds?: ReadonlySet<string>
  raisedDrawingIds?: ReadonlySet<string>
}

function coveringWindows(
  workspace: Workspace,
  raised: boolean,
  layers: PeekLayers,
): DesktopWindow[] {
  return raised
    ? workspace.windows.filter(
        (window) => !layers.backgroundWindowIds?.has(window.id),
      )
    : workspace.windows
}

function coveringIcons(
  items: DesktopItem[],
  raised: boolean,
  layers: PeekLayers,
): DesktopItem[] {
  return raised
    ? items.filter((item) => layers.raisedItemIds?.has(item.id))
    : items
}

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

type BackgroundItem = DesktopItem | CanvasDrawing

function moveBackground<T extends BackgroundItem>(
  item: T,
  position: GesturePoint,
): T {
  if (position.x === item.x && position.y === item.y) return item
  return {
    ...item,
    ...position,
    peekOrigin: item.peekOrigin ?? { x: item.x, y: item.y },
  }
}

function restoreBackground<T extends BackgroundItem>(
  item: T,
  windows: Bounds[],
  icons: Bounds[],
): T {
  if (!item.peekOrigin) return item
  const home = { ...item, ...item.peekOrigin }
  if (homeBlocked(home, windows, icons)) return item
  const restored = { ...home }
  delete restored.peekOrigin
  return restored
}

function homeBlocked(
  home: BackgroundItem,
  windows: Bounds[],
  icons: Bounds[],
): boolean {
  // Windows must clear the whole object, including its label. Neighboring
  // icons only block artwork, so tightly spaced desktop layouts can return.
  const body = 'strokes' in home ? home : iconBody(home)
  return (
    windows.some((other) => intersect(home, other)) ||
    icons.some((other) => intersect(body, other))
  )
}

/** Return displaced background objects once their home has room again. */
export function restoreBackgroundItems(
  workspace: Workspace,
  layers: PeekLayers = {},
): Workspace {
  const items = [...workspace.items]
  let changed = false
  let restored: boolean
  do {
    restored = false
    const homes = items.map((item) =>
      item.peekOrigin ? { ...item, ...item.peekOrigin } : item,
    )
    const returning = new Set(
      items.flatMap((item, index) => (item.peekOrigin ? [index] : [])),
    )
    let blocked: boolean
    do {
      blocked = false
      for (const index of returning) {
        const raised = layers.raisedItemIds?.has(homes[index].id) ?? false
        const icons = coveringIcons(
          items.flatMap((item, other) =>
            other === index ? [] : [returning.has(other) ? homes[other] : item],
          ),
          raised,
          layers,
        ).map(iconBody)
        if (
          homeBlocked(
            homes[index],
            coveringWindows(workspace, raised, layers),
            icons,
          )
        ) {
          returning.delete(index)
          blocked = true
        }
      }
      // A blocked peer stays at its current spot, which can block another
      // return. Remove those dependencies before moving anyone.
    } while (blocked)
    for (const index of returning) {
      const home = { ...homes[index] }
      delete home.peekOrigin
      items[index] = home
      restored = true
      changed = true
    }
    // Peers temporarily occupying one another's homes can now move together.
    // Also allow individual returns if their homes conflict with a peer's
    // intended home but are clear of that peer's actual position.
    for (let index = items.length - 1; index >= 0; index--) {
      const item = items[index]
      if (!item.peekOrigin) continue
      const raised = layers.raisedItemIds?.has(item.id) ?? false
      const icons = coveringIcons(
        items.filter((_, other) => other !== index),
        raised,
        layers,
      ).map(iconBody)
      items[index] = restoreBackground(
        item,
        coveringWindows(workspace, raised, layers),
        icons,
      )
      if (items[index] !== item) {
        restored = true
        changed = true
      }
    }
    // Returning one icon can clear another icon's home. An origin is removed
    // at most once, so this converges without making peers trade positions.
  } while (restored)
  const drawings = workspace.drawings.map((drawing) => {
    if (drawing.layer !== 'below') return drawing
    const raised = layers.raisedDrawingIds?.has(drawing.id) ?? false
    const result = restoreBackground(
      drawing,
      coveringWindows(workspace, raised, layers),
      coveringIcons(items, raised, layers).map(iconBody),
    )
    changed ||= result !== drawing
    return result
  })
  return changed ? { ...workspace, items, drawings } : workspace
}

function segmentCovered(
  start: GesturePoint,
  end: GesturePoint,
  higher: Bounds[],
): boolean {
  const intervals: Interval[] = []
  for (const other of higher) {
    let from = 0
    let to = 1
    for (const axis of ['x', 'y'] as const) {
      const size = axis === 'x' ? other.width : other.height
      const delta = end[axis] - start[axis]
      if (Math.abs(delta) <= epsilon) {
        if (start[axis] < other[axis] || start[axis] > other[axis] + size) {
          to = -1
          break
        }
      } else {
        const first = (other[axis] - start[axis]) / delta
        const last = (other[axis] + size - start[axis]) / delta
        from = Math.max(from, Math.min(first, last))
        to = Math.min(to, Math.max(first, last))
      }
    }
    if (from <= to) intervals.push({ start: from, end: to })
  }
  let coveredTo = 0
  for (const interval of intervals.sort((a, b) => a.start - b.start)) {
    if (interval.start > coveredTo + epsilon) return false
    coveredTo = Math.max(coveredTo, interval.end)
  }
  return coveredTo >= 1 - epsilon
}

function drawingCovered(drawing: CanvasDrawing, higher: Bounds[]): boolean {
  return (
    drawing.strokes.length > 0 &&
    drawing.strokes.every((stroke) =>
      stroke.every((point, index) => {
        const next = stroke[index + 1] ?? point
        const start = { x: drawing.x + point.x, y: drawing.y + point.y }
        return (
          fullyCovered(
            { x: start.x - 1.5, y: start.y - 1.5, width: 3, height: 3 },
            higher,
          ) &&
          segmentCovered(
            start,
            { x: drawing.x + next.x, y: drawing.y + next.y },
            higher,
          )
        )
      }),
    )
  )
}

function revealDrawing(
  drawing: CanvasDrawing,
  higher: Bounds[],
  world: Workspace,
): GesturePoint | null {
  const points = drawing.strokes.flat()
  if (!points.length) return null
  // A bounded set of actual ink points keeps large drawings inexpensive.
  // Requiring clearance around a point reveals ink, rather than an empty
  // corner of a drawing's transparent bounding box.
  const candidates = Array.from(
    { length: Math.min(32, points.length) },
    (_, i) =>
      points[
        Math.round(
          (i * (points.length - 1)) /
            Math.max(1, Math.min(32, points.length) - 1),
        )
      ],
  )
  const blockers = higher.map((other) => ({
    x: other.x - drawingPeek,
    y: other.y - drawingPeek,
    width: other.width + drawingPeek * 2,
    height: other.height + drawingPeek * 2,
  }))
  let best: GesturePoint | null = null
  let bestDistance = Infinity
  for (const point of candidates) {
    const body = {
      x: drawing.x + point.x - 1,
      y: drawing.y + point.y - 1,
      width: 2,
      height: 2,
    }
    const position = revealPosition(drawing, body, blockers, world, 2)
    if (!position) continue
    const distance =
      (position.x - drawing.x) ** 2 + (position.y - drawing.y) ** 2
    if (
      distance < bestDistance - epsilon ||
      (Math.abs(distance - bestDistance) <= epsilon &&
        (!best ||
          position.y < best.y ||
          (position.y === best.y && position.x < best.x)))
    ) {
      best = position
      bestDistance = distance
    }
  }
  return best
}

/** Restore and reveal background objects without rearranging any windows. */
export function settleBackgroundItems(
  workspace: Workspace,
  layers: PeekLayers = {},
): Workspace {
  const restored = restoreBackgroundItems(workspace, layers)
  const items = [...restored.items]
  const ordered = items
    .map((item, index) => ({
      index,
      raised: layers.raisedItemIds?.has(item.id) ?? false,
    }))
    .toSorted(
      (a, b) => Number(b.raised) - Number(a.raised) || b.index - a.index,
    )
  const higherIcons: DesktopItem[] = []
  let changed = false
  // Raised decorations cover background work, but stay below ordinary windows.
  for (const { index, raised } of ordered) {
    const item = items[index]
    const body = iconBody(item)
    const higher = [
      ...coveringWindows(restored, raised, layers),
      ...coveringIcons(higherIcons, raised, layers).map(iconBody),
    ]
    if (fullyCovered(body, higher)) {
      const position = revealPosition(item, body, higher, restored, iconPeek)
      if (position) {
        items[index] = moveBackground(item, position)
        changed ||= items[index] !== item
      }
    }
    higherIcons.push(items[index])
  }
  const drawings = restored.drawings.map((drawing) => {
    const raised = layers.raisedDrawingIds?.has(drawing.id) ?? false
    const higher = [
      ...coveringWindows(restored, raised, layers),
      ...coveringIcons(items, raised, layers).map(iconBody),
    ]
    if (drawing.layer !== 'below' || !drawingCovered(drawing, higher))
      return drawing
    const position = revealDrawing(drawing, higher, restored)
    if (!position) return drawing
    const moved = moveBackground(drawing, position)
    changed ||= moved !== drawing
    return moved
  })
  return changed ? { ...restored, items, drawings } : restored
}

/** Reveal fully covered bodies without changing their size or stacking order. */
export function settleCoveredItems(
  workspace: Workspace,
  layers: PeekLayers = {},
): Workspace {
  const windows = [...workspace.windows]
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
  return settleBackgroundItems(
    changed ? { ...workspace, windows } : workspace,
    layers,
  )
}
