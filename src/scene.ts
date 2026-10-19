import type { Bounds, DesktopItem, Workspace } from './desktop.ts'
import type { CanvasDrawing } from './drawings.ts'
import {
  getFrameBounds,
  getPlacement,
  getTargetGroup,
  targetKey,
  ungroupFrameTarget,
  type FrameEdge,
  type FrameLayout,
  type LayoutTarget,
  type ObjectPlacement,
} from './frame-layout.ts'

type SceneLocation =
  | {
      surface: 'canvas' | 'background'
      x: number
      y: number
      peekOrigin?: Pick<Bounds, 'x' | 'y'>
    }
  | { surface: 'frame'; edge: FrameEdge; position: number }
  | { surface: 'group'; groupId: string }

type SceneItem = Omit<DesktopItem, 'x' | 'y' | 'peekOrigin'> & {
  location: SceneLocation
}
type SceneDrawing = Omit<CanvasDrawing, 'x' | 'y' | 'peekOrigin' | 'layer'> & {
  location: SceneLocation
}
export type Scene = {
  workspace: Omit<Workspace, 'items' | 'drawings'>
  items: SceneItem[]
  drawings: SceneDrawing[]
  layout: FrameLayout
}

function removeMissingMembers(workspace: Workspace, layout: FrameLayout) {
  const items = new Set(workspace.items.map((item) => item.id))
  const drawings = new Set(workspace.drawings.map((drawing) => drawing.id))
  let next = layout
  for (const group of Object.values(layout.groups ?? {})) {
    for (const member of group.members) {
      if (
        (member.kind === 'item' && !items.has(member.id)) ||
        (member.kind === 'drawing' && !drawings.has(member.id))
      )
        next = ungroupFrameTarget(next, member)
    }
  }
  return next
}

function canonicalLocation(
  layout: FrameLayout,
  target: LayoutTarget,
  object: Bounds & { peekOrigin?: Pick<Bounds, 'x' | 'y'> },
  defaultSurface: 'canvas' | 'background',
): SceneLocation {
  const group = getTargetGroup(layout, target)
  if (group) return { surface: 'group', groupId: group.id }
  const placement = layout.placements[targetKey(target)]
  if (placement?.surface === 'frame')
    return {
      surface: 'frame',
      edge: placement.edge,
      position: placement.position,
    }
  const canvas =
    placement?.surface === 'canvas' || placement?.surface === 'background'
      ? placement
      : { surface: defaultSurface }
  return {
    surface: canvas.surface,
    x: canvas.x ?? object.x,
    y: canvas.y ?? object.y,
    ...(object.peekOrigin
      ? { peekOrigin: { x: object.peekOrigin.x, y: object.peekOrigin.y } }
      : {}),
  }
}

/** Personal objects own one location; layout holds only controls and groups. */
export function createScene(workspace: Workspace, layout: FrameLayout): Scene {
  const cleanLayout = removeMissingMembers(workspace, layout)
  const placements = Object.fromEntries(
    Object.entries(cleanLayout.placements).filter(
      ([key]) => !key.startsWith('item:') && !key.startsWith('drawing:'),
    ),
  )
  return {
    workspace: {
      width: workspace.width,
      height: workspace.height,
      home: workspace.home,
      windows: workspace.windows,
      note: workspace.note,
    },
    items: workspace.items.map((item) => ({
      id: item.id,
      title: item.title,
      kind: item.kind,
      appId: item.appId,
      width: item.width,
      height: item.height,
      location: canonicalLocation(
        cleanLayout,
        { kind: 'item', id: item.id },
        item,
        'background',
      ),
    })),
    drawings: workspace.drawings.map((drawing) => ({
      id: drawing.id,
      width: drawing.width,
      height: drawing.height,
      strokes: drawing.strokes,
      location: canonicalLocation(
        cleanLayout,
        { kind: 'drawing', id: drawing.id },
        drawing,
        drawing.layer === 'below' ? 'background' : 'canvas',
      ),
    })),
    layout: { ...cleanLayout, placements },
  }
}

function projectPlacement(location: SceneLocation): ObjectPlacement | null {
  if (location.surface === 'group') return null
  if (location.surface === 'frame')
    return {
      surface: 'frame',
      edge: location.edge,
      position: location.position,
    }
  // Canvas coordinates belong to the object, never to a second layout entry.
  return { surface: location.surface }
}

