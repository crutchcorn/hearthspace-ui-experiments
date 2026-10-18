import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  FRAME_LAYOUT_STORAGE_KEY,
  getFrameBounds,
  getPlacement,
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
    { x: 24, y: 24, width: 200, height: 100 },
  )
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'bottom', position: 1 },
      200,
      100,
      viewport,
    ),
    { x: 776, y: 676, width: 200, height: 100 },
  )
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'left', position: 0.5 },
      200,
      100,
      viewport,
    ),
    { x: 24, y: 350, width: 200, height: 100 },
  )
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'right', position: 0.5 },
      200,
      100,
      viewport,
    ),
    { x: 776, y: 350, width: 200, height: 100 },
  )
})

test('attachments fit inside a smaller viewport without losing their edge', () => {
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'bottom', position: 1 },
      480,
      300,
      { width: 390, height: 844 },
    ),
    { x: 12, y: 532, width: 366, height: 300 },
  )
  assert.deepEqual(
    getFrameBounds({ surface: 'frame', edge: 'right', position: 0 }, 480, 300, {
      width: 390,
      height: 200,
    }),
    { x: 12, y: 12, width: 366, height: 176 },
  )
})
