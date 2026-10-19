import type {
  Bounds,
  CanvasControl,
  DesktopItem,
  DesktopWindow,
  WindowSelectionShape,
  Workspace,
} from './desktop'
import type { DrawingLayerName } from './drawings'
import type { SelectionPoint } from './selection'

export type PointerSessionDetails =
  | { type: 'pan' }
  | {
      type: 'move'
      id: string
      bounds: DesktopWindow
      windows: DesktopWindow[]
    }
  | { type: 'resize'; id: string; bounds: DesktopWindow; edge: string }
  | {
      type: 'window-select'
      selectionShape: WindowSelectionShape
      points: SelectionPoint[]
    }
  | {
      type: 'item-select'
      selectedItemIds: string[]
      selectedControlIds: string[]
    }
  | {
      type: 'item-move'
      id?: string
      controlId?: string
      bounds: Bounds
      items: DesktopItem[]
      controls: CanvasControl[]
    }
  | {
      type: 'draw'
      id?: string
      points: SelectionPoint[]
      drawingLayer: DrawingLayerName
    }
  | { type: 'drawing-move'; id: string; bounds: Bounds }

export type PointerSession = PointerSessionDetails & {
  pointerId: number
  startX: number
  startY: number
  scrollX: number
  scrollY: number
  moved: boolean
}

export function restoreDesktopDrag(
  workspace: Workspace,
  session: Extract<PointerSession, { type: 'item-move' }>,
): Workspace {
  const items = new Map(session.items.map((item) => [item.id, item]))
  const controls = new Map(
    session.controls.map((control) => [control.id, control]),
  )
  return {
    ...workspace,
    items: workspace.items.map((item) => items.get(item.id) ?? item),
    controls: workspace.controls?.map(
      (control) => controls.get(control.id) ?? control,
    ),
  }
}
