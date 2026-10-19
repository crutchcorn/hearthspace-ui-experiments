import {
  clamp,
  type Bounds,
  type CanvasControl,
  type DesktopItem,
  type Workspace,
} from './desktop.ts'
import type { CanvasDrawing } from './drawings.ts'
import {
  getFrameBounds,
  FRAME_WIDGETS,
  getPlacement,
  getTargetGroup,
  setObjectPlacement,
  mergeFrameTargets,
  targetKey,
  ungroupFrameTarget,
  type FrameEdge,
  type FrameLayout,
  type LayoutTarget,
  type ObjectPlacement,
} from './frame-layout.ts'
import {
  settleLayoutDrop,
  transformCanvasWorkspace,
} from './layout-workspace.ts'
import { mergeOverlappingFrameItems } from './frame-collisions.ts'
import { restoreBackgroundItems } from './peek-layout.ts'

export type RemovableSceneTarget = {
  kind: 'window' | 'item' | 'drawing'
  id: string
}

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
  workspace: Omit<Workspace, 'items' | 'drawings' | 'controls'>
  items: SceneItem[]
  drawings: SceneDrawing[]
  layout: FrameLayout
}

function removeMissingMembers(workspace: Workspace, layout: FrameLayout) {
  const windows = new Set(workspace.windows.map((item) => item.id))
  const items = new Set(workspace.items.map((item) => item.id))
  const drawings = new Set(workspace.drawings.map((drawing) => drawing.id))
  let next = layout
  for (const group of Object.values(layout.groups ?? {})) {
    for (const member of group.members) {
      if (
        (member.kind === 'window' && !windows.has(member.id)) ||
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
  for (const control of workspace.controls ?? []) {
    const target = { kind: 'widget' as const, id: control.id }
    const placement = getPlacement(cleanLayout, target)
    if (
      getTargetGroup(cleanLayout, target) ||
      (placement.surface !== 'canvas' && placement.surface !== 'background')
    )
      continue
    // Controls own their geometry in the layout, never in a second scene array.
    placements[targetKey(target)] = {
      surface: placement.surface,
      x: control.x,
      y: control.y,
      width: control.width,
      height: control.height,
      ...(control.peekOrigin ? { peekOrigin: control.peekOrigin } : {}),
    }
  }
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
    controls: FRAME_WIDGETS.flatMap((widget): CanvasControl[] => {
      const target = { kind: 'widget' as const, id: widget.id }
      const placement = getPlacement(layout, target)
      if (
        getTargetGroup(layout, target) ||
        (placement.surface !== 'canvas' && placement.surface !== 'background')
      )
        return []
      const width = Math.min(
        placement.width ??
          (widget.id === 'tools' ? 299 : widget.id === 'apps' ? 320 : 54),
        scene.workspace.width,
      )
      const height = Math.min(placement.height ?? 54, scene.workspace.height)
      const origin = placement.peekOrigin
      const peekOrigin =
        origin &&
        origin.x + width <= scene.workspace.width &&
        origin.y + height <= scene.workspace.height
          ? origin
          : undefined
      return [
        {
          id: widget.id,
          surface: placement.surface,
          x: clamp(
            placement.x ?? scene.workspace.home.x + 100,
            0,
            scene.workspace.width - width,
          ),
          y: clamp(
            placement.y ?? scene.workspace.home.y + 120,
            0,
            scene.workspace.height - height,
          ),
          width,
          height,
          ...(peekOrigin ? { peekOrigin } : {}),
        },
      ]
    }),
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

function sameOrigin(a?: Pick<Bounds, 'x' | 'y'>, b?: Pick<Bounds, 'x' | 'y'>) {
  return a === b || (a?.x === b?.x && a?.y === b?.y)
}

function sameLocation(a: SceneLocation, b: SceneLocation): boolean {
  if (a.surface !== b.surface) return false
  if (a.surface === 'frame' && b.surface === 'frame')
    return a.edge === b.edge && a.position === b.position
  if (a.surface === 'group' && b.surface === 'group')
    return a.groupId === b.groupId
  return (
    'x' in a &&
    'x' in b &&
    a.x === b.x &&
    a.y === b.y &&
    sameOrigin(a.peekOrigin, b.peekOrigin)
  )
}

function samePlacement(a: ObjectPlacement, b: ObjectPlacement): boolean {
  if (a === b) return true
  if (a.surface !== b.surface) return false
  if (a.surface === 'hidden') return true
  if (a.surface === 'frame' && b.surface === 'frame')
    return a.edge === b.edge && a.position === b.position
  return (
    (a.surface === 'canvas' || a.surface === 'background') &&
    (b.surface === 'canvas' || b.surface === 'background') &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    sameOrigin(a.peekOrigin, b.peekOrigin)
  )
}

function sameRecord<T>(
  a: Record<string, T> | undefined,
  b: Record<string, T> | undefined,
  same: (a: T, b: T) => boolean = Object.is,
) {
  if (a === b) return true
  if (!a || !b) return false
  const keys = Object.keys(a)
  return (
    keys.length === Object.keys(b).length &&
    keys.every((key) => Object.hasOwn(b, key) && same(a[key], b[key]))
  )
}

function retainArray<T>(previous: T[], next: T[]): T[] {
  return previous.length === next.length &&
    next.every((item, index) => item === previous[index])
    ? previous
    : next
}

function canonicalLayout(
  previous: FrameLayout,
  layout: FrameLayout,
  workspace: Workspace,
): FrameLayout {
  const windows = new Set(workspace.windows.map((window) => window.id))
  const placements = Object.fromEntries(
    Object.entries(layout.placements).filter(
      ([key]) =>
        !key.startsWith('item:') &&
        !key.startsWith('drawing:') &&
        (!key.startsWith('window:') || windows.has(key.slice(7))),
    ),
  )
  const next = {
    ...layout,
    placements: sameRecord(previous.placements, placements, samePlacement)
      ? previous.placements
      : placements,
  }
  return next.placements === previous.placements &&
    next.allowHideTools === previous.allowHideTools &&
    sameRecord(previous.groups, next.groups) &&
    sameRecord(previous.expanded, next.expanded) &&
    sameRecord(previous.options, next.options)
    ? previous
    : next
}

/** Apply geometry/content deltas without converting the scene back into a saved model. */
export function updateSceneWorkspace(
  scene: Scene,
  action: Workspace | ((workspace: Workspace) => Workspace),
  view: Bounds,
): Scene {
  const projection = projectScene(scene, view)
  const workspace =
    typeof action === 'function' ? action(projection.workspace) : action
  return applyWorkspaceChanges(scene, projection, workspace)
}

function applyWorkspaceChanges(
  scene: Scene,
  projection: ReturnType<typeof projectScene>,
  workspace: Workspace,
): Scene {
  const before = projection.workspace
  if (workspace === before) return scene
  let layout = removeMissingMembers(workspace, projection.layout)
  const oldItems = new Map(scene.items.map((item) => [item.id, item]))
  const oldDrawings = new Map(
    scene.drawings.map((drawing) => [drawing.id, drawing]),
  )
  const items =
    workspace.items === before.items && layout === projection.layout
      ? scene.items
      : retainArray(
          scene.items,
          workspace.items.map((item) => {
            const previous = oldItems.get(item.id)
            const location = canonicalLocation(
              layout,
              { kind: 'item', id: item.id },
              item,
              'background',
            )
            if (
              previous &&
              previous.title === item.title &&
              previous.kind === item.kind &&
              previous.appId === item.appId &&
              previous.width === item.width &&
              previous.height === item.height &&
              sameLocation(previous.location, location)
            )
              return previous
            return {
              id: item.id,
              title: item.title,
              kind: item.kind,
              appId: item.appId,
              width: item.width,
              height: item.height,
              location,
            }
          }),
        )
  const drawings =
    workspace.drawings === before.drawings && layout === projection.layout
      ? scene.drawings
      : retainArray(
          scene.drawings,
          workspace.drawings.map((drawing) => {
            const previous = oldDrawings.get(drawing.id)
            const location = canonicalLocation(
              layout,
              { kind: 'drawing', id: drawing.id },
              drawing,
              drawing.layer === 'below' ? 'background' : 'canvas',
            )
            if (
              previous &&
              previous.width === drawing.width &&
              previous.height === drawing.height &&
              previous.strokes === drawing.strokes &&
              sameLocation(previous.location, location)
            )
              return previous
            return {
              id: drawing.id,
              width: drawing.width,
              height: drawing.height,
              strokes: drawing.strokes,
              location,
            }
          }),
        )
  if (workspace.controls !== before.controls) {
    const placements = { ...layout.placements }
    for (const control of workspace.controls ?? []) {
      const target = { kind: 'widget' as const, id: control.id }
      const placement = getPlacement(layout, target)
      if (
        getTargetGroup(layout, target) ||
        (placement.surface !== 'canvas' && placement.surface !== 'background')
      )
        continue
      placements[targetKey(target)] = {
        surface: placement.surface,
        x: control.x,
        y: control.y,
        width: control.width,
        height: control.height,
        ...(control.peekOrigin ? { peekOrigin: control.peekOrigin } : {}),
      }
    }
    layout = { ...layout, placements }
  }
  layout = canonicalLayout(scene.layout, layout, workspace)
  const geometry =
    scene.workspace.width === workspace.width &&
    scene.workspace.height === workspace.height &&
    scene.workspace.windows === workspace.windows &&
    scene.workspace.note === workspace.note &&
    sameOrigin(scene.workspace.home, workspace.home)
      ? scene.workspace
      : {
          width: workspace.width,
          height: workspace.height,
          home: workspace.home,
          windows: workspace.windows,
          note: workspace.note,
        }
  return geometry === scene.workspace &&
    items === scene.items &&
    drawings === scene.drawings &&
    layout === scene.layout
    ? scene
    : { ...scene, workspace: geometry, items, drawings, layout }
}

/** Layout changes only touch the location of affected objects and layout metadata. */
export function updateSceneLayout(
  scene: Scene,
  action: FrameLayout | ((layout: FrameLayout) => FrameLayout),
  view: Bounds,
): Scene {
  const projection = projectScene(scene, view)
  const requested =
    typeof action === 'function' ? action(projection.layout) : action
  return applyLayoutChanges(scene, projection, requested)
}

function applyLayoutChanges(
  scene: Scene,
  projection: ReturnType<typeof projectScene>,
  requested: FrameLayout,
): Scene {
  if (requested === projection.layout) return scene
  const layout = removeMissingMembers(projection.workspace, requested)
  const items = retainArray(
    scene.items,
    scene.items.map((item, index) => {
      const location = canonicalLocation(
        layout,
        { kind: 'item', id: item.id },
        projection.workspace.items[index],
        'background',
      )
      return sameLocation(item.location, location)
        ? item
        : { ...item, location }
    }),
  )
  const drawings = retainArray(
    scene.drawings,
    scene.drawings.map((drawing, index) => {
      const projected = projection.workspace.drawings[index]
      const location = canonicalLocation(
        layout,
        { kind: 'drawing', id: drawing.id },
        projected,
        projected.layer === 'below' ? 'background' : 'canvas',
      )
      return sameLocation(drawing.location, location)
        ? drawing
        : { ...drawing, location }
    }),
  )
  const nextLayout = canonicalLayout(scene.layout, layout, projection.workspace)
  return items === scene.items &&
    drawings === scene.drawings &&
    nextLayout === scene.layout
    ? scene
    : { ...scene, items, drawings, layout: nextLayout }
}

export type ScenePlacementOptions = {
  settle?: boolean
  bounds?: Bounds
  position?: Pick<Bounds, 'x' | 'y'>
}
export type SceneDestination = { target: LayoutTarget; bounds: Bounds }
export type SceneDragSnapshot = {
  target: LayoutTarget
  layout: FrameLayout
  object?:
    | Workspace['windows'][number]
    | Workspace['items'][number]
    | Workspace['drawings'][number]
}

export function restoreSceneBackground(scene: Scene, view: Bounds): Scene {
  const projection = projectScene(scene, view)
  return applyWorkspaceChanges(
    scene,
    projection,
    transformCanvasWorkspace(
      projection.workspace,
      projection.layout,
      restoreBackgroundItems,
    ),
  )
}

/** A placement change and the neighboring objects it displaces form one edit. */
export function placeSceneObject(
  scene: Scene,
  target: LayoutTarget,
  placement: ObjectPlacement,
  view: Bounds,
  options: ScenePlacementOptions = {},
): Scene {
  const projection = projectScene(scene, view)
  const previous = getPlacement(projection.layout, target)
  let placed = applyLayoutChanges(
    scene,
    projection,
    setObjectPlacement(projection.layout, target, placement),
  )
  if (options.position && target.kind !== 'widget' && target.kind !== 'group')
    placed = moveCanvasObject(
      placed,
      { kind: target.kind, id: target.id },
      options.position.x,
      options.position.y,
    )
  if (target.kind === 'drawing') {
    const drawings = retainArray(
      placed.drawings,
      placed.drawings.map((drawing) => {
        if (
          drawing.id !== target.id ||
          !('peekOrigin' in drawing.location) ||
          !drawing.location.peekOrigin
        )
          return drawing
        const location = { ...drawing.location }
        delete location.peekOrigin
        return { ...drawing, location }
      }),
    )
    if (drawings !== placed.drawings) placed = { ...placed, drawings }
  }
  if (
    options.settle === false &&
    target.kind !== 'drawing' &&
    previous.surface === placement.surface
  )
    return placed
  const next = projectScene(placed, view)
  return applyWorkspaceChanges(
    placed,
    next,
    options.settle === false
      ? transformCanvasWorkspace(
          next.workspace,
          next.layout,
          restoreBackgroundItems,
        )
      : settleLayoutDrop(next.workspace, next.layout, target, options.bounds),
  )
}

/** Pointer movement only copies the object being moved, not the rendered scene. */
function moveCanvasObject(
  scene: Scene,
  target: RemovableSceneTarget,
  x: number,
  y: number,
): Scene {
  const position = (object: { width: number; height: number }) => ({
    x: clamp(x, 0, scene.workspace.width - object.width),
    y: clamp(y, 0, scene.workspace.height - object.height),
  })
  if (target.kind === 'window') {
    const windows = retainArray(
      scene.workspace.windows,
      scene.workspace.windows.map((window) => {
        if (window.id !== target.id) return window
        const next = position(window)
        return window.x === next.x && window.y === next.y
          ? window
          : { ...window, ...next }
      }),
    )
    return windows === scene.workspace.windows
      ? scene
      : { ...scene, workspace: { ...scene.workspace, windows } }
  }
  const move = <T extends SceneItem | SceneDrawing>(object: T): T => {
    if (
      object.id !== target.id ||
      (object.location.surface !== 'canvas' &&
        object.location.surface !== 'background')
    )
      return object
    const location: SceneLocation = {
      surface: object.location.surface,
      ...position(object),
    }
    return sameLocation(object.location, location)
      ? object
      : { ...object, location }
  }
  const field = target.kind === 'item' ? 'items' : 'drawings'
  const objects =
    field === 'items'
      ? retainArray(scene.items, scene.items.map(move))
      : retainArray(scene.drawings, scene.drawings.map(move))
  return objects === scene[field] ? scene : { ...scene, [field]: objects }
}

export function moveSceneObject(
  scene: Scene,
  target: LayoutTarget,
  x: number,
  y: number,
  view: Bounds,
): Scene {
  const object =
    target.kind === 'item'
      ? scene.items.find((item) => item.id === target.id)
      : target.kind === 'drawing'
        ? scene.drawings.find((drawing) => drawing.id === target.id)
        : undefined
  const placement =
    object && object.location.surface !== 'group'
      ? object.location
      : getPlacement(scene.layout, target)
  const surface = placement.surface === 'background' ? 'background' : 'canvas'
  if (target.kind === 'widget' || target.kind === 'group')
    return placeSceneObject(scene, target, { surface, x, y }, view, {
      settle: false,
    })
  const detached =
    getTargetGroup(scene.layout, target) || placement.surface === 'frame'
      ? updateSceneLayout(
          scene,
          (layout) => setObjectPlacement(layout, target, { surface }),
          view,
        )
      : scene
  return moveCanvasObject(detached, { kind: target.kind, id: target.id }, x, y)
}

export function groupSceneObjects(
  scene: Scene,
  source: LayoutTarget,
  target: LayoutTarget,
  before: boolean,
  view: Bounds,
): Scene {
  return restoreSceneBackground(
    updateSceneLayout(
      scene,
      (layout) => mergeFrameTargets(layout, source, target, before),
      view,
    ),
    view,
  )
}

export function mergeSceneFrameOverlaps(
  scene: Scene,
  entries: Parameters<typeof mergeOverlappingFrameItems>[1],
  view: Bounds,
): Scene {
  return restoreSceneBackground(
    updateSceneLayout(
      scene,
      (layout) => mergeOverlappingFrameItems(layout, entries),
      view,
    ),
    view,
  )
}

export function releaseSceneGroup(
  scene: Scene,
  target: LayoutTarget,
  surface: 'canvas' | 'background',
  destinations: SceneDestination[],
  view: Bounds,
): Scene {
  const released = updateSceneLayout(
    scene,
    (layout) => {
      let next = ungroupFrameTarget(layout, target)
      for (const destination of destinations)
        next = setObjectPlacement(next, destination.target, {
          surface,
          ...(destination.target.kind === 'widget' ? destination.bounds : {}),
        })
      return next
    },
    view,
  )
  const projection = projectScene(released, view)
  const workspace = projection.workspace
  const positions = new Map(
    destinations.map((destination) => [
      targetKey(destination.target),
      destination.bounds,
    ]),
  )
  const position = <T extends Bounds & { id: string }>(
    item: T,
    kind: LayoutTarget['kind'],
  ): T => {
    const bounds = positions.get(targetKey({ kind, id: item.id }))
    return bounds
      ? {
          ...item,
          x: clamp(bounds.x, 0, workspace.width - item.width),
          y: clamp(bounds.y, 0, workspace.height - item.height),
          peekOrigin: undefined,
        }
      : item
  }
  let next: Workspace = {
    ...workspace,
    windows: workspace.windows.map((item) => position(item, 'window')),
    items: workspace.items.map((item) => position(item, 'item')),
    drawings: workspace.drawings.map((item) => position(item, 'drawing')),
  }
  for (const destination of destinations)
    next = settleLayoutDrop(
      next,
      projection.layout,
      destination.target,
      destination.bounds,
    )
  return applyWorkspaceChanges(released, projection, next)
}

export function ungroupSceneObject(
  scene: Scene,
  target: LayoutTarget,
  placements: { target: LayoutTarget; placement: ObjectPlacement }[],
  view: Bounds,
): Scene {
  return updateSceneLayout(
    scene,
    (layout) => {
      let next = ungroupFrameTarget(layout, target)
      for (const entry of placements)
        next = setObjectPlacement(next, entry.target, entry.placement)
      return next
    },
    view,
  )
}

export function restoreSceneDrag(
  scene: Scene,
  snapshot: SceneDragSnapshot,
  view: Bounds,
): Scene {
  const restored = updateSceneLayout(scene, snapshot.layout, view)
  if (!snapshot.object) return restored
  const field =
    snapshot.target.kind === 'window'
      ? 'windows'
      : snapshot.target.kind === 'item'
        ? 'items'
        : 'drawings'
  return updateSceneWorkspace(
    restored,
    (workspace) => ({
      ...workspace,
      [field]: workspace[field].map((item) =>
        item.id === snapshot.target.id ? snapshot.object : item,
      ),
    }),
    view,
  )
}

/** Deleting work also releases its frame slot and any background work it covered. */
export function removeSceneObject(
  scene: Scene,
  target: RemovableSceneTarget,
  view: Bounds,
): Scene {
  const detached = updateSceneLayout(
    scene,
    (layout) => {
      const next = ungroupFrameTarget(layout, target)
      const placements = { ...next.placements }
      delete placements[targetKey(target)]
      return { ...next, placements }
    },
    view,
  )
  const field =
    target.kind === 'window'
      ? 'windows'
      : target.kind === 'item'
        ? 'items'
        : 'drawings'
  return restoreSceneBackground(
    updateSceneWorkspace(
      detached,
      (workspace) => ({
        ...workspace,
        [field]: workspace[field].filter((item) => item.id !== target.id),
      }),
      view,
    ),
    view,
  )
}
