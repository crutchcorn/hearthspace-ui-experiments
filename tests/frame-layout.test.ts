import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  FRAME_LAYOUT_STORAGE_KEY,
  getFrameBounds,
  getFrameDropTarget,
  getPlacement,
  getPinnedWindowOffset,
  getWidgetFrameDropTarget,
  loadFrameLayout,
  saveFrameLayout,
  setAllowHideTools,
  setObjectPlacement,
  type FrameLayout,
} from '../src/frame-layout.ts'

const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
)
const storage = new Map<string, string>()
before(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  })
})
after(() => {
  if (originalStorage)
    Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

const defaults: FrameLayout = { placements: {}, allowHideTools: false }
const tools = { kind: 'widget', id: 'tools' } as const
const notifications = { kind: 'widget', id: 'notifications' } as const

test('an empty layout keeps the familiar corner controls and canvas objects', () => {
  assert.deepEqual(getPlacement(defaults, notifications), {
    surface: 'frame',
    edge: 'top',
    position: 0,
  })
  assert.deepEqual(getPlacement(defaults, tools), {
    surface: 'frame',
    edge: 'bottom',
    position: 0,
  })
  assert.deepEqual(getPlacement(defaults, { kind: 'item', id: 'browser' }), {
    surface: 'background',
  })
})

test('canvas tools stay visible until hiding them is explicitly enabled', () => {
  const protectedLayout = setObjectPlacement(defaults, tools, {
    surface: 'hidden',
  })
  assert.equal(getPlacement(protectedLayout, tools).surface, 'frame')

  const hidden = setObjectPlacement(setAllowHideTools(defaults, true), tools, {
    surface: 'hidden',
  })
  assert.equal(getPlacement(hidden, tools).surface, 'hidden')
  const restored = setAllowHideTools(hidden, false)
  assert.deepEqual(getPlacement(restored, tools), {
    surface: 'frame',
    edge: 'bottom',
    position: 0,
  })
  assert.equal(getPlacement(hidden, tools).surface, 'hidden')
})

test('removing attachments hides widgets but returns work to the canvas', () => {
  const hidden = setObjectPlacement(defaults, notifications, {
    surface: 'hidden',
  })
  assert.equal(getPlacement(hidden, notifications).surface, 'hidden')
  for (const kind of ['item', 'window', 'drawing'] as const) {
    const target = { kind, id: 'personal-work' }
    const layout = setObjectPlacement(defaults, target, { surface: 'hidden' })
    assert.deepEqual(getPlacement(layout, target), {
      surface: kind === 'item' ? 'background' : 'canvas',
    })
  }
})

test('frame and background placements survive a saved-layout round trip', () => {
  const layout: FrameLayout = {
    allowHideTools: true,
    placements: {
      'widget:tools': { surface: 'hidden' },
      'widget:system': { surface: 'frame', edge: 'left', position: 0.7 },
      'window:notes': { surface: 'frame', edge: 'right', position: 0.25 },
      'item:projects': { surface: 'background', x: 4320, y: 3690 },
      'drawing:my:sketch': { surface: 'canvas', x: 4500, y: 3700 },
    },
  }
  saveFrameLayout(layout)
  assert.deepEqual(loadFrameLayout(), layout)
})

test('invalid saved entries do not discard valid placements or hide protected tools', () => {
  storage.set(
    FRAME_LAYOUT_STORAGE_KEY,
    JSON.stringify({
      allowHideTools: 'true',
      placements: {
        'widget:tools': { surface: 'hidden' },
        'widget:system': { surface: 'frame', edge: 'right', position: 4 },
        'drawing:sketch': { surface: 'frame', edge: 'top', position: -2 },
        'window:missing-edge': { surface: 'frame', position: 0.5 },
        'window:wrong-edge': { surface: 'frame', edge: 'middle', position: 0 },
        'window:infinite': {
          surface: 'frame',
          edge: 'top',
          position: Infinity,
        },
        'item:bad-coordinate': { surface: 'background', x: '10' },
        'item:non-finite': { surface: 'canvas', y: NaN },
        'item:hidden': { surface: 'hidden' },
        'widget:unknown': { surface: 'frame', edge: 'top', position: 0 },
        'unknown:item': { surface: 'canvas' },
        'window:': { surface: 'canvas' },
      },
    }),
  )
  assert.deepEqual(loadFrameLayout(), {
    allowHideTools: false,
    placements: {
      'widget:tools': { surface: 'frame', edge: 'bottom', position: 0 },
      'widget:system': { surface: 'frame', edge: 'right', position: 1 },
      'drawing:sketch': { surface: 'frame', edge: 'top', position: 0 },
      'item:hidden': { surface: 'background' },
    },
  })
})

test('unreadable layout data restores defaults', () => {
  storage.set(FRAME_LAYOUT_STORAGE_KEY, '{unfinished')
  assert.deepEqual(loadFrameLayout(), defaults)
  storage.set(FRAME_LAYOUT_STORAGE_KEY, 'null')
  assert.deepEqual(loadFrameLayout(), defaults)
})

test('edge attachment maps each position along the usable viewport span', () => {
  const viewport = { width: 1000, height: 800 }
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'top', position: 0 },
      200,
      100,
      viewport,
    ),
    { x: 24, y: 0, width: 200, height: 100 },
  )
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'bottom', position: 1 },
      200,
      100,
      viewport,
    ),
    { x: 776, y: 700, width: 200, height: 100 },
  )
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'left', position: 0.5 },
      200,
      100,
      viewport,
    ),
    { x: 0, y: 350, width: 200, height: 100 },
  )
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'right', position: 0.5 },
      200,
      100,
      viewport,
    ),
    { x: 800, y: 350, width: 200, height: 100 },
  )
})

