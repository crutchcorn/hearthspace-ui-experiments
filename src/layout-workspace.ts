import type { Bounds, Workspace } from './desktop.ts'
import type { FrameLayout, LayoutTarget } from './frame-layout.ts'
import { resolveObjectLocation } from './object-location.ts'
import {
  settleBackgroundItems,
  settleCoveredItems,
  type PeekLayers,
} from './peek-layout.ts'

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
  transform: (canvas: Workspace, layers: PeekLayers) => Workspace,
): Workspace {
  const windowLocations = new Map(
    workspace.windows.map((item) => [
      item.id,
      resolveObjectLocation(layout, { kind: 'window', id: item.id }, item),
    ]),
  )
  const itemLocations = new Map(
    workspace.items.map((item) => [
      item.id,
      resolveObjectLocation(layout, { kind: 'item', id: item.id }, item),
    ]),
  )
  const drawingLocations = new Map(
    workspace.drawings.map((drawing) => [
      drawing.id,
      resolveObjectLocation(
        layout,
        { kind: 'drawing', id: drawing.id },
        drawing,
        drawing.layer === 'below' ? 'background' : 'canvas',
      ),
    ]),
  )
  const atBounds = <T extends Bounds>(item: T, bounds: Bounds): T =>
    item.x === bounds.x && item.y === bounds.y ? item : { ...item, ...bounds }
  const drawings = workspace.drawings.flatMap((drawing) => {
    const location = drawingLocations.get(drawing.id)!
    if (!('bounds' in location)) return []
    const projected = atBounds(drawing, location.bounds)
    // Both canvas layers sit beneath ordinary windows. Run their ink through
    // the shared peek calculation, then restore the presentation layer below.
    return [
      projected.layer === 'below'
        ? projected
        : { ...projected, layer: 'below' as const },
    ]
  })
  const canvas: Workspace = {
    ...workspace,
    windows: workspace.windows
      .flatMap((item) => {
        const location = windowLocations.get(item.id)!
        return 'bounds' in location ? [atBounds(item, location.bounds)] : []
      })
      .toSorted(
        (a, b) =>
          Number(windowLocations.get(a.id)!.surface !== 'background') -
          Number(windowLocations.get(b.id)!.surface !== 'background'),
      ),
    items: workspace.items.flatMap((item) => {
      const location = itemLocations.get(item.id)!
      return 'bounds' in location ? [atBounds(item, location.bounds)] : []
    }),
    drawings,
  }
  const layers: PeekLayers = {
    backgroundWindowIds: new Set(
      canvas.windows.flatMap((item) =>
        windowLocations.get(item.id)!.surface === 'background' ? [item.id] : [],
      ),
    ),
    raisedItemIds: new Set(
      canvas.items.flatMap((item) =>
        itemLocations.get(item.id)!.surface === 'canvas' ? [item.id] : [],
      ),
    ),
    raisedDrawingIds: new Set(
      canvas.drawings.flatMap((drawing) =>
        drawingLocations.get(drawing.id)!.surface === 'canvas'
          ? [drawing.id]
          : [],
      ),
    ),
  }
  const result = transform(canvas, layers)
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
  const storedBounds =
    target.kind === 'window'
      ? workspace.windows.find((item) => item.id === target.id)
      : target.kind === 'item'
        ? workspace.items.find((item) => item.id === target.id)
        : (drawing ?? extraBounds)
  if (!storedBounds)
    return transformCanvasWorkspace(workspace, layout, settleCoveredItems)
  const location = resolveObjectLocation(
    layout,
    target,
    storedBounds,
    drawing ? (drawing.layer === 'below' ? 'background' : 'canvas') : undefined,
  )
  if (!('bounds' in location))
    return transformCanvasWorkspace(workspace, layout, settleCoveredItems)

  const bounds = location.bounds
  const backgroundDrop = location.surface === 'background'
  return transformCanvasWorkspace(workspace, layout, (canvas, layers) => {
    let proxyId = '__layout-drop__'
    while (canvas.windows.some((item) => item.id === proxyId)) proxyId += '_'
    const result = settleCoveredItems(
      {
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
      },
      {
        ...layers,
        backgroundWindowIds: backgroundDrop
          ? new Set([...(layers.backgroundWindowIds ?? []), proxyId])
          : layers.backgroundWindowIds,
      },
    )
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
    const settled = {
      ...result,
      windows: canvas.windows.map((item) => {
        if (target.kind === 'window' && item.id === target.id) return item
        // Decorations and background work cannot cover ordinary windows.
        if (
          (backgroundDrop ||
            target.kind === 'item' ||
            target.kind === 'drawing') &&
          resolveObjectLocation(layout, { kind: 'window', id: item.id }, item)
            .surface !== 'background'
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
    return target.kind === 'item' || target.kind === 'drawing'
      ? settleBackgroundItems(settled, layers)
      : settled
  })
}
