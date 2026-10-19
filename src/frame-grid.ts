import { snapCanvasCoordinate } from './canvas-grid.ts'
import type { Bounds } from './desktop.ts'
import { getFrameBounds, type ObjectPlacement } from './frame-layout.ts'

type FramePlacement = Extract<ObjectPlacement, { surface: 'frame' }>

/** Align along the frame with the visible canvas dots, retaining the edge inset. */
export function snapFramePlacement(
  placement: FramePlacement,
  size: { width: number; height: number },
  view: Bounds,
  snap: boolean,
  edgeSpacing: 'flush' | 'padded' = 'padded',
): FramePlacement {
  if (!snap || placement.position === 0 || placement.position === 1)
    return placement
  const axis =
    placement.edge === 'top' || placement.edge === 'bottom' ? 'x' : 'y'
  const bounds = getFrameBounds(
    placement,
    size.width,
    size.height,
    view,
    edgeSpacing,
  )
  const first = getFrameBounds(
    { ...placement, position: 0 },
    size.width,
    size.height,
    view,
    edgeSpacing,
  )[axis]
  const last = getFrameBounds(
    { ...placement, position: 1 },
    size.width,
    size.height,
    view,
    edgeSpacing,
  )[axis]
  const span = last - first
  if (span <= 0) return placement
  const coordinate =
    snapCanvasCoordinate(
      bounds[axis] + view[axis],
      first + view[axis],
      last + view[axis],
    ) - view[axis]
  if (Math.abs(coordinate - bounds[axis]) < 0.000001) return placement
  return { ...placement, position: (coordinate - first) / span }
}
