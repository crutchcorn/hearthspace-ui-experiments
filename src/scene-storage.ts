import {
  clamp,
  createWorkspace,
  MIN_HEIGHT,
  MIN_WIDTH,
  type Bounds,
  type DesktopWindow,
} from './desktop.ts'
import { readDrawingStrokes } from './drawings.ts'
import { APP_CATALOG } from './components/launcher-apps.ts'
import {
  readFrameLayout,
  targetKey,
  type FrameLayout,
  type LayoutTarget,
} from './frame-layout.ts'
import { createScene, type Scene } from './scene.ts'

export const SCENE_STORAGE_KEY = 'hearthspace-scene-v2'

type World = Pick<Bounds, 'width' | 'height'>
type Location = Scene['items'][number]['location']

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function point<T>(value: T): value is T & Pick<Bounds, 'x' | 'y'> {
  return record(value) && finite(value.x) && finite(value.y)
}

function bounds<T>(value: T): value is T & Bounds {
  return (
    point(value) &&
    'width' in value &&
    'height' in value &&
    finite(value.width) &&
    finite(value.height)
  )
}

function readPeekOrigin(value: unknown, size: World, world: World) {
  return point(value) &&
    value.x >= 0 &&
    value.y >= 0 &&
    value.x + size.width <= world.width &&
    value.y + size.height <= world.height
    ? { x: value.x, y: value.y }
    : undefined
}

function readLocation(
  value: unknown,
  size: World,
  world: World,
  layout: FrameLayout,
  target: LayoutTarget,
): Location | null {
  if (!record(value)) return null
  if (value.surface === 'canvas' || value.surface === 'background') {
    if (!point(value)) return null
    const peekOrigin = readPeekOrigin(value.peekOrigin, size, world)
    return {
      surface: value.surface,
      x: clamp(value.x, 0, world.width - size.width),
      y: clamp(value.y, 0, world.height - size.height),
      ...(peekOrigin ? { peekOrigin } : {}),
    }
  }
  if (
    value.surface === 'frame' &&
    (value.edge === 'left' ||
      value.edge === 'right' ||
      value.edge === 'top' ||
      value.edge === 'bottom') &&
    finite(value.position) &&
    value.position >= 0 &&
    value.position <= 1
  )
    return { surface: 'frame', edge: value.edge, position: value.position }
  if (
    value.surface === 'group' &&
    typeof value.groupId === 'string' &&
    layout.groups &&
    Object.hasOwn(layout.groups, value.groupId) &&
    layout.groups[value.groupId].members.some(
      (member) => targetKey(member) === targetKey(target),
    )
  )
    return { surface: 'group', groupId: value.groupId }
  return null
}

function readWindows(values: unknown[], world: World): DesktopWindow[] {
  const ids = new Set<string>()
  return values.flatMap((value): DesktopWindow[] => {
    if (
      !record(value) ||
      typeof value.id !== 'string' ||
      !value.id.trim() ||
      ids.has(value.id) ||
      typeof value.title !== 'string' ||
      (value.kind !== 'notes' && value.kind !== 'empty') ||
      !bounds(value)
    )
      return []
    ids.add(value.id)
    // Focused/enlarged views return to their ordinary bounds on reload.
    const saved = bounds(value.restore) ? value.restore : value
    const width = clamp(saved.width, MIN_WIDTH, world.width)
    const height = clamp(saved.height, MIN_HEIGHT, world.height)
    return [
      {
        id: value.id,
        title: value.title,
        kind: value.kind,
        ...(typeof value.appId === 'string' ? { appId: value.appId } : {}),
        dockOrder:
          finite(value.dockOrder) && value.dockOrder >= 0
            ? value.dockOrder
            : undefined,
        x: clamp(saved.x, 0, world.width - width),
        y: clamp(saved.y, 0, world.height - height),
        width,
        height,
      },
    ]
  })
}

