import assert from 'node:assert/strict'
import { test } from 'node:test'
import { setObjectPlacement, type FrameLayout } from '../src/frame-layout.ts'
import { resolveObjectLocation } from '../src/object-location.ts'

const icon = { kind: 'item', id: 'browser-shortcut' } as const
const drawing = { kind: 'drawing', id: 'sketch' } as const
const savedBounds = {
  x: 900,
  y: 600,
  width: 88,
  height: 96,
  peekOrigin: { x: 760, y: 480 },
}
const emptyLayout: FrameLayout = { placements: {}, allowHideTools: false }

test('a frame icon has no active canvas position or peek origin', () => {
  const layout = setObjectPlacement(emptyLayout, icon, {
    surface: 'frame',
    edge: 'left',
    position: 0.5,
  })

  assert.deepEqual(resolveObjectLocation(layout, icon, savedBounds), {
    surface: 'frame',
    edge: 'left',
    position: 0.5,
  })
})

test('group frame placement overrides old child canvas coordinates while pinned drawings have no canvas geometry', () => {
  const layout: FrameLayout = {
    ...emptyLayout,
    groups: {
      attached: {
        id: 'attached',
        members: [icon, { kind: 'widget', id: 'apps' }],
      },
    },
    placements: {
      'group:attached': { surface: 'frame', edge: 'bottom', position: 0.8 },
      'item:browser-shortcut': { surface: 'canvas', x: 100, y: 200 },
      'drawing:sketch': { surface: 'pinned', x: 300, y: 400 },
    },
  }

  assert.deepEqual(resolveObjectLocation(layout, icon, savedBounds), {
    surface: 'frame',
    edge: 'bottom',
    position: 0.8,
  })
  assert.deepEqual(
    resolveObjectLocation(layout, drawing, savedBounds, 'background'),
    { surface: 'pinned', x: 300, y: 400 },
  )
})

test('detaching an icon uses its new canvas location rather than its dormant position', () => {
  const attached = setObjectPlacement(emptyLayout, icon, {
    surface: 'frame',
    edge: 'top',
    position: 0,
  })
  const detached = setObjectPlacement(attached, icon, {
    surface: 'canvas',
    x: 420,
    y: 320,
  })

  assert.deepEqual(resolveObjectLocation(detached, icon, savedBounds), {
    surface: 'canvas',
    bounds: { x: 420, y: 320, width: 88, height: 96 },
  })
})

test('unplaced desktop items remain on the background at their current canvas position', () => {
  assert.deepEqual(resolveObjectLocation(undefined, icon, savedBounds), {
    surface: 'background',
    bounds: { x: 900, y: 600, width: 88, height: 96 },
  })
})

test('legacy drawing layers supply the default only until a location is assigned', () => {
  assert.deepEqual(
    resolveObjectLocation(emptyLayout, drawing, savedBounds, 'background'),
    {
      surface: 'background',
      bounds: { x: 900, y: 600, width: 88, height: 96 },
    },
  )
  const raised = setObjectPlacement(emptyLayout, drawing, { surface: 'canvas' })
  assert.deepEqual(
    resolveObjectLocation(raised, drawing, savedBounds, 'background'),
    {
      surface: 'canvas',
      bounds: { x: 900, y: 600, width: 88, height: 96 },
    },
  )
})

test('hidden frame controls have no active canvas geometry', () => {
  const notifications = { kind: 'widget', id: 'notifications' } as const
  const hidden = setObjectPlacement(emptyLayout, notifications, {
    surface: 'hidden',
  })

  assert.deepEqual(resolveObjectLocation(hidden, notifications, savedBounds), {
    surface: 'hidden',
  })
})
