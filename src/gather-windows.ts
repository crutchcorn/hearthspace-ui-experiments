import {
  clamp,
  MIN_HEIGHT,
  MIN_WIDTH,
  type Bounds,
  type DesktopWindow,
  type Workspace,
} from './desktop'
import { getWindowClearance } from './window-layout'

function appIdentity(item: DesktopWindow) {
  if (typeof item.appId === 'string' && item.appId.trim())
    return `app:${item.appId}`
  if (item.kind === 'notes') return 'app:notes'
  return null
}

function overlap(a: Bounds, b: Bounds) {
  return (
    Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x)) *
    Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y))
  )
}

function titlebar(item: Bounds): Bounds {
  return { ...item, height: Math.min(32, item.height) }
}

export function gatherRelatedWindows(
  workspace: Workspace,
  selectedIds: string[],
  view: Bounds,
): Workspace {
  const selected = new Set(selectedIds)
  const anchors = workspace.windows.filter((item) => selected.has(item.id))
  const apps = new Set(anchors.map(appIdentity).filter((app) => app !== null))
  const candidates = workspace.windows.filter((item) => {
    const app = appIdentity(item)
    return !selected.has(item.id) && app !== null && apps.has(app)
  })
  if (!candidates.length) return workspace

  const clearance = getWindowClearance(view.width)
  const left = clamp(view.x + clearance.side, 0, workspace.width)
  const top = clamp(view.y + clearance.top, 0, workspace.height)
  const right = clamp(
    view.x + view.width - clearance.side,
    left,
    workspace.width,
  )
  const bottom = clamp(
    view.y + view.height - clearance.bottom,
    top,
    workspace.height,
  )
  const availableWidth = right - left
  const availableHeight = bottom - top
  if (availableWidth <= 0 || availableHeight <= 0) return workspace

  const group = {
    x: Math.min(...anchors.map((item) => item.x)),
    y: Math.min(...anchors.map((item) => item.y)),
    width: 0,
    height: 0,
  }
  group.width =
    Math.max(...anchors.map((item) => item.x + item.width)) - group.x
  group.height =
    Math.max(...anchors.map((item) => item.y + item.height)) - group.y
  const occupied: Bounds[] = [...anchors]
  const gathered = candidates.map(({ restore, ...item }) => {
    const original = restore ?? item
    const width = clamp(
      original.width,
      Math.min(MIN_WIDTH, availableWidth),
      availableWidth,
    )
    const height = clamp(
      original.height,
      Math.min(MIN_HEIGHT, availableHeight),
      availableHeight,
    )
    const beside = (bounds: Bounds) => [
      { x: bounds.x + bounds.width + 24, y: bounds.y },
      { x: bounds.x - width - 24, y: bounds.y },
      { x: bounds.x, y: bounds.y + bounds.height + 24 },
      { x: bounds.x, y: bounds.y - height - 24 },
    ]
    const options = [
      ...beside(group),
      ...occupied.flatMap(beside),
      { x: left, y: top },
      { x: right - width, y: top },
      { x: left, y: bottom - height },
      { x: right - width, y: bottom - height },
      ...Array.from(
        { length: Math.min(candidates.length + 1, 12) },
        (_, index) => ({
          x: left + index * 24,
          y: top + index * 32,
        }),
      ),
    ].map((position) => ({
      x: clamp(position.x, left, right - width),
      y: clamp(position.y, top, bottom - height),
      width,
      height,
    }))
    const score = (bounds: Bounds) => {
      const header = titlebar(bounds)
      const coveredHeaders = occupied.reduce((total, entry) => {
        const existingHeader = titlebar(entry)
        return (
          total +
          overlap(bounds, existingHeader) /
            (entry.width * existingHeader.height)
        )
      }, 0)
      const hiddenHeader = anchors.reduce(
        (total, entry) =>
          total + overlap(header, entry) / (header.width * header.height),
        0,
      )
      const coveredArea = occupied.reduce(
        (total, entry) => total + overlap(bounds, entry) / (width * height),
        0,
      )
      // Prefer reachable titles before minimizing overlap in a crowded viewport.
      return coveredHeaders * 1000 + hiddenHeader * 100 + coveredArea
    }
    const placement = options.reduce((best, option) =>
      score(option) < score(best) ? option : best,
    )
    occupied.push(placement)
    return { ...item, ...placement }
  })

  const gatheredIds = new Set(gathered.map((item) => item.id))
  const unrelated = workspace.windows.filter(
    (item) => !selected.has(item.id) && !gatheredIds.has(item.id),
  )
  const selectedOnTop = gathered.every((item) =>
    anchors.every((anchor) => overlap(titlebar(item), anchor) === 0),
  )
  return {
    ...workspace,
    windows: [
      ...unrelated,
      ...(selectedOnTop
        ? [...gathered, ...anchors]
        : [...anchors, ...gathered]),
    ],
  }
}