test('padded controls align their corner and edge spacing on desktop and mobile', () => {
  for (const { viewport, inset } of [
    { viewport: { width: 1000, height: 800 }, inset: 24 },
    { viewport: { width: 390, height: 844 }, inset: 12 },
  ]) {
    for (const edge of ['top', 'right', 'bottom', 'left'] as const) {
      const bounds = getFrameBounds(
        { surface: 'frame', edge, position: 0 },
        54,
        54,
        viewport,
        'padded',
      )
      assert.equal(
        bounds.x,
        edge === 'right' ? viewport.width - 54 - inset : inset,
      )
      assert.equal(
        bounds.y,
        edge === 'bottom' ? viewport.height - 54 - inset : inset,
      )
    }
  }
})

test('attachments fit inside a smaller viewport without losing their edge', () => {
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'bottom', position: 1 },
      480,
      300,
      { width: 390, height: 844 },
    ),
    { x: 12, y: 544, width: 366, height: 300 },
  )
  assert.deepEqual(
    getFrameBounds({ surface: 'frame', edge: 'right', position: 0 }, 480, 300, {
      width: 390,
      height: 200,
    }),
    { x: 24, y: 12, width: 366, height: 176 },
  )
})

test('collapsed pinned windows expose a 42px strip on their attached edge', () => {
  const viewport = { width: 1000, height: 800 }
  const bounds = { x: 24, y: 24, width: 400, height: 300 }
  const left = getPinnedWindowOffset(bounds, 'left', viewport, false)
  assert.deepEqual(left, { x: -382, y: 0 })
  assert.equal(bounds.x + left.x + bounds.width, 42)

  const right = getPinnedWindowOffset(bounds, 'right', viewport, false)
  assert.deepEqual(right, { x: 934, y: 0 })
  assert.equal(viewport.width - (bounds.x + right.x), 42)

  const top = getPinnedWindowOffset(bounds, 'top', viewport, false)
  assert.deepEqual(top, { x: 0, y: -282 })
  assert.equal(bounds.y + top.y + bounds.height, 42)

  const bottom = getPinnedWindowOffset(bounds, 'bottom', viewport, false)
  assert.deepEqual(bottom, { x: 0, y: 734 })
  assert.equal(viewport.height - (bounds.y + bottom.y), 42)
})

test('opening a pinned window restores its fitted frame bounds on every edge', () => {
  const viewport = { width: 1000, height: 800 }
  for (const edge of ['top', 'right', 'bottom', 'left'] as const) {
    const bounds = getFrameBounds(
      { surface: 'frame', edge, position: 0.5 },
      400,
      300,
      viewport,
    )
    assert.deepEqual(getPinnedWindowOffset(bounds, edge, viewport, true), {
      x: 0,
      y: 0,
    })
  }
})