function projectLocation(
  object: SceneItem | SceneDrawing,
  layout: FrameLayout,
  view: Bounds,
  compact: boolean,
): Bounds & {
  surface: 'canvas' | 'background' | 'frame' | 'hidden'
  peekOrigin?: Pick<Bounds, 'x' | 'y'>
} {
  const location = object.location
  const placement =
    location.surface === 'group'
      ? getPlacement(layout, { kind: 'group', id: location.groupId })
      : location
  if (placement.surface === 'frame') {
    const frame = getFrameBounds(
      placement,
      compact ? 54 : object.width,
      compact ? 54 : object.height,
      view,
      compact ? 'padded' : 'flush',
    )
    return {
      surface: 'frame',
      x: view.x + frame.x,
      y: view.y + frame.y,
      width: object.width,
      height: object.height,
    }
  }
  return {
    surface: placement.surface,
    x: 'x' in placement ? (placement.x ?? view.x + 100) : view.x + 100,
    y: 'y' in placement ? (placement.y ?? view.y + 120) : view.y + 120,
    width: object.width,
    height: object.height,
    ...((location.surface === 'canvas' || location.surface === 'background') &&
    location.peekOrigin
      ? { peekOrigin: location.peekOrigin }
      : {}),
  }
}

/** Bounds are a view of the scene, not a second stored location for frame work. */
export function projectScene(scene: Scene, view: Bounds) {
  const placements = { ...scene.layout.placements }
  for (const item of scene.items) {
    const placement = projectPlacement(item.location)
    if (placement)
      placements[targetKey({ kind: 'item', id: item.id })] = placement
  }
  for (const drawing of scene.drawings) {
    const placement = projectPlacement(drawing.location)
    if (placement)
      placements[targetKey({ kind: 'drawing', id: drawing.id })] = placement
  }
  const layout: FrameLayout = { ...scene.layout, placements }
  const workspace: Workspace = {
    ...scene.workspace,
    items: scene.items.map((item) => {
      const bounds = projectLocation(item, layout, view, true)
      return {
        id: item.id,
        title: item.title,
        kind: item.kind,
        appId: item.appId,
        x: bounds.x,
        y: bounds.y,
        width: item.width,
        height: item.height,
        ...(bounds.peekOrigin ? { peekOrigin: bounds.peekOrigin } : {}),
      }
    }),
    drawings: scene.drawings.map((drawing) => {
      const bounds = projectLocation(drawing, layout, view, false)
      return {
        id: drawing.id,
        strokes: drawing.strokes,
        layer: bounds.surface === 'background' ? 'below' : 'above',
        x: bounds.x,
        y: bounds.y,
        width: drawing.width,
        height: drawing.height,
        ...(bounds.peekOrigin ? { peekOrigin: bounds.peekOrigin } : {}),
      }
    }),
  }
  return { workspace, layout }
}

function equalValue(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false
  const entries = Object.entries(a)
  if (entries.length !== Object.keys(b).length) return false
  return entries.every(
    ([key, value]) =>
      Object.hasOwn(b, key) && equalValue(value, Reflect.get(b, key)),
  )
}

function reconcileScene(previous: Scene, next: Scene): Scene {
  // Unchanged strokes, window objects, and content retain identity, so equality
  // only visits changed metadata/locations during ordinary pointer movement.
  if (equalValue(previous, next)) return previous
  const previousItems = new Map(previous.items.map((item) => [item.id, item]))
  const previousDrawings = new Map(
    previous.drawings.map((drawing) => [drawing.id, drawing]),
  )
  return {
    ...next,
    items: next.items.map((item) => {
      const previousItem = previousItems.get(item.id)
      return previousItem && equalValue(previousItem, item)
        ? previousItem
        : item
    }),
    drawings: next.drawings.map((drawing) => {
      const previousDrawing = previousDrawings.get(drawing.id)
      return previousDrawing && equalValue(previousDrawing, drawing)
        ? previousDrawing
        : drawing
    }),
  }
}

export function updateSceneWorkspace(
  scene: Scene,
  action: Workspace | ((workspace: Workspace) => Workspace),
  view: Bounds,
): Scene {
  const projection = projectScene(scene, view)
  const workspace =
    typeof action === 'function' ? action(projection.workspace) : action
  if (workspace === projection.workspace) return scene
  return reconcileScene(scene, createScene(workspace, projection.layout))
}

export function updateSceneLayout(
  scene: Scene,
  action: FrameLayout | ((layout: FrameLayout) => FrameLayout),
  view: Bounds,
): Scene {
  const projection = projectScene(scene, view)
  const layout =
    typeof action === 'function' ? action(projection.layout) : action
  if (layout === projection.layout) return scene
  return reconcileScene(scene, createScene(projection.workspace, layout))
}
