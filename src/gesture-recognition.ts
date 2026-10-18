// Adapted from the $P Point-Cloud Recognizer by Radu-Daniel Vatavu,
// Lisa Anthony, and Jacob O. Wobbrock. BSD license: ../licenses/pdollar.txt.
// Reference: https://depts.washington.edu/acelab/proj/dollar/pdollar.js
import type { GesturePoint, GestureShortcut } from './gestures'

const sampleCount = 64
// A nearest template alone isn't enough: weak or competing matches don't launch.
const maximumDistance = 0.075
const ambiguityMargin = 0.02

type Segment = {
  from: GesturePoint
  to: GesturePoint
  start: number
  end: number
}

function pointCloud(strokes: GesturePoint[][]): GesturePoint[] | null {
  const segments: Segment[] = []
  let length = 0
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  for (const stroke of strokes) {
    for (let index = 0; index < stroke.length; index++) {
      const point = stroke[index]
      if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return null
      const previous = stroke[index - 1]
      if (!previous) continue
      const distance = Math.hypot(point.x - previous.x, point.y - previous.y)
      if (!Number.isFinite(distance)) return null
      if (distance === 0) continue
      const end = length + distance
      if (end === length) continue
      segments.push({ from: previous, to: point, start: length, end })
      length = end
      minX = Math.min(minX, previous.x, point.x)
      minY = Math.min(minY, previous.y, point.y)
      maxX = Math.max(maxX, previous.x, point.x)
      maxY = Math.max(maxY, previous.y, point.y)
    }
  }

  const size = Math.max(maxX - minX, maxY - minY)
  if (!Number.isFinite(length) || length < 24 || size < 16) return null

  // Fixed sample targets avoid inserting into the input or joining pen-up gaps.
  const points: GesturePoint[] = []
  let segmentIndex = 0
  for (let index = 0; index < sampleCount; index++) {
    const target = (index * length) / (sampleCount - 1)
    while (
      segmentIndex < segments.length - 1 &&
      target > segments[segmentIndex].end
    )
      segmentIndex++
    const segment = segments[segmentIndex]
    const fraction = Math.min(
      1,
      (target - segment.start) / (segment.end - segment.start),
    )
    points.push({
      x:
        (segment.from.x - minX + (segment.to.x - segment.from.x) * fraction) /
        size,
      y:
        (segment.from.y - minY + (segment.to.y - segment.from.y) * fraction) /
        size,
    })
  }
  const center = points.reduce(
    (sum, point) => ({
      x: sum.x + point.x / sampleCount,
      y: sum.y + point.y / sampleCount,
    }),
    { x: 0, y: 0 },
  )
  return points.map((point) => ({
    x: point.x - center.x,
    y: point.y - center.y,
  }))
}

function cloudDistance(a: GesturePoint[], b: GesturePoint[], start: number) {
  const matched = new Uint8Array(sampleCount)
  let sum = 0
  for (let offset = 0; offset < sampleCount; offset++) {
    const point = a[(start + offset) % sampleCount]
    let nearest = -1
    let distance = Infinity
    for (let index = 0; index < sampleCount; index++) {
      if (matched[index]) continue
      const candidate = Math.hypot(point.x - b[index].x, point.y - b[index].y)
      if (candidate < distance) {
        nearest = index
        distance = candidate
      }
    }
    matched[nearest] = 1
    sum += (1 - offset / sampleCount) * distance
  }
  return sum / ((sampleCount + 1) / 2)
}

function matchClouds(a: GesturePoint[], b: GesturePoint[]) {
  let distance = Infinity
  const step = Math.floor(Math.sqrt(sampleCount))
  for (let start = 0; start < sampleCount; start += step)
    distance = Math.min(
      distance,
      cloudDistance(a, b, start),
      cloudDistance(b, a, start),
    )
  return distance
}

function coversCloud(a: GesturePoint[], b: GesturePoint[]) {
  let uncovered = 0
  for (const point of a) {
    let nearest = Infinity
    for (const other of b)
      nearest = Math.min(
        nearest,
        Math.hypot(point.x - other.x, point.y - other.y),
      )
    if (nearest > 0.16) uncovered++
  }
  // Weighted matching can favor a partial glyph; most of both shapes must exist.
  return uncovered <= sampleCount * 0.1
}

export function recognizeGesture(
  strokes: GesturePoint[][],
  shortcuts: GestureShortcut[],
): { appId: string; score: number } | null {
  const candidate = pointCloud(strokes)
  if (!candidate) return null
  const distances = new Map<string, number>()
  for (const shortcut of shortcuts) {
    const template = pointCloud([shortcut.points])
    if (!template) continue
    if (!coversCloud(candidate, template) || !coversCloud(template, candidate))
      continue
    const distance = matchClouds(candidate, template)
    distances.set(
      shortcut.appId,
      Math.min(distances.get(shortcut.appId) ?? Infinity, distance),
    )
  }
  const ranked = [...distances].sort((a, b) => a[1] - b[1])
  const best = ranked[0]
  if (!best || best[1] > maximumDistance) return null
  if (ranked[1] && ranked[1][1] - best[1] < ambiguityMargin) return null
  return { appId: best[0], score: Math.max(0, 1 - best[1] * 2) }
}
