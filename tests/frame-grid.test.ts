import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Bounds } from '../src/desktop.ts'
import {
  getFrameBounds,
  type FrameEdge,
  type ObjectPlacement,
} from '../src/frame-layout.ts'
import { snapFramePlacement } from '../src/frame-grid.ts'

type FramePlacement = Extract<ObjectPlacement, { surface: 'frame' }>
const view: Bounds = { x: 101, y: 213, width: 1000, height: 800 }
const icon = { width: 54, height: 54 }
const near = (actual: number, expected: number) =>
  assert.ok(Math.abs(actual - expected) < 0.000001, `${actual} != ${expected}`)

for (const edge of ['top', 'right', 'bottom', 'left'] as const) {
  test(`Alt aligns a ${edge} attachment with the scrolled canvas dots without changing its edge inset`, () => {
    const placement: FramePlacement = { surface: 'frame', edge, position: 0.43 }
    const before = getFrameBounds(
      placement,
      icon.width,
      icon.height,
      view,
      'padded',
    )
    const next = snapFramePlacement(placement, icon, view, true)
    const after = getFrameBounds(next, icon.width, icon.height, view, 'padded')
    const horizontal = edge === 'top' || edge === 'bottom'
    near(
      horizontal ? after.x + view.x : after.y + view.y,
      horizontal ? 518 : 546,
    )
    assert.equal(
      horizontal ? after.y : after.x,
      horizontal ? before.y : before.x,
    )
    assert.equal(next.edge, edge)
    assert.equal(after.width, icon.width)
    assert.equal(after.height, icon.height)
  })
}

test('fractional scrolling changes the frame offset while retaining exact world dot alignment', () => {
  const placement: FramePlacement = {
    surface: 'frame',
    edge: 'top',
    position: 0.43,
  }
  const scrolled = { ...view, x: 113.25, y: 227.5 }
  const next = snapFramePlacement(placement, icon, scrolled, true)
  const bounds = getFrameBounds(
    next,
    icon.width,
    icon.height,
    scrolled,
    'padded',
  )
  near(bounds.x, 404.75)
  near(bounds.x + scrolled.x, 518)
  assert.equal(bounds.y, 24)
})

test('windows stay flush and shortcuts retain padding when snapping along the same edge', () => {
  const placement: FramePlacement = {
    surface: 'frame',
    edge: 'right',
    position: 0.43,
  }
  const window = { width: 400, height: 300 }
  const windowPlacement = snapFramePlacement(
    placement,
    window,
    view,
    true,
    'flush',
  )
  const iconPlacement = snapFramePlacement(placement, icon, view, true)
  const windowBounds = getFrameBounds(
    windowPlacement,
    window.width,
    window.height,
    view,
    'flush',
  )
  const iconBounds = getFrameBounds(
    iconPlacement,
    icon.width,
    icon.height,
    view,
    'padded',
  )
  assert.equal(windowBounds.x + windowBounds.width, view.width)
  assert.equal(iconBounds.x + iconBounds.width, view.width - 24)
  near(windowBounds.y + view.y, 434)
  near(iconBounds.y + view.y, 546)
})

test('all corner attachments retain their original position and orientation while Alt is held', () => {
  for (const edge of ['top', 'right', 'bottom', 'left'] satisfies FrameEdge[]) {
    for (const position of [0, 1]) {
      const corner: FramePlacement = { surface: 'frame', edge, position }
      assert.equal(
        snapFramePlacement(corner, { width: 54, height: 307 }, view, true),
        corner,
      )
    }
  }
})

test('releasing Alt preserves the unrestricted frame position', () => {
  const placement: FramePlacement = {
    surface: 'frame',
    edge: 'bottom',
    position: 0.4317,
  }
  snapFramePlacement(placement, icon, view, true)
  assert.equal(snapFramePlacement(placement, icon, view, false), placement)
})

test('a narrow legal span without a dot leaves the frame placement unchanged', () => {
  const placement: FramePlacement = {
    surface: 'frame',
    edge: 'top',
    position: 0.5,
  }
  const narrow = { x: 10, y: 0, width: 80, height: 160 }
  assert.equal(snapFramePlacement(placement, icon, narrow, true), placement)
})

test('oversized attachments fit the viewport and have no tangent travel to snap', () => {
  const placement: FramePlacement = {
    surface: 'frame',
    edge: 'top',
    position: 0.4,
  }
  const size = { width: 600, height: 200 }
  const small = { x: 23.5, y: 71.25, width: 390, height: 180 }
  assert.equal(snapFramePlacement(placement, size, small, true), placement)
  assert.deepEqual(
    getFrameBounds(placement, size.width, size.height, small, 'padded'),
    { x: 12, y: 12, width: 366, height: 156 },
  )
})

test('a tiny viewport with overlapping edge margins keeps finite fitted geometry', () => {
  const placement: FramePlacement = {
    surface: 'frame',
    edge: 'left',
    position: 0.6,
  }
  const small = { x: 0.25, y: 3.75, width: 10, height: 14 }
  assert.equal(snapFramePlacement(placement, icon, small, true), placement)
  assert.deepEqual(
    getFrameBounds(placement, icon.width, icon.height, small, 'padded'),
    { x: 5, y: 7, width: 0, height: 0 },
  )
})

test('snapping chooses the nearest legal dot instead of overflowing an edge margin', () => {
  const placement: FramePlacement = {
    surface: 'frame',
    edge: 'top',
    position: 0.999,
  }
  const small = { x: 0, y: 0, width: 390, height: 500 }
  const next = snapFramePlacement(placement, icon, small, true)
  const bounds = getFrameBounds(next, icon.width, icon.height, small, 'padded')
  near(bounds.x, 322)
  assert.ok(bounds.x + bounds.width <= small.width - 12)
  assert.ok(next.position > 0 && next.position < 1)
})
