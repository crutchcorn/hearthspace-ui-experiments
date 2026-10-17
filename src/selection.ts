import type { Bounds } from './desktop'

export type SelectionPoint = { x: number; y: number }

function orientation(
  a: SelectionPoint,
  b: SelectionPoint,
  c: SelectionPoint,
): number {
  const left = (b.x - a.x) * (c.y - a.y)
  const right = (b.y - a.y) * (c.x - a.x)
  const cross = left - right
  const tolerance = Number.EPSILON * 8 * (Math.abs(left) + Math.abs(right))
  return Math.abs(cross) <= tolerance ? 0 : Math.sign(cross)
}

function onSegment(
  point: SelectionPoint,
  a: SelectionPoint,
  b: SelectionPoint,
): boolean {
  return (
    orientation(a, b, point) === 0 &&
    point.x >= Math.min(a.x, b.x) &&
    point.x <= Math.max(a.x, b.x) &&
    point.y >= Math.min(a.y, b.y) &&
    point.y <= Math.max(a.y, b.y)
  )
}

function segmentsIntersect(
  a: SelectionPoint,
  b: SelectionPoint,
  c: SelectionPoint,
  d: SelectionPoint,
): boolean {
  const abc = orientation(a, b, c)
  const abd = orientation(a, b, d)
  const cda = orientation(c, d, a)
  const cdb = orientation(c, d, b)
  return (
    (abc * abd < 0 && cda * cdb < 0) ||
    (abc === 0 && onSegment(c, a, b)) ||
    (abd === 0 && onSegment(d, a, b)) ||
    (cda === 0 && onSegment(a, c, d)) ||
    (cdb === 0 && onSegment(b, c, d))
  )
}

function polygonContainsPoint(
  points: readonly SelectionPoint[],
  point: SelectionPoint,
): boolean {
  let inside = false
  let previous = points[points.length - 1]
  for (const current of points) {
    if (onSegment(point, previous, current)) return true
    if (
      current.y > point.y !== previous.y > point.y &&
      point.x <
        current.x +
          ((point.y - current.y) * (previous.x - current.x)) /
            (previous.y - current.y)
    )
      inside = !inside
    previous = current
  }
  return inside
}

export function polygonIntersectsBounds(
  points: readonly SelectionPoint[],
  bounds: Bounds,
): boolean {
  if (points.length < 3) return false

  // A bow-tie can have zero signed area but still enclose selectable regions.
  // Reject collinear strokes instead of using a signed-area test.
  const first = points[0]
  const different = points.find(
    (point) => point.x !== first.x || point.y !== first.y,
  )
  if (
    !different ||
    !points.some((point) => orientation(first, different, point) !== 0)
  )
    return false

  const right = bounds.x + bounds.width
  const bottom = bounds.y + bounds.height
  if (
    points.some(
      (point) =>
        point.x >= bounds.x &&
        point.x <= right &&
        point.y >= bounds.y &&
        point.y <= bottom,
    )
  )
    return true

  const corners = [
    { x: bounds.x, y: bounds.y },
    { x: right, y: bounds.y },
    { x: right, y: bottom },
    { x: bounds.x, y: bottom },
  ]
  if (corners.some((corner) => polygonContainsPoint(points, corner)))
    return true

  let previous = points[points.length - 1]
  for (const current of points) {
    if (
      corners.some((corner, index) =>
        segmentsIntersect(
          previous,
          current,
          corner,
          corners[(index + 1) % corners.length],
        ),
      )
    )
      return true
    previous = current
  }
  return false
}
