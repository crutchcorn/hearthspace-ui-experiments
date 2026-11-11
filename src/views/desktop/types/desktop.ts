import type { CanvasDrawing } from './drawing'

export type Bounds = { x: number; y: number; width: number; height: number }
export type CanvasTool =
  'cursor' | 'pan' | 'select' | 'search' | 'draw' | 'layout'
export type WindowSelectionShape = 'rectangle' | 'freeform'
export type DesktopItem = Bounds & {
  id: string
  title: string
  kind: 'folder' | 'file' | 'app'
  appId: string
  peekOrigin?: Pick<Bounds, 'x' | 'y'>
}
export type DesktopWindow = Bounds & {
  id: string
  title: string
  kind: 'notes' | 'empty'
  appId?: string
  dockOrder?: number
  restore?: Bounds
}
export type CanvasControl = Bounds & {
  id: string
  surface: 'canvas' | 'background'
  peekOrigin?: Pick<Bounds, 'x' | 'y'>
}
export type Workspace = {
  width: number
  height: number
  home: { x: number; y: number }
  windows: DesktopWindow[]
  items: DesktopItem[]
  drawings: CanvasDrawing[]
  controls?: CanvasControl[]
  note: string
}
