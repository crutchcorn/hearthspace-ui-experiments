import type { Bounds } from './desktop.ts'

export type FrameEdge = 'top' | 'right' | 'bottom' | 'left'
export type LayoutTarget = {
  kind: 'widget' | 'item' | 'window' | 'drawing' | 'group'
  id: string
}
export type ObjectPlacement =
  | {
      surface: 'canvas' | 'background'
      x?: number
      y?: number
      width?: number
      height?: number
      peekOrigin?: Pick<Bounds, 'x' | 'y'>
    }
  | { surface: 'frame'; edge: FrameEdge; position: number }
  | { surface: 'hidden' }
export type FrameGroup = {
  id: string
  members: LayoutTarget[]
}
export type FrameLayout = {
  placements: Record<string, ObjectPlacement>
  allowHideTools: boolean
  groups?: Record<string, FrameGroup>
  expanded?: Record<string, boolean>
}

export const FRAME_WIDGETS = [
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Recent notifications and activity.',
    keywords: ['activity', 'inbox', 'alerts'],
    defaultPlacement: { surface: 'frame', edge: 'top', position: 0 },
  },
  {
    id: 'clock',
    title: 'Clock',
    description: 'The time and calendar.',
    keywords: ['date', 'time', 'calendar', 'system tray'],
    defaultPlacement: { surface: 'frame', edge: 'top', position: 1 },
  },
  {
    id: 'wifi',
    title: 'Wi-Fi',
    description: 'Network connection and controls.',
    keywords: ['wifi', 'network', 'internet', 'wireless', 'system tray'],
    defaultPlacement: { surface: 'frame', edge: 'top', position: 1 },
  },
  {
    id: 'volume',
    title: 'Sound',
    description: 'Sound output and volume.',
    keywords: ['volume', 'audio', 'speaker', 'system tray'],
    defaultPlacement: { surface: 'frame', edge: 'top', position: 1 },
  },
  {
    id: 'battery',
    title: 'Battery',
    description: 'Battery charge and power status.',
    keywords: ['power', 'charge', 'percentage', 'system tray'],
    defaultPlacement: { surface: 'frame', edge: 'top', position: 1 },
  },
  {
    id: 'tools',
    title: 'Canvas tools',
    description: 'Choose a canvas tool.',
    keywords: ['toolbar', 'toolbox', 'canvas tools'],
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

export function getFrameGroups(layout: FrameLayout): FrameGroup[] {
  return Object.values(layout.groups ?? {})
}

export function getTargetGroup(
  layout: FrameLayout,
  target: LayoutTarget,
): FrameGroup | undefined {
  if (target.kind === 'group')
    return layout.groups && Object.hasOwn(layout.groups, target.id)
      ? layout.groups[target.id]
      : undefined
  return getFrameGroups(layout).find((group) =>
    group.members.some((member) => targetKey(member) === targetKey(target)),
  )
}

export function getPlacement(
  layout: FrameLayout,
  target: LayoutTarget,
): ObjectPlacement {
  const group = getTargetGroup(layout, target)
  const placementTarget = group
    ? { kind: 'group' as const, id: group.id }
    : target
  return protectPlacement(
    layout,
    target,
    layout.placements[targetKey(placementTarget)] ??
      defaultPlacement(group?.members[0] ?? target),
  )
}

export function ungroupFrameTarget(
  layout: FrameLayout,
  target: LayoutTarget,
): FrameLayout {
  const group = getTargetGroup(layout, target)
  if (!group) return layout
  const placement = getPlacement(layout, { kind: 'group', id: group.id })
  const remaining =
    target.kind === 'group'
      ? []
      : group.members.filter(
          (member) => targetKey(member) !== targetKey(target),
        )
  const groups = { ...layout.groups }
  const placements = { ...layout.placements }
  const detached =
    remaining.length < 2
      ? group.members
      : group.members.filter(
          (member) => targetKey(member) === targetKey(target),
        )
  for (const member of detached) placements[targetKey(member)] = placement
  if (remaining.length < 2) {
    delete groups[group.id]
    delete placements[targetKey({ kind: 'group', id: group.id })]
  } else groups[group.id] = { ...group, members: remaining }
  return { ...layout, groups, placements }
}

export function setObjectPlacement(
  layout: FrameLayout,
  target: LayoutTarget,
  placement: ObjectPlacement,
): FrameLayout {
  const previous = getPlacement(layout, target)
  if (
    target.kind === 'widget' &&
    (placement.surface === 'canvas' || placement.surface === 'background') &&
    (previous.surface === 'canvas' || previous.surface === 'background')
  ) {
    // A coordinate-only drag retains the measured control body. Its home is
    // carried only when the caller deliberately supplies it (for resizing).
    placement = {
      ...(previous.width === undefined ? {} : { width: previous.width }),
      ...(previous.height === undefined ? {} : { height: previous.height }),
      ...placement,
    }
  }
  if (target.kind === 'group' && placement.surface === 'hidden') {
    const group = getTargetGroup(layout, target)
    if (!group) return layout
    let next = ungroupFrameTarget(layout, target)
    for (const member of group.members)
      next = setObjectPlacement(next, member, placement)
    return next
  }
  const next =
    target.kind === 'group' ? layout : ungroupFrameTarget(layout, target)
  return {
    ...next,
    placements: {
      ...next.placements,
      [targetKey(target)]: protectPlacement(next, target, placement),
    },
  }
}

export function mergeFrameTargets(
  layout: FrameLayout,
  source: LayoutTarget,
  target: LayoutTarget,
  before = false,
): FrameLayout {
  const canGroup = (candidate: LayoutTarget) =>
    candidate.kind !== 'group' || Boolean(getTargetGroup(layout, candidate))
  if (
    !canGroup(source) ||
    !canGroup(target) ||
    targetKey(source) === targetKey(target)
  )
    return layout
  const sourceGroup = getTargetGroup(layout, source)
  const targetGroup = getTargetGroup(layout, target)
  if (source.kind === 'group' && sourceGroup?.id === targetGroup?.id)
    return layout
  const sourceMembers =
    source.kind === 'group' ? sourceGroup!.members : [source]
  const placement = getPlacement(layout, target)
  if (placement.surface !== 'frame') return layout
  const sourceKeys = new Set(sourceMembers.map(targetKey))
  const targetMembers = (targetGroup?.members ?? [target]).filter(
    (member) => !sourceKeys.has(targetKey(member)),
  )
  const targetIndex = targetMembers.findIndex(
    (member) => targetKey(member) === targetKey(target),
  )
  const insertionIndex =
    target.kind === 'group'
      ? before
        ? 0
        : targetMembers.length
      : targetIndex < 0
        ? targetMembers.length
        : targetIndex + (before ? 0 : 1)
  const members = [...targetMembers]
  members.splice(insertionIndex, 0, ...sourceMembers)
  if (members.length < 2) return layout

  let next = layout
  for (const member of sourceMembers) next = ungroupFrameTarget(next, member)
  const groups = { ...next.groups }
  const placements = { ...next.placements }
  let id = targetGroup?.id
  if (!id) {
    let index = 1
    while (Object.hasOwn(groups, `group-${index}`)) index++
    id = `group-${index}`
  }
  groups[id] = { id, members }
  placements[targetKey({ kind: 'group', id })] = placement
  for (const member of members) delete placements[targetKey(member)]
  return { ...next, groups, placements }
}

const EXPANDABLE_WIDGETS = new Set([
  'notifications',
  'clock',
  'wifi',
  'volume',
  'battery',
])

export function getWidgetExpanded(layout: FrameLayout, id: string): boolean {
  if (!EXPANDABLE_WIDGETS.has(id)) return false
  return layout.expanded?.[id] ?? (id === 'clock' || id === 'notifications')
}

export function setWidgetExpanded(
  layout: FrameLayout,
  id: string,
  expanded: boolean,
): FrameLayout {
  if (!EXPANDABLE_WIDGETS.has(id)) return layout
  return { ...layout, expanded: { ...layout.expanded, [id]: expanded } }
}

export function setAllowHideTools(
  layout: FrameLayout,
  allowHideTools: boolean,
): FrameLayout {
  const next = { ...layout, allowHideTools }
  const tools: LayoutTarget = { kind: 'widget', id: 'tools' }
  if (
    !allowHideTools &&
    layout.placements[targetKey(tools)]?.surface === 'hidden'
  )
    return setObjectPlacement(next, tools, defaultPlacement(tools))
  return next
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
      kind !== 'drawing' &&
      kind !== 'group')
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
    for (const dimension of ['width', 'height'] as const) {
      if (!(dimension in value)) continue
      const size = Reflect.get(value, dimension)
      if (typeof size === 'number' && Number.isFinite(size) && size > 0)
        placement[dimension] = size
    }
    if (
      'peekOrigin' in value &&
      isRecord(value.peekOrigin) &&
      typeof value.peekOrigin.x === 'number' &&
      Number.isFinite(value.peekOrigin.x) &&
      value.peekOrigin.x >= 0 &&
      typeof value.peekOrigin.y === 'number' &&
      Number.isFinite(value.peekOrigin.y) &&
      value.peekOrigin.y >= 0
    )
      placement.peekOrigin = {
        x: value.peekOrigin.x,
        y: value.peekOrigin.y,
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function systemGroup(): FrameGroup {
  return {
    id: 'system',
    members: ['clock', 'wifi', 'volume', 'battery'].map((id) => ({
      kind: 'widget',
      id,
    })),
  }
}

export function readFrameLayout(value: unknown): FrameLayout {
  const layout: FrameLayout = {
    placements: {},
    allowHideTools: false,
    groups: {},
  }
  const saved = isRecord(value) ? value : {}
  layout.allowHideTools = saved.allowHideTools === true
  const savedPlacements = isRecord(saved.placements) ? saved.placements : {}
  for (const [key, savedPlacement] of Object.entries(savedPlacements)) {
    const target = readTarget(key)
    const placement = readPlacement(savedPlacement)
    if (target && placement)
      layout.placements[key] = protectPlacement(layout, target, placement)
  }

  const claimedMembers = new Set<string>()
  if (isRecord(saved.groups)) {
    for (const [id, value] of Object.entries(saved.groups)) {
      if (
        !id ||
        id === '__proto__' ||
        id === 'constructor' ||
        id === 'prototype' ||
        !isRecord(value) ||
        value.id !== id ||
        !Array.isArray(value.members)
      )
        continue
      const members: LayoutTarget[] = []
      const keys = new Set<string>()
      for (const candidate of value.members) {
        if (
          !isRecord(candidate) ||
          typeof candidate.id !== 'string' ||
          (candidate.kind !== 'widget' &&
            candidate.kind !== 'item' &&
            candidate.kind !== 'window' &&
            candidate.kind !== 'drawing')
        )
          continue
        const member = readTarget(`${candidate.kind}:${candidate.id}`)
        if (!member) continue
        const key = targetKey(member)
        if (claimedMembers.has(key) || keys.has(key)) continue
        keys.add(key)
        members.push(member)
      }
      const groupKey = targetKey({ kind: 'group', id })
      const placement =
        layout.placements[groupKey] ??
        (members[0] ? getPlacement(layout, members[0]) : undefined)
      if (members.length < 2) {
        for (const member of members)
          if (placement) layout.placements[targetKey(member)] = placement
        continue
      }
      layout.groups![id] = { id, members }
      layout.placements[groupKey] = placement!
      for (const member of members) {
        claimedMembers.add(targetKey(member))
        delete layout.placements[targetKey(member)]
      }
    }
  } else {
    const group = systemGroup()
    layout.groups![group.id] = group
    layout.placements[targetKey({ kind: 'group', id: group.id })] = {
      surface: 'frame',
      edge: 'top',
      position: 1,
    }
  }
  for (const key of Object.keys(layout.placements)) {
    const target = readTarget(key)
    if (target?.kind === 'group' && !Object.hasOwn(layout.groups!, target.id))
      delete layout.placements[key]
  }
  if (isRecord(saved.expanded)) {
    layout.expanded = {}
    for (const [id, expanded] of Object.entries(saved.expanded))
      if (EXPANDABLE_WIDGETS.has(id) && typeof expanded === 'boolean')
        layout.expanded[id] = expanded
  }
  return layout
}

export function getFrameBounds(
  placement: Extract<ObjectPlacement, { surface: 'frame' }>,
  width: number,
  height: number,
  viewport: { width: number; height: number },
  edgeSpacing: 'flush' | 'padded' = 'flush',
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
        ? viewport.width - fittedWidth - (edgeSpacing === 'padded' ? insetX : 0)
        : edgeSpacing === 'padded'
          ? insetX
          : 0,
    y: horizontal
      ? placement.edge === 'bottom'
        ? viewport.height -
          fittedHeight -
          (edgeSpacing === 'padded' ? insetY : 0)
        : edgeSpacing === 'padded'
          ? insetY
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

export function getFrameDragBounds(
  bounds: Bounds,
  viewport: { width: number; height: number },
): Bounds {
  // Grab the exposed part of a pinned window, not its hidden offscreen body.
  const x = Math.max(0, bounds.x)
  const y = Math.max(0, bounds.y)
  return {
    x,
    y,
    width: Math.max(0, Math.min(viewport.width, bounds.x + bounds.width) - x),
    height: Math.max(
      0,
      Math.min(viewport.height, bounds.y + bounds.height) - y,
    ),
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
  currentEdge?: FrameEdge,
): Extract<ObjectPlacement, { surface: 'frame' }> | null {
  // Turning a toolbar must not change its edge target and turn it back again.
  const size = Math.min(bounds.width, bounds.height)
  const target = getFrameDropTarget(
    {
      x: bounds.x + (bounds.width - size) / 2,
      y: bounds.y + (bounds.height - size) / 2,
      width: size,
      height: size,
    },
    viewport,
    maximumDistance,
  )
  if (!target || (target.position !== 0 && target.position !== 1)) return target

  const targetIsVertical = target.edge === 'left' || target.edge === 'right'
  const atLeft =
    target.edge === 'left' || (!targetIsVertical && target.position === 0)
  const atTop =
    target.edge === 'top' || (targetIsVertical && target.position === 0)
  const keepVertical = currentEdge === 'left' || currentEdge === 'right'
  return {
    surface: 'frame',
    edge: keepVertical ? (atLeft ? 'left' : 'right') : atTop ? 'top' : 'bottom',
    position: keepVertical ? (atTop ? 0 : 1) : atLeft ? 0 : 1,
  }
}
