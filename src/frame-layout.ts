import type { Bounds } from './desktop.ts'

export type FrameEdge = 'top' | 'right' | 'bottom' | 'left'
export type LayoutTarget = {
  kind: 'widget' | 'item' | 'window' | 'drawing'
  id: string
}
export type ObjectPlacement =
  | { surface: 'canvas' | 'background'; x?: number; y?: number }
  | { surface: 'frame'; edge: FrameEdge; position: number }
  | { surface: 'hidden' }
export type FrameLayout = {
  placements: Record<string, ObjectPlacement>
  allowHideTools: boolean
}

export const FRAME_LAYOUT_STORAGE_KEY = 'hearthspace-frame-layout-v1'

export const FRAME_WIDGETS = [
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Recent notifications and activity.',
    keywords: ['activity', 'inbox', 'alerts'],
    defaultPlacement: { surface: 'frame', edge: 'top', position: 0 },
  },
  {
    id: 'system',
    title: 'System tray',
    description: 'Sound, network, battery, and system controls.',
    keywords: ['wifi', 'network', 'battery', 'volume', 'sound', 'settings'],
    defaultPlacement: { surface: 'frame', edge: 'top', position: 1 },
  },
  {
    id: 'tools',
    title: 'Canvas tools',
    description: 'Select, move, draw, search, and change the layout.',
    keywords: ['cursor', 'pan', 'draw', 'search', 'arrange', 'layout', 'map'],
    defaultPlacement: { surface: 'frame', edge: 'bottom', position: 0 },
  },
  {
    id: 'apps',
    title: 'Apps',
    description: 'App launcher, favorites, and running windows.',
    keywords: ['dock', 'launcher', 'favorites', 'running', 'open windows'],
    defaultPlacement: { surface: 'frame', edge: 'bottom', position: 1 },
  },
] as const

export function targetKey(target: LayoutTarget): string {
  return `${target.kind}:${target.id}`
}

function defaultPlacement(target: LayoutTarget): ObjectPlacement {
  return (
    (target.kind === 'widget'
      ? FRAME_WIDGETS.find((widget) => widget.id === target.id)
          ?.defaultPlacement
      : undefined) ?? {
      surface: target.kind === 'item' ? 'background' : 'canvas',
    }
  )
}

function protectPlacement(
  layout: FrameLayout,
  target: LayoutTarget,
  placement: ObjectPlacement,
): ObjectPlacement {
  if (placement.surface !== 'hidden') return placement
  if (target.kind !== 'widget') return defaultPlacement(target)
  if (target.id === 'tools' && !layout.allowHideTools)
    return defaultPlacement(target)
  return placement
}

export function getPlacement(
  layout: FrameLayout,
  target: LayoutTarget,
): ObjectPlacement {
  return protectPlacement(
    layout,
    target,
    layout.placements[targetKey(target)] ?? defaultPlacement(target),
  )
}

export function setObjectPlacement(
  layout: FrameLayout,
  target: LayoutTarget,
  placement: ObjectPlacement,
): FrameLayout {
  return {
    ...layout,
    placements: {
      ...layout.placements,
      [targetKey(target)]: protectPlacement(layout, target, placement),
    },
  }
}

export function setAllowHideTools(
  layout: FrameLayout,
  allowHideTools: boolean,
): FrameLayout {
  const next = { ...layout, allowHideTools }
  const tools: LayoutTarget = { kind: 'widget', id: 'tools' }
  return setObjectPlacement(next, tools, getPlacement(next, tools))
}

function readTarget(key: string): LayoutTarget | null {
  const separator = key.indexOf(':')
  const kind = key.slice(0, separator)
  const id = key.slice(separator + 1)
  if (
    separator < 1 ||
    !id ||
    (kind !== 'widget' &&
      kind !== 'item' &&
      kind !== 'window' &&
      kind !== 'drawing')
  )
    return null
  if (kind === 'widget' && !FRAME_WIDGETS.some((widget) => widget.id === id))
    return null
  return { kind, id }
}

function readPlacement(value: unknown): ObjectPlacement | null {
  if (!value || typeof value !== 'object') return null
  if (!('surface' in value)) return null
  if (value.surface === 'hidden') return { surface: 'hidden' }
  if (value.surface === 'canvas' || value.surface === 'background') {
    const placement: ObjectPlacement = { surface: value.surface }
    if ('x' in value) {
      if (typeof value.x !== 'number' || !Number.isFinite(value.x)) return null
      placement.x = value.x
    }
    if ('y' in value) {
      if (typeof value.y !== 'number' || !Number.isFinite(value.y)) return null
      placement.y = value.y
    }
    return placement
  }
  if (
    value.surface === 'frame' &&
    'edge' in value &&
    (value.edge === 'top' ||
      value.edge === 'right' ||
      value.edge === 'bottom' ||
      value.edge === 'left') &&
    'position' in value &&
    typeof value.position === 'number' &&
    Number.isFinite(value.position)
  )
    return {
      surface: 'frame',
      edge: value.edge,
      position: Math.max(0, Math.min(value.position, 1)),
    }
  return null
}

