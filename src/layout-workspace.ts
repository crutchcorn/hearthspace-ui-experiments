import type { Bounds, Workspace } from './desktop.ts'
import type { CanvasDrawing } from './drawings.ts'
import {
  getPlacement,
  targetKey,
  type FrameLayout,
  type LayoutTarget,
  type ObjectPlacement,
} from './frame-layout.ts'
import { settleCoveredItems } from './peek-layout.ts'

function placementFor(
  layout: FrameLayout,
  target: LayoutTarget,
  drawing?: CanvasDrawing,
): ObjectPlacement {
  return (
    layout.placements[targetKey(target)] ??
    (drawing
      ? { surface: drawing.layer === 'below' ? 'background' : 'canvas' }
      : getPlacement(layout, target))
  )
}

function mergeById<T extends { id: string }>(original: T[], updated: T[]): T[] {
  const updates = new Map(updated.map((item) => [item.id, item]))
  const merged = original.map((item) => updates.get(item.id) ?? item)
  return merged.every((item, index) => item === original[index])
    ? original
    : merged
}

/** Apply canvas geometry changes without treating frame attachments as canvas work. */
export function transformCanvasWorkspace(
  workspace: Workspace,
  layout: FrameLayout,
  transform: (canvas: Workspace) => Workspace,
): Workspace {
  const onCanvas = (placement: ObjectPlacement) =>
    placement.surface === 'canvas' || placement.surface === 'background'
  const windowLayers = new Map(
    workspace.windows.map((item) => [
      item.id,
      placementFor(layout, { kind: 'window', id: item.id }),
    ]),
  )
  const drawings = workspace.drawings.flatMap((drawing) => {
    const placement = placementFor(
      layout,
      { kind: 'drawing', id: drawing.id },
      drawing,
    )
    if (!onCanvas(placement)) return []
    const layer: CanvasDrawing['layer'] =
      placement.surface === 'background' ? 'below' : 'above'
    return [drawing.layer === layer ? drawing : { ...drawing, layer }]
  })
  const canvas: Workspace = {
    ...workspace,
    windows: workspace.windows
      .filter((item) => onCanvas(windowLayers.get(item.id)!))
      .toSorted(
        (a, b) =>
          Number(windowLayers.get(a.id)!.surface !== 'background') -
          Number(windowLayers.get(b.id)!.surface !== 'background'),
      ),
    items: workspace.items.filter(
      (item) =>
        placementFor(layout, { kind: 'item', id: item.id }).surface ===
        'background',
    ),
    drawings,
  }
  const result = transform(canvas)
  if (result === canvas) return workspace
  const originalDrawings = new Map(
    workspace.drawings.map((drawing) => [drawing.id, drawing]),
  )
  const projectedDrawings = new Map(
    drawings.map((drawing) => [drawing.id, drawing]),
  )
  const updatedDrawings = result.drawings.map((drawing) => {
    const original = originalDrawings.get(drawing.id)
    if (!original) return drawing
    if (drawing === projectedDrawings.get(drawing.id)) return original
    return drawing.layer === original.layer
      ? drawing
      : { ...drawing, layer: original.layer }
  })
  return {
    ...result,
    windows: mergeById(workspace.windows, result.windows),
    items: mergeById(workspace.items, result.items),
    drawings: mergeById(workspace.drawings, updatedDrawings),
  }
}

/** Keep the dropped object fixed while surrounding canvas work makes room. */
export function settleLayoutDrop(
  workspace: Workspace,
  layout: FrameLayout,
  target: LayoutTarget,
  extraBounds?: Bounds,
): Workspace {
  const drawing =
    target.kind === 'drawing'
      ? workspace.drawings.find((item) => item.id === target.id)
      : undefined
  const placement = placementFor(layout, target, drawing)
  const bounds =
    target.kind === 'window'
      ? workspace.windows.find((item) => item.id === target.id)
      : target.kind === 'item'
        ? workspace.items.find((item) => item.id === target.id)
        : (drawing ?? extraBounds)
  if (
    !bounds ||
    placement.surface === 'frame' ||
    placement.surface === 'hidden'
  )
    return transformCanvasWorkspace(workspace, layout, settleCoveredItems)

  const backgroundDrop = placement.surface === 'background'
  return transformCanvasWorkspace(workspace, layout, (canvas) => {
    let proxyId = '__layout-drop__'
    while (canvas.windows.some((item) => item.id === proxyId)) proxyId += '_'
    const result = settleCoveredItems({
      ...canvas,
      windows: [
        ...canvas.windows.filter(
          (item) => target.kind !== 'window' || item.id !== target.id,
        ),
        { ...bounds, id: proxyId, title: '', kind: 'empty' },
      ],
      items: canvas.items.filter(
        (item) => target.kind !== 'item' || item.id !== target.id,
      ),
      drawings: canvas.drawings.filter(
        (item) => target.kind !== 'drawing' || item.id !== target.id,
      ),
    })
    const windows = new Map(result.windows.map((item) => [item.id, item]))
    const items = new Map(result.items.map((item) => [item.id, item]))
    const drawings = new Map(result.drawings.map((item) => [item.id, item]))
    const commitPosition = <
      T extends Bounds & { id: string; peekOrigin?: Pick<Bounds, 'x' | 'y'> },
    >(
      original: T,
      updated: T,
      kind: 'item' | 'drawing',
    ): T => {
      const home = updated.peekOrigin
      // Lowering a window can make its existing peeks permanent without another move.
      const homeOverlapsDrop =
        home &&
        home.x < bounds.x + bounds.width &&
        home.x + updated.width > bounds.x &&
        home.y < bounds.y + bounds.height &&
        home.y + updated.height > bounds.y
      if (
        backgroundDrop &&
        updated.peekOrigin &&
        ((target.kind === kind && target.id === updated.id) ||
          original.x !== updated.x ||
          original.y !== updated.y ||
          homeOverlapsDrop)
      ) {
        const committed = { ...updated }
        delete committed.peekOrigin
        return committed
      }
      return updated
    }
    return {
      ...result,
      windows: canvas.windows.map((item) => {
        if (target.kind === 'window' && item.id === target.id) return item
        // Lowering work must not relocate windows on the raised canvas layer.
        if (
          backgroundDrop &&
          placementFor(layout, { kind: 'window', id: item.id }).surface !==
            'background'
        )
          return item
        return windows.get(item.id) ?? item
      }),
      items: canvas.items.map((item) =>
        commitPosition(item, items.get(item.id) ?? item, 'item'),
      ),
      drawings: canvas.drawings.map((item) =>
        commitPosition(item, drawings.get(item.id) ?? item, 'drawing'),
      ),
    }
  })
}
