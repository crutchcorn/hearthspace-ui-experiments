export type PreviewSnapshot = Map<
  string,
  { x: number; y: number; width: number; height: number; opacity: number }
>

const duration = 360
const easing = 'cubic-bezier(0.22, 0.61, 0.36, 1)'
const edgeClearance = 48

type Rectangle = { x: number; y: number; width: number; height: number }
type Viewport = { width: number; height: number }

function hasBounds(bounds: DOMRect) {
  return (
    [bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite) &&
    bounds.width > 0 &&
    bounds.height > 0
  )
}

function isVisible(bounds: Rectangle, viewport: Viewport) {
  return (
    bounds.x < viewport.width &&
    bounds.x + bounds.width > 0 &&
    bounds.y < viewport.height &&
    bounds.y + bounds.height > 0
  )
}

function visibleTravel(start: Rectangle, end: Rectangle, viewport: Viewport) {
  let enter = 0
  let exit = 1
  const distances = (bounds: Rectangle) => [
    bounds.x + bounds.width + edgeClearance,
    viewport.width + edgeClearance - bounds.x,
    bounds.y + bounds.height + edgeClearance,
    viewport.height + edgeClearance - bounds.y,
  ]
  const startDistances = distances(start)
  const endDistances = distances(end)
  for (let index = 0; index < startDistances.length; index++) {
    const distance = startDistances[index]
    const change = endDistances[index] - distance
    if (change === 0) {
      if (distance < 0) return null
    } else if (change > 0) enter = Math.max(enter, -distance / change)
    else exit = Math.min(exit, -distance / change)
    if (enter > exit) return null
  }
  const at = (progress: number): Rectangle => ({
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress,
    width: start.width + (end.width - start.width) * progress,
    height: start.height + (end.height - start.height) * progress,
  })
  return { start: at(enter), end: at(exit) }
}

function compensate(bounds: Rectangle, target: Rectangle) {
  return `translate(${bounds.x - target.x}px, ${bounds.y - target.y}px) scale(${bounds.width / target.width}, ${bounds.height / target.height})`
}

export function captureWindowPreview(
  elements: Map<string, HTMLElement>,
): PreviewSnapshot {
  const snapshot: PreviewSnapshot = new Map()
  for (const [id, element] of elements) {
    if (!element.isConnected) continue
    const bounds = element.getBoundingClientRect()
    if (!hasBounds(bounds)) continue
    const opacity = Number.parseFloat(getComputedStyle(element).opacity)
    snapshot.set(id, {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      opacity: Number.isFinite(opacity) ? Math.max(0, Math.min(1, opacity)) : 1,
    })
  }
  return snapshot
}

export function animateWindowReveal(
  elements: Map<string, HTMLElement>,
  snapshot: PreviewSnapshot,
  selectedId: string,
  viewport: Viewport,
): Animation[] {
  if (
    ![viewport.width, viewport.height].every(Number.isFinite) ||
    viewport.width <= 0 ||
    viewport.height <= 0
  )
    return []
  // Read every final rectangle before animation writes can affect layout.
  const targets = [...elements].flatMap(([id, element]) => {
    const previous = snapshot.get(id)
    if (
      !element.isConnected ||
      !previous ||
      previous.width <= 0 ||
      previous.height <= 0 ||
      !Object.values(previous).every(Number.isFinite)
    )
      return []
    const bounds = element.getBoundingClientRect()
    return hasBounds(bounds) ? [{ id, element, previous, bounds }] : []
  })

  return targets.flatMap(({ id, element, previous, bounds }) => {
    const targetVisible = isVisible(bounds, viewport)
    if (id !== selectedId && previous.opacity === 0 && !targetVisible) return []
    // Discard distant, invisible travel without changing the path through view.
    const travel = visibleTravel(previous, bounds, viewport)
    if (!travel) return []
    return [
      element.animate(
        [
          {
            transformOrigin: '0 0',
            transform: compensate(travel.start, bounds),
            opacity: previous.opacity,
          },
          {
            transformOrigin: '0 0',
            transform: compensate(travel.end, bounds),
            opacity: id === selectedId || targetVisible ? 1 : previous.opacity,
          },
        ],
        { duration, easing, fill: 'both' },
      ),
    ]
  })
}
