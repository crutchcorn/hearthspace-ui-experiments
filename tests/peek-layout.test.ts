import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DesktopItem, DesktopWindow, Workspace } from '../src/desktop.ts'
import { settleCoveredItems } from '../src/peek-layout.ts'

function window(
  id: string,
  bounds: Partial<DesktopWindow> = {},
): DesktopWindow {
  return {
    id,
    title: id,
    kind: 'empty',
    x: 100,
    y: 100,
    width: 200,
    height: 200,
    ...bounds,
  }
}

function workspace(
  windows: DesktopWindow[],
  items: DesktopItem[] = [],
): Workspace {
  return {
    width: 1000,
    height: 800,
    home: { x: 0, y: 0 },
    windows,
    items,
    drawings: [],
    note: '',
  }
}

test('a covered window peeks out while the dropped front window stays put', () => {
  const before = workspace([window('back'), window('front')])
  const original = structuredClone(before)
  const result = settleCoveredItems(before)
  assert.equal(result.windows[0].x, 100)
  assert.equal(result.windows[0].y, 76)
  assert.equal(result.windows[0].width, 200)
  assert.equal(result.windows[0].height, 200)
  assert.equal(result.windows[1], before.windows[1])
  assert.deepEqual(before, original)
})

test('nested windows move to the closest edge instead of a fixed direction', () => {
  const before = workspace([
    window('back', { x: 260, y: 180, width: 100, height: 100 }),
    window('front', { width: 280, height: 300 }),
  ])
  const result = settleCoveredItems(before)
  assert.equal(result.windows[0].x, 304)
  assert.equal(result.windows[0].y, 180)
})

test('combined coverage from adjacent windows reveals the covered window', () => {
  const before = workspace([
    window('back'),
    window('left', { width: 100 }),
    window('right', { x: 200, width: 100 }),
  ])
  const result = settleCoveredItems(before)
  assert.equal(result.windows[0].y, 76)
  assert.equal(result.windows[1], before.windows[1])
  assert.equal(result.windows[2], before.windows[2])
})

test('a window with even a small visible portion does not move', () => {
  const before = workspace([window('back'), window('front', { y: 101 })])
  assert.equal(settleCoveredItems(before), before)
})

test('a gap between covering windows counts as exposure', () => {
  const before = workspace([
    window('back'),
    window('left', { width: 99 }),
    window('right', { x: 200, width: 100 }),
  ])
  assert.equal(settleCoveredItems(before), before)
})

test('stacked duplicates all become visible without reordering and settle once', () => {
  const before = workspace([
    window('one'),
    window('two'),
    window('three'),
    window('four'),
    window('five'),
  ])
  const result = settleCoveredItems(before)
  assert.deepEqual(
    result.windows.map((item) => item.id),
    ['one', 'two', 'three', 'four', 'five'],
  )
  assert.equal(
    new Set(result.windows.map((item) => `${item.x},${item.y}`)).size,
    5,
  )
  assert.equal(settleCoveredItems(result), result)
})

test('windows at the canvas corner peek in an available direction', () => {
  const before = workspace([
    window('back', { x: 0, y: 0 }),
    window('front', { x: 0, y: 0 }),
  ])
  const result = settleCoveredItems(before)
  assert.equal(result.windows[0].x, 24)
  assert.equal(result.windows[0].y, 0)
})

test('a nearby free corner can be closer than moving past an entire edge', () => {
  const before = workspace([
    window('back', { x: 100, y: 100, width: 100, height: 100 }),
    window('horizontal', { x: 0, y: 100, width: 1000, height: 100 }),
    window('vertical', { x: 100, y: 0, width: 100, height: 800 }),
  ])
  const result = settleCoveredItems(before)
  assert.equal(result.windows[0].x, 76)
  assert.equal(result.windows[0].y, 76)
  assert.equal(settleCoveredItems(result), result)
})

test('a window covering the entire canvas leaves impossible placements alone', () => {
  const before = workspace([
    window('back'),
    window('front', { x: 0, y: 0, width: 1000, height: 800 }),
  ])
  assert.equal(settleCoveredItems(before), before)
})

test('desktop icons expose their icon body while staying beneath every window', () => {
  const icon: DesktopItem = {
    id: 'icon',
    title: 'Notes',
    kind: 'app',
    appId: 'notes',
    x: 100,
    y: 100,
    width: 88,
    height: 96,
  }
  const before = workspace([window('front', { width: 88, height: 96 })], [icon])
  const result = settleCoveredItems(before)
  assert.equal(result.windows[0], before.windows[0])
  assert.equal(result.items[0].x, 100)
  assert.equal(result.items[0].y, 58)
  assert.equal(result.items[0].kind, 'app')
  assert.equal(settleCoveredItems(result), result)
})

test('desktop items can peek out from other desktop items', () => {
  const icon: DesktopItem = {
    id: 'one',
    title: 'Notes',
    kind: 'app',
    appId: 'notes',
    x: 100,
    y: 100,
    width: 88,
    height: 96,
  }
  const before = workspace([], [icon, { ...icon, id: 'two' }])
  const result = settleCoveredItems(before)
  assert.equal(result.items[0].y, 68)
  assert.equal(result.items[1], before.items[1])
})

test('revealing a maximized window shifts its restore position by the same amount', () => {
  const before = workspace([
    window('back', { restore: { x: 110, y: 120, width: 150, height: 140 } }),
    window('front'),
  ])
  const result = settleCoveredItems(before)
  assert.deepEqual(result.windows[0].restore, {
    x: 110,
    y: 96,
    width: 150,
    height: 140,
  })
})

test('restore bounds remain on the canvas when a reveal reaches an edge', () => {
  const before = workspace([
    window('back', { restore: { x: 0, y: 0, width: 150, height: 140 } }),
    window('front'),
  ])
  const result = settleCoveredItems(before)
  assert.deepEqual(result.windows[0].restore, {
    x: 0,
    y: 0,
    width: 150,
    height: 140,
  })
})