test('hovering can expose more of a pinned window without opening it fully', () => {
  const bounds = { x: 24, y: 24, width: 400, height: 300 }
  const viewport = { width: 1000, height: 800 }
  const preview = getPinnedWindowOffset(bounds, 'left', viewport, false, 100)
  assert.equal(bounds.x + preview.x + bounds.width, 100)
  assert.ok(bounds.x + preview.x < 0)
  assert.deepEqual(getPinnedWindowOffset(bounds, 'left', viewport, true, 100), {
    x: 0,
    y: 0,
  })
})

test('peek distance never exposes more than the attached window dimension', () => {
  const bounds = { x: 24, y: 24, width: 80, height: 60 }
  const viewport = { width: 1000, height: 800 }
  const right = getPinnedWindowOffset(bounds, 'right', viewport, false, 100)
  assert.equal(viewport.width - bounds.x - right.x, bounds.width)
  const bottom = getPinnedWindowOffset(bounds, 'bottom', viewport, false, 100)
  assert.equal(viewport.height - bounds.y - bottom.y, bounds.height)
})

test('the dragged object can reach the frame while the pointer stays far from it', () => {
  assert.deepEqual(
    getFrameDropTarget(
      { x: 310, y: 450, width: 500, height: 300 },
      { width: 1000, height: 800 },
    ),
    {
      surface: 'frame',
      edge: 'bottom',
      position: (310 - 24) / (1000 - 48 - 500),
    },
  )
  assert.equal(
    getFrameDropTarget(
      { x: 200, y: 200, width: 200, height: 200 },
      { width: 1000, height: 800 },
    ),
    null,
  )
})

test('frame drops prefer the closest object edge and snap near the corners', () => {
  assert.deepEqual(
    getFrameDropTarget(
      { x: 100, y: 35, width: 200, height: 150 },
      { width: 1000, height: 800 },
    ),
    { surface: 'frame', edge: 'top', position: 0 },
  )
  assert.deepEqual(
    getFrameDropTarget(
      { x: 730, y: 35, width: 200, height: 150 },
      { width: 1000, height: 800 },
    ),
    { surface: 'frame', edge: 'top', position: 1 },
  )
  assert.deepEqual(
    getFrameDropTarget(
      { x: -20, y: 120, width: 200, height: 150 },
      { width: 1000, height: 800 },
    ),
    { surface: 'frame', edge: 'left', position: (120 - 24) / (800 - 48 - 150) },
  )
  assert.deepEqual(
    getFrameDropTarget(
      { x: 790, y: 560, width: 200, height: 150 },
      { width: 1000, height: 800 },
    ),
    { surface: 'frame', edge: 'right', position: 1 },
  )
})

test('full-width mobile attachments produce a finite centered drop position', () => {
  assert.deepEqual(
    getFrameDropTarget(
      { x: 12, y: -10, width: 366, height: 54 },
      { width: 390, height: 844 },
    ),
    { surface: 'frame', edge: 'top', position: 0.5 },
  )
})

test('the Frame action finds the nearest edge even outside the drag attachment distance', () => {
  const bounds = { x: 260, y: 240, width: 200, height: 160 }
  const viewport = { width: 1000, height: 800 }
  assert.equal(getFrameDropTarget(bounds, viewport), null)
  assert.deepEqual(getFrameDropTarget(bounds, viewport, Infinity), {
    surface: 'frame',
    edge: 'top',
    position: (260 - 24) / (1000 - 48 - 200),
  })
})

test('turning a widget near the left edge does not switch its target to the top edge', () => {
  const viewport = { width: 1000, height: 800 }
  const horizontal = {
    x: 90 - 299 / 2,
    y: 160 - 54 / 2,
    width: 299,
    height: 54,
  }
  const vertical = { x: 90 - 54 / 2, y: 160 - 299 / 2, width: 54, height: 299 }
  const target = getWidgetFrameDropTarget(horizontal, viewport)
  assert.equal(target?.edge, 'left')
  assert.deepEqual(getWidgetFrameDropTarget(vertical, viewport), target)
})

test('turning a widget near the top edge does not switch its target to the left edge', () => {
  const viewport = { width: 1000, height: 800 }
  const horizontal = {
    x: 160 - 299 / 2,
    y: 90 - 54 / 2,
    width: 299,
    height: 54,
  }
  const vertical = { x: 160 - 54 / 2, y: 90 - 299 / 2, width: 54, height: 299 }
  const target = getWidgetFrameDropTarget(horizontal, viewport)
  assert.equal(target?.edge, 'top')
  assert.deepEqual(getWidgetFrameDropTarget(vertical, viewport), target)
})

