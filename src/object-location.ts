import type { Bounds } from './desktop.ts'
import {
  getPlacement,
  getTargetGroup,
  targetKey,
  type FrameEdge,
  type FrameLayout,
  type LayoutTarget,
  type ObjectPlacement,
} from './frame-layout.ts'

export type ObjectLocation =
  | { surface: 'canvas' | 'background'; bounds: Bounds }
  | { surface: 'frame'; edge: FrameEdge; position: number }
  | { surface: 'pinned'; x: number; y: number }
  | { surface: 'hidden' }

const emptyLayout: FrameLayout = { placements: {}, allowHideTools: false }

// Bounds come from the scene's current projection. Frame attachments never
// expose those projected bounds as a canvas location.
export function resolveObjectLocation(
  layout: FrameLayout | undefined,
  target: LayoutTarget,
  savedBounds: Bounds,
  fallbackSurface?: 'canvas' | 'background',
): ObjectLocation {
  const frameLayout = layout ?? emptyLayout
  const placement: ObjectPlacement =
    fallbackSurface &&
    !getTargetGroup(frameLayout, target) &&
    !frameLayout.placements[targetKey(target)]
      ? { surface: fallbackSurface }
      : getPlacement(frameLayout, target)

  if (placement.surface === 'frame')
    return {
      surface: 'frame',
      edge: placement.edge,
      position: placement.position,
    }
  if (placement.surface === 'hidden') return { surface: 'hidden' }
  if (placement.surface === 'pinned') return placement
  return {
    surface: placement.surface,
    bounds: {
      x: placement.x ?? savedBounds.x,
      y: placement.y ?? savedBounds.y,
      width: savedBounds.width,
      height: savedBounds.height,
    },
  }
}
