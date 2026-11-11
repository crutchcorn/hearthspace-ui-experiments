import type { Bounds } from './desktop'
import type { DrawingLayerName } from './drawing'
import type { GesturePoint } from './gestures'

export type CanvasSelection = Bounds & {
  target: 'windows' | 'items'
  points?: GesturePoint[]
}

export interface DrawingDraft {
  points: GesturePoint[]
  layer: DrawingLayerName
  pinned?: boolean
}
