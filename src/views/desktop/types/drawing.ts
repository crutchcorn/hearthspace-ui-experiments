import type { Bounds } from './desktop'
import type { GesturePoint } from './gestures'

export type DrawingLayerName = 'below' | 'above'
export type CanvasDrawing = Bounds & {
  id: string
  strokes: GesturePoint[][]
  layer: DrawingLayerName
  peekOrigin?: Pick<Bounds, 'x' | 'y'>
}
