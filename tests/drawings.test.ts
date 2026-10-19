import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  addDrawingStroke,
  readDrawingStrokes,
  type CanvasDrawing,
} from '../src/drawings.ts'

const world = { width: 1000, height: 800 }
const drawing: CanvasDrawing = {
  id: 'note',
  layer: 'below',
  x: 100,
  y: 200,
  width: 100,
  height: 80,
  strokes: [
    [
      { x: 4, y: 4 },
      { x: 96, y: 76 },
    ],
  ],
}

function worldStrokes(item: CanvasDrawing) {
  return item.strokes.map((stroke) =>
    stroke.map((point) => ({ x: item.x + point.x, y: item.y + point.y })),
  )
}

test('drawing a new stroke makes a peeked position the intentional placement', () => {
  const peeking = { ...drawing, peekOrigin: { x: 300, y: 400 } }
  const stroke = [{ x: 250, y: 300 }]
  const edited = addDrawingStroke(peeking, stroke, 'below', world)
  assert.equal(edited.peekOrigin, undefined)
  assert.deepEqual(worldStrokes(edited), [...worldStrokes(peeking), stroke])
})

test('normalizes new strokes while retaining an existing drawing moved on the canvas', () => {
  const moved = { ...drawing, x: 340, y: 120 }
  const input = [
    { x: 320, y: 105 },
    { x: 460, y: 220 },
  ]
  const original = structuredClone({ moved, input })
  const result = addDrawingStroke(moved, input, 'above', world)
  assert.equal(result.id, drawing.id)
  assert.equal(result.layer, 'above')
  assert.deepEqual(worldStrokes(result), [...worldStrokes(moved), input])
  assert.equal(result.x, 316)
  assert.equal(result.y, 101)
  assert.deepEqual({ moved, input }, original)
  assert.deepEqual(readDrawingStrokes(result.strokes, result), result.strokes)
})

test('clips strokes and padded bounds at world edges without joining separate strokes', () => {
  const first = addDrawingStroke(
    null,
    [
      { x: -20, y: -10 },
      { x: 30, y: 40 },
    ],
    'below',
    world,
  )
  const result = addDrawingStroke(first, [{ x: 1010, y: 810 }], 'below', world)
  assert.equal(result.x, 0)
  assert.equal(result.y, 0)
  assert.equal(result.width, world.width)
  assert.equal(result.height, world.height)
  assert.deepEqual(worldStrokes(result), [
    [
      { x: 0, y: 0 },
      { x: 30, y: 40 },
    ],
    [{ x: 1000, y: 800 }],
  ])
  assert.deepEqual(readDrawingStrokes(result.strokes, result), result.strokes)
})

test('retains a tap as a one-point drawing with visible padded bounds', () => {
  const result = addDrawingStroke(null, [{ x: 25, y: 35 }], 'above', world)
  assert.ok(result.id)
  assert.deepEqual(worldStrokes(result), [[{ x: 25, y: 35 }]])
  assert.equal(result.width, 8)
  assert.equal(result.height, 8)
  assert.deepEqual(readDrawingStrokes(result.strokes, result), result.strokes)
})

test('limits dense input while preserving its endpoints', () => {
  const points = Array.from({ length: 5000 }, (_, index) => ({
    x: index / 10,
    y: 50,
  }))
  const result = addDrawingStroke(null, points, 'below', world)
  const [stroke] = worldStrokes(result)
  assert.equal(stroke.length, 4096)
  assert.deepEqual(stroke[0], points[0])
  assert.deepEqual(stroke.at(-1), points.at(-1))
  assert.deepEqual(readDrawingStrokes(result.strokes, result), result.strokes)
})
