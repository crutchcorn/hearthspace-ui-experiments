import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getCanvasMoveDelta } from '../src/canvas-grid.ts'

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
