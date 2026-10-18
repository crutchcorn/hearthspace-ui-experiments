import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { DesktopItem, DesktopWindow, Workspace } from '../src/desktop.ts'
import type { CanvasDrawing } from '../src/drawings.ts'
import {
  restoreBackgroundItems,
  settleBackgroundItems,
  settleCoveredItems,
} from '../src/peek-layout.ts'

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
  drawings: CanvasDrawing[] = [],
): Workspace {
  return {
    width: 1000,
    height: 800,
    home: { x: 0, y: 0 },
    windows,
    items,
    drawings,
    note: '',
  }
}

function icon(id = 'icon', bounds: Partial<DesktopItem> = {}): DesktopItem {
  return {
    id,
    title: 'Notes',
    kind: 'app',
    appId: 'notes',
    x: 100,
    y: 100,
    width: 88,
    height: 96,
    ...bounds,
  }
}

function drawing(overrides: Partial<CanvasDrawing> = {}): CanvasDrawing {
  return {
    id: 'drawing',
    x: 100,
    y: 100,
    width: 100,
    height: 100,
    layer: 'below',
    strokes: [
      [
        { x: 4, y: 4 },
        { x: 96, y: 96 },
      ],
    ],
    ...overrides,
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

test('desktop icons remember their home and return when its window moves away', () => {
  const before = workspace([window('front')], [icon()])
  const peeked = settleCoveredItems(before)
  assert.deepEqual(peeked.items[0].peekOrigin, { x: 100, y: 100 })
  const moved = {
    ...peeked,
    windows: [window('front', { x: 500 })],
  }
  const result = settleCoveredItems(moved)
  assert.deepEqual(result.items[0], before.items[0])
  assert.equal(settleCoveredItems(result), result)
})

test('any overlap with the original icon bounds keeps it displaced', () => {
  const peeked = settleCoveredItems(workspace([window('front')], [icon()]))
  const partial = {
    ...peeked,
    // Only the original label/padding is overlapped; the glyph would be clear.
    windows: [window('front', { y: 195 })],
  }
  assert.equal(restoreBackgroundItems(partial), partial)
  assert.equal(settleCoveredItems(partial), partial)
})

test('further peeks retain the first home rather than the latest displaced spot', () => {
  const before = workspace([window('front')], [icon()])
  const first = settleCoveredItems(before)
  const second = settleCoveredItems({
    ...first,
    windows: [window('front', { y: 0 })],
  })
  assert.notDeepEqual(
    { x: second.items[0].x, y: second.items[0].y },
    { x: first.items[0].x, y: first.items[0].y },
  )
  assert.deepEqual(second.items[0].peekOrigin, { x: 100, y: 100 })
  const restored = restoreBackgroundItems({ ...second, windows: [] })
  assert.deepEqual(restored.items[0], before.items[0])
})

test('repeatedly displaced icons return beside nearby glyphs once windows leave', () => {
  const originals = [icon('one'), icon('two', { y: 184 })]
  const firstWindow = window('first', { width: 88, height: 96 })
  const first = settleCoveredItems(workspace([firstWindow], originals))
  assert.equal(first.items[0].y, 58)
  assert.deepEqual(first.items[0].peekOrigin, { x: 100, y: 100 })
  const second = settleCoveredItems({
    ...first,
    windows: [
      firstWindow,
      window('second', { y: first.items[0].y, width: 88, height: 96 }),
    ],
  })
  assert.equal(second.items[0].y, 16)
  assert.deepEqual(second.items[0].peekOrigin, { x: 100, y: 100 })
  // The home label/padding overlaps the adjacent icon by two pixels,
  // but their glyphs remain separate, just as they were before either peek.
  const restored = settleCoveredItems({ ...second, windows: [] })
  assert.deepEqual(restored.items, originals)
  assert.equal(settleCoveredItems(restored), restored)
})

test('an icon does not restore over another icon, even a lower peer', () => {
  const before = workspace(
    [],
    [icon('lower'), icon('upper', { x: 400, peekOrigin: { x: 100, y: 100 } })],
  )
  assert.equal(restoreBackgroundItems(before), before)
  assert.equal(settleCoveredItems(before), before)
})

test('returning icons clear chained homes in the same settlement', () => {
  const before = workspace(
    [],
    [
      icon('one', { peekOrigin: { x: 300, y: 100 } }),
      icon('two', { y: 58, peekOrigin: { x: 100, y: 100 } }),
    ],
  )
  const result = restoreBackgroundItems(before)
  assert.equal(result.items[0].x, 300)
  assert.equal(result.items[1].y, 100)
  assert.equal(result.items[0].peekOrigin, undefined)
  assert.equal(result.items[1].peekOrigin, undefined)
  assert.equal(settleCoveredItems(result), result)
})

test('folders return together when their displaced positions block each other’s homes', () => {
  const originals = [
    icon('projects', { kind: 'folder', appId: 'files' }),
    icon('pictures', { kind: 'folder', appId: 'files', y: 204 }),
  ]
  const before = workspace(
    [],
    [
      { ...originals[0], y: 236, peekOrigin: { x: 100, y: 100 } },
      { ...originals[1], y: 172, peekOrigin: { x: 100, y: 204 } },
    ],
  )
  const result = restoreBackgroundItems(before)
  assert.deepEqual(result.items, originals)
  assert.equal(settleCoveredItems(result), result)
})

test('the starter desktop grid returns after a covering window is removed', () => {
  const items = Array.from({ length: 11 }, (_, index) =>
    icon(`item-${index}`, {
      kind: index < 2 ? 'folder' : index === 2 ? 'file' : 'app',
      x: 28 + 104 * Math.floor(index / 4),
      y: 112 + 104 * (index % 4),
    }),
  )
  const before = workspace(
    [window('cover', { x: 75, y: 36, width: 538, height: 476 })],
    items,
  )
  const peeked = settleCoveredItems(before)
  assert.ok(peeked.items.some((item) => item.peekOrigin))
  const result = restoreBackgroundItems({ ...peeked, windows: [] })
  assert.deepEqual(result.items, items)
  assert.equal(settleCoveredItems(result), result)
})

test('a stationary icon prevents a blocked restoration cycle from returning', () => {
  const before = workspace(
    [],
    [
      icon('projects', {
        kind: 'folder',
        y: 236,
        peekOrigin: { x: 100, y: 100 },
      }),
      icon('pictures', {
        kind: 'folder',
        y: 172,
        peekOrigin: { x: 100, y: 204 },
      }),
      icon('stationary'),
    ],
  )
  assert.equal(restoreBackgroundItems(before), before)
})

test('folders with overlapping original homes remain displaced', () => {
  const before = workspace(
    [],
    [
      icon('projects', {
        kind: 'folder',
        x: 300,
        peekOrigin: { x: 100, y: 100 },
      }),
      icon('pictures', {
        kind: 'folder',
        x: 500,
        peekOrigin: { x: 100, y: 100 },
      }),
    ],
  )
  const result = restoreBackgroundItems(before)
  assert.ok(result.items.some((item) => item.peekOrigin))
  assert.equal(settleCoveredItems(result), result)
})

test('icons hidden by peers remain settled rather than repeatedly returning and peeking', () => {
  const peeked = settleCoveredItems(workspace([], [icon('one'), icon('two')]))
  assert.deepEqual(peeked.items[0].peekOrigin, { x: 100, y: 100 })
  assert.equal(restoreBackgroundItems(peeked), peeked)
  assert.equal(settleCoveredItems(peeked), peeked)
  const result = restoreBackgroundItems({
    ...peeked,
    items: [peeked.items[0], { ...peeked.items[1], x: 300 }],
  })
  assert.equal(result.items[0].y, 100)
  assert.equal(result.items[0].peekOrigin, undefined)
})

test('background restoration does not add peeks or undo permanent window movement', () => {
  const before = workspace([window('back'), window('front')], [icon()])
  assert.equal(restoreBackgroundItems(before), before)
  const peeked = settleCoveredItems(before)
  const result = restoreBackgroundItems({
    ...peeked,
    windows: [peeked.windows[0]],
  })
  assert.equal(result.windows[0], peeked.windows[0])
  assert.equal(result.windows[0].y, 76)
})

test('background-only settlement leaves overlapping windows untouched', () => {
  const before = workspace([window('back'), window('front')], [icon()])
  const result = settleBackgroundItems(before)
  assert.equal(result.windows, before.windows)
  assert.deepEqual(result.items[0].peekOrigin, { x: 100, y: 100 })
})

test('below drawings expose ink and return home when the blocker is removed', () => {
  const before = workspace([window('front')], [], [drawing()])
  const peeked = settleCoveredItems(before)
  assert.deepEqual(peeked.drawings[0].peekOrigin, { x: 100, y: 100 })
  assert.ok(peeked.drawings[0].y + 4 < 100 - 16)
  assert.equal(settleCoveredItems(peeked), peeked)
  assert.equal(peeked.drawings[0].strokes, before.drawings[0].strokes)
  const restored = restoreBackgroundItems({ ...peeked, windows: [] })
  assert.deepEqual(restored.drawings[0], before.drawings[0])
})

test('drawings remain displaced until their entire original bounds are clear', () => {
  const peeked = settleCoveredItems(
    workspace([window('front')], [], [drawing()]),
  )
  const partial = { ...peeked, windows: [window('front', { y: 199 })] }
  assert.equal(restoreBackgroundItems(partial), partial)
})

test('an empty exposed drawing corner does not hide the fact that all ink is covered', () => {
  const before = workspace(
    [window('front', { x: 190, y: 190, width: 20, height: 20 })],
    [],
    [drawing({ width: 200, height: 200, strokes: [[{ x: 100, y: 100 }]] })],
  )
  const result = settleCoveredItems(before)
  assert.notEqual(result.drawings[0], before.drawings[0])
  const point = result.drawings[0].strokes[0][0]
  assert.ok(result.drawings[0].y + point.y < 190 - 16)
})

test('a visible stroke segment between covered endpoints prevents a drawing peek', () => {
  const before = workspace(
    [
      window('left', { width: 20, height: 100 }),
      window('right', { x: 180, width: 20, height: 100 }),
    ],
    [],
    [
      drawing({
        strokes: [
          [
            { x: 4, y: 50 },
            { x: 96, y: 50 },
          ],
        ],
      }),
    ],
  )
  assert.equal(settleCoveredItems(before), before)
})

test('above drawings never peek or act as opaque blockers for desktop icons', () => {
  const above = drawing({ layer: 'above', width: 200, height: 200 })
  const withWindow = workspace([window('front')], [], [above])
  assert.equal(settleCoveredItems(withWindow), withWindow)
  const withIcon = workspace([], [icon()], [above])
  assert.equal(settleCoveredItems(withIcon), withIcon)
})

test('a stroke whose thickness is already visible along a window edge stays put', () => {
  const before = workspace(
    [window('front', { x: 104 })],
    [],
    [
      drawing({
        strokes: [
          [
            { x: 4, y: 4 },
            { x: 4, y: 96 },
          ],
        ],
      }),
    ],
  )
  assert.equal(settleCoveredItems(before), before)
})

test('below drawings do not displace icons or other drawings with their empty bounds', () => {
  const before = workspace(
    [],
    [icon()],
    [
      drawing({ strokes: [[{ x: 96, y: 96 }]] }),
      drawing({ id: 'other', strokes: [[{ x: 96, y: 96 }]] }),
    ],
  )
  assert.equal(settleCoveredItems(before), before)
})

test('desktop icon glyphs can cover a below drawing without losing its home', () => {
  const before = workspace(
    [],
    [icon()],
    [
      drawing({
        x: 120,
        y: 120,
        width: 16,
        height: 16,
        strokes: [[{ x: 8, y: 8 }]],
      }),
    ],
  )
  const result = settleCoveredItems(before)
  assert.deepEqual(result.drawings[0].peekOrigin, { x: 120, y: 120 })
  assert.equal(settleCoveredItems(result), result)
  const restored = restoreBackgroundItems({ ...result, items: [] })
  assert.deepEqual(restored.drawings[0], before.drawings[0])
})