function readItems(
  values: unknown[],
  world: World,
  layout: FrameLayout,
): Scene['items'] {
  const ids = new Set<string>()
  const apps = new Set<string>()
  const knownApps = new Set(APP_CATALOG.map((app) => app.id))
  return values.flatMap((value): Scene['items'] => {
    if (
      !record(value) ||
      typeof value.id !== 'string' ||
      !value.id.trim() ||
      ids.has(value.id) ||
      typeof value.title !== 'string' ||
      !value.title.trim() ||
      (value.kind !== 'folder' &&
        value.kind !== 'file' &&
        value.kind !== 'app') ||
      typeof value.appId !== 'string' ||
      !knownApps.has(value.appId) ||
      (value.kind === 'app' && apps.has(value.appId)) ||
      !finite(value.width) ||
      value.width <= 0 ||
      !finite(value.height) ||
      value.height <= 0
    )
      return []
    const width = clamp(value.width, 48, world.width)
    const height = clamp(value.height, 64, world.height)
    const location = readLocation(
      value.location,
      { width, height },
      world,
      layout,
      { kind: 'item', id: value.id },
    )
    if (!location) return []
    ids.add(value.id)
    if (value.kind === 'app') apps.add(value.appId)
    return [
      {
        id: value.id,
        title: value.title,
        kind: value.kind,
        appId: value.appId,
        width,
        height,
        location,
      },
    ]
  })
}

function readDrawings(
  values: unknown[],
  world: World,
  layout: FrameLayout,
): Scene['drawings'] {
  const ids = new Set<string>()
  return values.flatMap((value): Scene['drawings'] => {
    if (
      !record(value) ||
      typeof value.id !== 'string' ||
      !value.id.trim() ||
      value.id.length > 200 ||
      ids.has(value.id) ||
      !finite(value.width) ||
      value.width <= 0 ||
      value.width > world.width ||
      !finite(value.height) ||
      value.height <= 0 ||
      value.height > world.height
    )
      return []
    const size = { width: value.width, height: value.height }
    const strokes = readDrawingStrokes(value.strokes, size)
    const location = readLocation(value.location, size, world, layout, {
      kind: 'drawing',
      id: value.id,
    })
    if (!strokes || !location) return []
    ids.add(value.id)
    return [{ id: value.id, ...size, strokes, location }]
  })
}

function includeAppShortcuts(scene: Scene) {
  const defaults = createWorkspace()
  const appIds = new Set(
    scene.items.filter((item) => item.kind === 'app').map((item) => item.appId),
  )
  const ids = new Set(scene.items.map((item) => item.id))
  for (const item of defaults.items) {
    if (item.kind !== 'app' || appIds.has(item.appId)) continue
    let id = item.id
    let suffix = 2
    while (ids.has(id)) id = `${item.id}-${suffix++}`
    ids.add(id)
    scene.items.push({
      id,
      title: item.title,
      kind: item.kind,
      appId: item.appId,
      width: item.width,
      height: item.height,
      location: {
        surface: 'background',
        x: clamp(
          scene.workspace.home.x + item.x - defaults.home.x,
          0,
          scene.workspace.width - item.width,
        ),
        y: clamp(
          scene.workspace.home.y + item.y - defaults.home.y,
          0,
          scene.workspace.height - item.height,
        ),
      },
    })
  }
}

