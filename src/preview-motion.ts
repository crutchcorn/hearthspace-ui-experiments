export type PreviewSnapshot = Map<
  string,
  { x: number; y: number; width: number; height: number; opacity: number }
>

const duration = 320
const easing = 'cubic-bezier(0.2, 0.7, 0.1, 1)'
const identity = 'translate(0px, 0px) scale(1, 1)'

function hasBounds(bounds: DOMRect) {
  return (
    [bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite) &&
    bounds.width > 0 &&
    bounds.height > 0
  )
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
): Animation[] {
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

  return targets.map(({ id, element, previous, bounds }) => {
    const transform = `translate(${previous.x - bounds.x}px, ${previous.y - bounds.y}px) scale(${previous.width / bounds.width}, ${previous.height / bounds.height})`
    const origin = { transformOrigin: '0 0' }
    if (id === selectedId)
      return element.animate(
        [
          { ...origin, transform, opacity: previous.opacity },
          { ...origin, transform: identity, opacity: 1 },
        ],
        { duration, easing, fill: 'both' },
      )

    // Other previews disappear in place, then reappear at their actual bounds.
    const fadeOut = 100 / duration
    return element.animate(
      [
        {
          ...origin,
          transform,
          opacity: previous.opacity,
          offset: 0,
          easing,
        },
        { ...origin, transform, opacity: 0, offset: fadeOut },
        {
          ...origin,
          transform: identity,
          opacity: 0,
          offset: fadeOut,
          easing,
        },
        { ...origin, transform: identity, opacity: 1, offset: 1 },
      ],
      { duration, fill: 'both' },
    )
  })
}
