import type { Workspace } from './desktop.ts'
import type { CanvasDrawing } from './drawings.ts'
import {
  getPlacement,
  targetKey,
  type FrameLayout,
  type LayoutTarget,
  type ObjectPlacement,
} from './frame-layout.ts'

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
  const placementFor = (
    target: LayoutTarget,
    drawing?: CanvasDrawing,
  ): ObjectPlacement =>
    layout.placements[targetKey(target)] ??
    (drawing
      ? { surface: drawing.layer === 'below' ? 'background' : 'canvas' }
      : getPlacement(layout, target))
  const onCanvas = (placement: ObjectPlacement) =>
    placement.surface === 'canvas' || placement.surface === 'background'
  const windowLayers = new Map(
    workspace.windows.map((item) => [
      item.id,
      placementFor({ kind: 'window', id: item.id }),
    ]),
  )
  const drawings = workspace.drawings.flatMap((drawing) => {
    const placement = placementFor({ kind: 'drawing', id: drawing.id }, drawing)
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
        placementFor({ kind: 'item', id: item.id }).surface === 'background',
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