function reconcileLayout(scene: Scene) {
  const items = new Map(scene.items.map((item) => [item.id, item]))
  const drawings = new Map(scene.drawings.map((item) => [item.id, item]))
  const windows = new Set(scene.workspace.windows.map((item) => item.id))
  const groups: NonNullable<FrameLayout['groups']> = {}
  const placements = { ...scene.layout.placements }
  for (const group of Object.values(scene.layout.groups ?? {})) {
    const key = targetKey({ kind: 'group', id: group.id })
    const placement = placements[key]
    const members = group.members.filter((member) => {
      if (member.kind === 'widget') return true
      if (member.kind === 'window') return windows.has(member.id)
      const location = (member.kind === 'item' ? items : drawings).get(
        member.id,
      )?.location
      return location?.surface === 'group' && location.groupId === group.id
    })
    if (members.length >= 2 && placement?.surface === 'frame') {
      groups[group.id] = { id: group.id, members }
      continue
    }
    delete placements[key]
    for (const member of members) {
      if (member.kind === 'widget' || member.kind === 'window') {
        if (placement?.surface === 'frame')
          placements[targetKey(member)] = placement
        continue
      }
      const item = (member.kind === 'item' ? items : drawings).get(member.id)!
      item.location =
        placement?.surface === 'frame'
          ? { ...placement }
          : {
              surface: member.kind === 'item' ? 'background' : 'canvas',
              x: clamp(
                scene.workspace.home.x,
                0,
                scene.workspace.width - item.width,
              ),
              y: clamp(
                scene.workspace.home.y,
                0,
                scene.workspace.height - item.height,
              ),
            }
    }
  }
  for (const [key, placement] of Object.entries(placements)) {
    if (
      key.startsWith('item:') ||
      key.startsWith('drawing:') ||
      (key.startsWith('window:') && !windows.has(key.slice(7)))
    ) {
      delete placements[key]
      continue
    }
    if (placement.surface !== 'canvas' && placement.surface !== 'background')
      continue
    const width = Math.min(placement.width ?? 0, scene.workspace.width)
    const height = Math.min(placement.height ?? 0, scene.workspace.height)
    const peekOrigin = readPeekOrigin(
      placement.peekOrigin,
      { width, height },
      scene.workspace,
    )
    placements[key] = {
      surface: placement.surface,
      ...(placement.x === undefined
        ? {}
        : { x: clamp(placement.x, 0, scene.workspace.width - width) }),
      ...(placement.y === undefined
        ? {}
        : { y: clamp(placement.y, 0, scene.workspace.height - height) }),
      ...(placement.width === undefined ? {} : { width }),
      ...(placement.height === undefined ? {} : { height }),
      ...(peekOrigin ? { peekOrigin } : {}),
    }
  }
  scene.layout = { ...scene.layout, groups, placements }
}

/** Read owned positions directly; frame geometry never depends on this viewport. */
export function readScene(value: unknown): Scene {
  if (
    !record(value) ||
    !record(value.workspace) ||
    !finite(value.workspace.width) ||
    value.workspace.width < 9600 ||
    !finite(value.workspace.height) ||
    value.workspace.height < 7200 ||
    !point(value.workspace.home) ||
    typeof value.workspace.note !== 'string' ||
    !Array.isArray(value.workspace.windows) ||
    !Array.isArray(value.items) ||
    !Array.isArray(value.drawings)
  )
    return createScene(createWorkspace(), readFrameLayout(undefined))
  const world = { width: value.workspace.width, height: value.workspace.height }
  const layout = readFrameLayout(value.layout)
  const scene: Scene = {
    workspace: {
      ...world,
      home: {
        x: clamp(value.workspace.home.x, 0, world.width),
        y: clamp(value.workspace.home.y, 0, world.height),
      },
      note: value.workspace.note,
      windows: readWindows(value.workspace.windows, world),
    },
    items: readItems(value.items, world, layout),
    drawings: readDrawings(value.drawings, world, layout),
    layout,
  }
  includeAppShortcuts(scene)
  reconcileLayout(scene)
  return scene
}

/** Earlier scene and split workspace/layout formats are intentionally not read. */
export function loadScene(): Scene {
  try {
    return readScene(
      JSON.parse(localStorage.getItem(SCENE_STORAGE_KEY) ?? 'null'),
    )
  } catch {
    return readScene(undefined)
  }
}

export function saveScene(scene: Scene): void {
  try {
    localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(scene))
  } catch {
    // Keep the playground usable without browser storage.
  }
}