function normalizeLayout(value: unknown): FrameLayout {
  const layout: FrameLayout = { placements: {}, allowHideTools: false }
  if (!value || typeof value !== 'object') return layout
  layout.allowHideTools =
    'allowHideTools' in value && value.allowHideTools === true
  if (
    !('placements' in value) ||
    !value.placements ||
    typeof value.placements !== 'object' ||
    Array.isArray(value.placements)
  )
    return layout
  for (const [key, saved] of Object.entries(value.placements)) {
    const target = readTarget(key)
    const placement = readPlacement(saved)
    if (target && placement)
      layout.placements[key] = protectPlacement(layout, target, placement)
  }
  return layout
}

export function loadFrameLayout(): FrameLayout {
  try {
    return normalizeLayout(
      JSON.parse(localStorage.getItem(FRAME_LAYOUT_STORAGE_KEY) ?? 'null'),
    )
  } catch {
    return { placements: {}, allowHideTools: false }
  }
}

export function saveFrameLayout(layout: FrameLayout): void {
  try {
    localStorage.setItem(
      FRAME_LAYOUT_STORAGE_KEY,
      JSON.stringify(normalizeLayout(layout)),
    )
  } catch {
    // Keep the current layout usable when browser storage is unavailable.
  }
}

export function getFrameBounds(
  placement: Extract<ObjectPlacement, { surface: 'frame' }>,
  width: number,
  height: number,
  viewport: { width: number; height: number },
): Bounds {
  const margin = viewport.width <= 760 ? 12 : 24
  const insetX = Math.min(margin, viewport.width / 2)
  const insetY = Math.min(margin, viewport.height / 2)
  const fittedWidth = Math.min(width, Math.max(0, viewport.width - insetX * 2))
  const fittedHeight = Math.min(
    height,
    Math.max(0, viewport.height - insetY * 2),
  )
  const availableX = viewport.width - insetX * 2 - fittedWidth
  const availableY = viewport.height - insetY * 2 - fittedHeight
  const position = Math.max(0, Math.min(placement.position, 1))
  const horizontal = placement.edge === 'top' || placement.edge === 'bottom'
  return {
    x: horizontal
      ? insetX + availableX * position
      : placement.edge === 'right'
        ? viewport.width - fittedWidth
        : 0,
    y: horizontal
      ? placement.edge === 'bottom'
        ? viewport.height - fittedHeight
        : 0
      : insetY + availableY * position,
    width: fittedWidth,
    height: fittedHeight,
  }
}

export function getPinnedWindowOffset(
  bounds: Bounds,
  edge: FrameEdge,
  viewport: { width: number; height: number },
  expanded: boolean,
  exposedSize = 42,
): { x: number; y: number } {
  if (expanded) return { x: 0, y: 0 }
  const visibleWidth = Math.max(0, Math.min(exposedSize, bounds.width))
  const visibleHeight = Math.max(0, Math.min(exposedSize, bounds.height))
  return {
    x:
      edge === 'left'
        ? -(bounds.x + bounds.width - visibleWidth)
        : edge === 'right'
          ? viewport.width - bounds.x - visibleWidth
          : 0,
    y:
      edge === 'top'
        ? -(bounds.y + bounds.height - visibleHeight)
        : edge === 'bottom'
          ? viewport.height - bounds.y - visibleHeight
          : 0,
  }
}

export function getFrameDropTarget(
  bounds: Bounds,
  viewport: { width: number; height: number },
  maximumDistance = 72,
): Extract<ObjectPlacement, { surface: 'frame' }> | null {
  const distances: { edge: FrameEdge; distance: number }[] = [
    { edge: 'top', distance: bounds.y },
    { edge: 'right', distance: viewport.width - bounds.x - bounds.width },
    { edge: 'bottom', distance: viewport.height - bounds.y - bounds.height },
    { edge: 'left', distance: bounds.x },
  ]
  const closest = distances.reduce((nearest, candidate) =>
    candidate.distance < nearest.distance ? candidate : nearest,
  )
  if (closest.distance > maximumDistance) return null
  const horizontal = closest.edge === 'top' || closest.edge === 'bottom'
  const margin = viewport.width <= 760 ? 12 : 24
  const extent = horizontal ? viewport.width : viewport.height
  const size = Math.min(
    horizontal ? bounds.width : bounds.height,
    Math.max(0, extent - margin * 2),
  )
  const start = horizontal ? bounds.x : bounds.y
  const originalSize = horizontal ? bounds.width : bounds.height
  const center = start + originalSize / 2
  const span = extent - margin * 2 - size
  const offset = center - margin - size / 2
  const position =
    span <= 0
      ? 0.5
      : offset <= 80
        ? 0
        : span - offset <= 80
          ? 1
          : Math.max(0, Math.min(offset / span, 1))
  return { surface: 'frame', edge: closest.edge, position }
}

export function getWidgetFrameDropTarget(
  bounds: Bounds,
  viewport: { width: number; height: number },
  maximumDistance = 72,
): Extract<ObjectPlacement, { surface: 'frame' }> | null {
  // Turning a toolbar must not change its edge target and turn it back again.
  const size = Math.min(bounds.width, bounds.height)
  return getFrameDropTarget(
    {
      x: bounds.x + (bounds.width - size) / 2,
      y: bounds.y + (bounds.height - size) / 2,
      width: size,
      height: size,
    },
    viewport,
    maximumDistance,
  )
}
