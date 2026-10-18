import assert from 'node:assert/strict'
import { test } from 'node:test'
import { recognizeGesture } from '../src/gesture-recognition.ts'
import type { GesturePoint, GestureShortcut } from '../src/gestures.ts'

const B: GesturePoint[] = [
  [178, 150],
  [178, 40],
  [215, 40],
  [240, 48],
  [246, 64],
  [238, 82],
  [211, 94],
  [178, 94],
  [218, 94],
  [246, 104],
  [254, 122],
  [245, 140],
  [218, 150],
  [178, 150],
].map(([x, y]) => ({ x, y }))
const Z: GesturePoint[] = [
  [172, 58],
  [254, 58],
  [180, 130],
  [263, 130],
].map(([x, y]) => ({ x, y }))
const N: GesturePoint[] = [
  [179, 143],
  [179, 46],
  [256, 143],
  [256, 46],
].map(([x, y]) => ({ x, y }))
const shortcuts: GestureShortcut[] = [
  { appId: 'browser', points: B },
  { appId: 'terminal', points: Z },
  { appId: 'notes', points: N },
]

function transformed(points: GesturePoint[], scale = 1, dx = 0, dy = 0) {
  return points.map(({ x, y }) => ({ x: x * scale + dx, y: y * scale + dy }))
}

function noisy(points: GesturePoint[]) {
  return points.flatMap((point, index) => {
    const next = points[index + 1]
    if (!next) return [point]
    return Array.from({ length: 8 }, (_, step) => ({
      x:
        point.x +
        ((next.x - point.x) * step) / 8 +
        Math.sin(index * 8 + step) * 2,
      y:
        point.y +
        ((next.y - point.y) * step) / 8 +
        Math.cos(index * 8 + step) * 2,
    }))
  })
}

test('launches each default app from a sparse translated and scaled glyph', () => {
  for (const shortcut of shortcuts) {
    const result = recognizeGesture(
      [transformed(shortcut.points, 1.8, -180, 90)],
      shortcuts,
    )
    assert.equal(result?.appId, shortcut.appId)
    assert.ok(result && result.score >= 0.8 && result.score <= 1)
  }
})

test('accepts modest freehand noise without confusing N and Z', () => {
  for (const shortcut of shortcuts)
    assert.equal(
      recognizeGesture([noisy(shortcut.points)], shortcuts)?.appId,
      shortcut.appId,
    )
})

test('accepts a B drawn as separate stem and bowls in reverse stroke order', () => {
  const strokes = [B.slice(0, 2), B.slice(1, 8), B.slice(7)]
    .reverse()
    .map((stroke) => transformed(stroke.toReversed(), 0.65, 300, -10))
  assert.equal(recognizeGesture(strokes, shortcuts)?.appId, 'browser')
})

test('accepts separately drawn N and Z segments regardless of direction or order', () => {
  for (const shortcut of shortcuts.slice(1)) {
    const points = shortcut.points
    const strokes = [
      [points[3], points[2]],
      [points[1], points[0]],
      [points[2], points[1]],
    ]
    assert.equal(recognizeGesture(strokes, shortcuts)?.appId, shortcut.appId)
  }
})

test('preserves orientation so rotating N cannot launch Notes', () => {
  const rotated = N.map(({ x, y }) => ({ x: -y, y: x }))
  assert.notEqual(recognizeGesture([rotated], shortcuts)?.appId, 'notes')
})

test('leaves an unrecognized circle unassigned', () => {
  const circle = Array.from({ length: 65 }, (_, index) => ({
    x: 200 + 65 * Math.cos((index * Math.PI * 2) / 64),
    y: 100 + 65 * Math.sin((index * Math.PI * 2) / 64),
  }))
  assert.equal(recognizeGesture([circle], shortcuts), null)
})

test('does not launch from empty input, taps, tiny marks, or invalid coordinates', () => {
  for (const strokes of [
    [],
    [[]],
    [[{ x: 20, y: 20 }]],
    [Array(40).fill({ x: 5, y: 5 })],
    [transformed(B, 0.03)],
    [
      [
        { x: 0, y: 0 },
        { x: NaN, y: 40 },
      ],
    ],
  ])
    assert.equal(recognizeGesture(strokes, shortcuts), null)
})

test('does not connect separated taps into a launchable glyph', () => {
  assert.equal(
    recognizeGesture(
      N.map((point) => [point]),
      shortcuts,
    ),
    null,
  )
})

test('does not invent the diagonal of N between two separate vertical strokes', () => {
  assert.equal(
    recognizeGesture(
      [
        [N[0], N[1]],
        [N[2], N[3]],
      ],
      shortcuts,
    ),
    null,
  )
})

test('rejects the same shape assigned to different apps instead of guessing', () => {
  assert.equal(
    recognizeGesture(
      [N],
      [
        { appId: 'notes', points: N },
        { appId: 'browser', points: transformed(N, 2, 30, -80) },
      ],
    ),
    null,
  )
})

test('leaves input strokes and saved templates untouched', () => {
  const strokes = [noisy(B)]
  const originals = structuredClone({ strokes, shortcuts })
  recognizeGesture(strokes, shortcuts)
  assert.deepEqual({ strokes, shortcuts }, originals)
})