test('a widget keeps its corner snap through an orientation change', () => {
  const viewport = { width: 1000, height: 800 }
  const horizontal = { x: 90 - 299 / 2, y: 90 - 54 / 2, width: 299, height: 54 }
  const vertical = { x: 90 - 54 / 2, y: 90 - 299 / 2, width: 54, height: 299 }
  const target = { surface: 'frame', edge: 'top', position: 0 }
  assert.deepEqual(getWidgetFrameDropTarget(horizontal, viewport), target)
  assert.deepEqual(getWidgetFrameDropTarget(vertical, viewport), target)
})

for (const corner of [
  { name: 'top-left', x: 90, y: 90, horizontal: 'top', vertical: 'left' },
  { name: 'top-right', x: 910, y: 90, horizontal: 'top', vertical: 'right' },
  {
    name: 'bottom-left',
    x: 90,
    y: 710,
    horizontal: 'bottom',
    vertical: 'left',
  },
  {
    name: 'bottom-right',
    x: 910,
    y: 710,
    horizontal: 'bottom',
    vertical: 'right',
  },
] as const) {
  test(`a horizontal toolbar stays horizontal when previewed and dropped in the ${corner.name} corner`, () => {
    const viewport = { width: 1000, height: 800 }
    const bounds = {
      x: corner.x - 299 / 2,
      y: corner.y - 54 / 2,
      width: 299,
      height: 54,
    }
    const expected = {
      surface: 'frame',
      edge: corner.horizontal,
      position: corner.vertical === 'left' ? 0 : 1,
    }
    for (const currentEdge of ['top', 'bottom'] as const) {
      assert.deepEqual(
        getWidgetFrameDropTarget(bounds, viewport, 72, currentEdge),
        expected,
      )
      assert.deepEqual(
        getWidgetFrameDropTarget(bounds, viewport, Infinity, currentEdge),
        expected,
      )
    }
  })

  test(`a vertical toolbar stays vertical when previewed and dropped in the ${corner.name} corner`, () => {
    const viewport = { width: 1000, height: 800 }
    const bounds = {
      x: corner.x - 54 / 2,
      y: corner.y - 299 / 2,
      width: 54,
      height: 299,
    }
    const expected = {
      surface: 'frame',
      edge: corner.vertical,
      position: corner.horizontal === 'top' ? 0 : 1,
    }
    for (const currentEdge of ['left', 'right'] as const) {
      assert.deepEqual(
        getWidgetFrameDropTarget(bounds, viewport, 72, currentEdge),
        expected,
      )
      assert.deepEqual(
        getWidgetFrameDropTarget(bounds, viewport, Infinity, currentEdge),
        expected,
      )
    }
  })
}

test('a toolbar still changes orientation when entering an edge away from a corner', () => {
  const viewport = { width: 1000, height: 800 }
  assert.deepEqual(
    getWidgetFrameDropTarget(
      { x: 90 - 299 / 2, y: 400 - 54 / 2, width: 299, height: 54 },
      viewport,
      72,
      'top',
    ),
    { surface: 'frame', edge: 'left', position: 0.5 },
  )
  assert.deepEqual(
    getWidgetFrameDropTarget(
      { x: 500 - 54 / 2, y: 90 - 299 / 2, width: 54, height: 299 },
      viewport,
      72,
      'left',
    ),
    { surface: 'frame', edge: 'top', position: 0.5 },
  )
})

test('interior widgets remain untargeted until a final nearest-edge attachment is requested', () => {
  const viewport = { width: 1000, height: 800 }
  const horizontal = {
    x: 250 - 299 / 2,
    y: 350 - 54 / 2,
    width: 299,
    height: 54,
  }
  const vertical = { x: 250 - 54 / 2, y: 350 - 299 / 2, width: 54, height: 299 }
  assert.equal(getWidgetFrameDropTarget(horizontal, viewport), null)
  assert.equal(getWidgetFrameDropTarget(vertical, viewport), null)
  const target = getWidgetFrameDropTarget(horizontal, viewport, Infinity)
  assert.equal(target?.edge, 'left')
  assert.deepEqual(
    getWidgetFrameDropTarget(vertical, viewport, Infinity),
    target,
  )
})
