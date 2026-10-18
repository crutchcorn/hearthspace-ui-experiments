import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getCanvasMoveDelta,
  getCanvasResizeBounds,
} from '../src/canvas-grid.ts'

const world = { width: 1000, height: 800 }
const window = { x: 103, y: 209, width: 280, height: 200 }

test('Alt aligns the window corner to dot centers, not tile boundaries', () => {
  const delta = getCanvasMoveDelta(
    [window],
    window,
    { x: 22, y: 34 },
    world,
    true,
  )
  assert.deepEqual(
    { x: window.x + delta.x, y: window.y + delta.y },
    {
      x: 126,
      y: 238,
    },
  )
})

test('releasing Alt restores the unrestricted pointer-relative position', () => {
  const pointer = { x: 22, y: 34 }
  getCanvasMoveDelta([window], window, pointer, world, true)
  assert.deepEqual(
    getCanvasMoveDelta([window], window, pointer, world, false),
    pointer,
  )
})

test('a group snaps by the grabbed window and retains its relative spacing', () => {
  const other = { x: 460, y: 316, width: 350, height: 200 }
  const delta = getCanvasMoveDelta(
    [window, other],
    other,
    { x: 19, y: 31 },
    world,
    true,
  )
  assert.deepEqual(delta, { x: 30, y: 34 })
  assert.deepEqual(
    [window, other].map((item) => ({
      x: item.x + delta.x,
      y: item.y + delta.y,
    })),
    [
      { x: 133, y: 243 },
      { x: 490, y: 350 },
    ],
  )
})

test('world edges constrain snapping to the nearest dot that fits the group', () => {
  const other = { x: 460, y: 316, width: 350, height: 200 }
  const group = [window, other]
  assert.deepEqual(
    getCanvasMoveDelta(group, other, { x: 5000, y: 5000 }, world, true),
    { x: 170, y: 258 },
  )
  assert.deepEqual(
    getCanvasMoveDelta(group, other, { x: -5000, y: -5000 }, world, true),
    { x: -82, y: -190 },
  )
})

test('an axis without a reachable dot stays bounded while the other still snaps', () => {
  const fullWidth = { x: 0, y: 100, width: 1000, height: 200 }
  assert.deepEqual(
    getCanvasMoveDelta([fullWidth], fullWidth, { x: 80, y: 40 }, world, true),
    { x: 0, y: 54 },
  )
})

const resizableWindow = { x: 103, y: 209, width: 400, height: 300 }

for (const [edge, expected] of [
  ['w', { x: 126, y: 209, width: 377, height: 300 }],
  ['e', { x: 103, y: 209, width: 415, height: 300 }],
  ['n', { x: 103, y: 182, width: 400, height: 327 }],
  ['s', { x: 103, y: 209, width: 400, height: 281 }],
  ['nw', { x: 126, y: 182, width: 377, height: 327 }],
  ['ne', { x: 103, y: 182, width: 415, height: 327 }],
  ['sw', { x: 126, y: 209, width: 377, height: 281 }],
  ['se', { x: 103, y: 209, width: 415, height: 281 }],
] as const) {
  test(`Alt-resizing ${edge} snaps only the moving edges and holds the opposite edges fixed`, () => {
    assert.deepEqual(
      getCanvasResizeBounds(resizableWindow, edge, 23, -17, world, true),
      expected,
    )
  })
}

test('snapped resizing cannot shrink past the minimum window size', () => {
  assert.deepEqual(
    getCanvasResizeBounds(resizableWindow, 'se', -1000, -1000, world, true),
    { x: 103, y: 209, width: 303, height: 225 },
  )
  assert.deepEqual(
    getCanvasResizeBounds(resizableWindow, 'nw', 1000, 1000, world, true),
    { x: 210, y: 294, width: 293, height: 215 },
  )
})

test('snapped resizing stays on dots inside the canvas boundary', () => {
  assert.deepEqual(
    getCanvasResizeBounds(resizableWindow, 'se', 1000, 1000, world, true),
    { x: 103, y: 209, width: 891, height: 589 },
  )
  assert.deepEqual(
    getCanvasResizeBounds(resizableWindow, 'nw', -1000, -1000, world, true),
    { x: 14, y: 14, width: 489, height: 495 },
  )
})

test('size constraints override snapping on an edge with no reachable dot', () => {
  assert.deepEqual(
    getCanvasResizeBounds(
      { x: 220, y: 10, width: 280, height: 250 },
      'se',
      100,
      31,
      { width: 500, height: 400 },
      true,
    ),
    { x: 220, y: 10, width: 280, height: 284 },
  )
})

test('resizing without Alt keeps unrestricted edge positions', () => {
  assert.deepEqual(
    getCanvasResizeBounds(resizableWindow, 'nw', 23.75, -17.5, world, false),
    { x: 126.75, y: 191.5, width: 376.25, height: 317.5 },
  )
})
