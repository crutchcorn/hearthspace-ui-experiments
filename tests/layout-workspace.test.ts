import assert from 'node:assert/strict'
import { test } from 'node:test'
import { arrangeWindows, type Workspace } from '../src/desktop.ts'
import type { FrameLayout } from '../src/frame-layout.ts'
import {
  settleLayoutDrop,
  transformCanvasWorkspace,
} from '../src/layout-workspace.ts'
import {
  restoreBackgroundItems,
  settleCoveredItems,
} from '../src/peek-layout.ts'

const frame = { surface: 'frame', edge: 'right', position: 0.5 } as const
const workspace: Workspace = {
  width: 2000,
  height: 1600,
  home: { x: 0, y: 0 },
  note: '',
  windows: [
    {
      id: 'notes',
      kind: 'notes',
      title: 'Notes',
      x: 100,
      y: 100,
      width: 280,
      height: 200,
    },
  ],
  items: [
    {
      id: 'notes-shortcut',
      title: 'Notes',
      kind: 'app',
      appId: 'notes',
      x: 140,
      y: 140,
      width: 88,
      height: 96,
    },
  ],
  drawings: [
    {
      id: 'sketch',
      layer: 'below',
      x: 240,
      y: 140,
      width: 100,
      height: 80,
      strokes: [
        [
          { x: 4, y: 4 },
          { x: 96, y: 76 },
        ],
      ],
    },
  ],
}
const defaults: FrameLayout = { placements: {}, allowHideTools: false }

test('frame windows do not push background items away from their saved canvas bounds', () => {
  const layout: FrameLayout = {
    ...defaults,
    placements: { 'window:notes': frame },
  }
  assert.equal(
    transformCanvasWorkspace(workspace, layout, settleCoveredItems),
    workspace,
  )
})

test('items return home even when a frame window has overlapping saved canvas bounds', () => {
  const displaced: Workspace = {
    ...workspace,
    items: [{ ...workspace.items[0], x: 20, peekOrigin: { x: 140, y: 140 } }],
  }
  const result = transformCanvasWorkspace(
    displaced,
    { ...defaults, placements: { 'window:notes': frame } },
    restoreBackgroundItems,
  )
  assert.deepEqual(result.items, workspace.items)
  assert.equal(result.windows[0], workspace.windows[0])
})

test('frame drawings and shortcuts retain their geometry when canvas windows settle', () => {
  const stacked: Workspace = {
    ...workspace,
    windows: [...workspace.windows, { ...workspace.windows[0], id: 'front' }],
  }
  const result = transformCanvasWorkspace(
    stacked,
    {
      ...defaults,
      placements: { 'item:notes-shortcut': frame, 'drawing:sketch': frame },
    },
    settleCoveredItems,
  )
  assert.equal(result.items[0], workspace.items[0])
  assert.equal(result.drawings[0], workspace.drawings[0])
  assert.equal(result.windows[0].y, 76)
  assert.equal(result.windows[1], stacked.windows[1])
})

test('raised shortcuts are not moved by background peeking', () => {
  const result = transformCanvasWorkspace(
    workspace,
    {
      ...defaults,
      placements: { 'item:notes-shortcut': { surface: 'canvas' } },
    },
    settleCoveredItems,
  )
  assert.equal(result.items[0], workspace.items[0])
  assert.notDeepEqual(result.drawings[0], workspace.drawings[0])
  assert.deepEqual(result.drawings[0].peekOrigin, { x: 240, y: 140 })
})

test('background windows settle below raised windows without changing stored order', () => {
  const stacked: Workspace = {
    ...workspace,
    windows: [
      workspace.windows[0],
      { ...workspace.windows[0], id: 'background-window' },
    ],
    items: [],
    drawings: [],
  }
  const result = transformCanvasWorkspace(
    stacked,
    {
      ...defaults,
      placements: { 'window:background-window': { surface: 'background' } },
    },
    settleCoveredItems,
  )
  assert.deepEqual(
    result.windows.map((item) => item.id),
    ['notes', 'background-window'],
  )
  assert.equal(result.windows[0], stacked.windows[0])
  assert.equal(result.windows[1].y, 76)
})

test('drawing placements override legacy layers without rewriting them', () => {
  const raised = transformCanvasWorkspace(
    workspace,
    {
      ...defaults,
      placements: { 'drawing:sketch': { surface: 'canvas' } },
    },
    settleCoveredItems,
  )
  assert.equal(raised.drawings[0], workspace.drawings[0])
  const legacyRaised: Workspace = {
    ...workspace,
    drawings: [{ ...workspace.drawings[0], layer: 'above' }],
  }
  const lowered = transformCanvasWorkspace(
    legacyRaised,
    {
      ...defaults,
      placements: { 'drawing:sketch': { surface: 'background' } },
    },
    settleCoveredItems,
  )
  assert.equal(lowered.drawings[0].layer, 'above')
  assert.deepEqual(lowered.drawings[0].peekOrigin, { x: 240, y: 140 })
  assert.notEqual(lowered.drawings[0].y, legacyRaised.drawings[0].y)
})

test('Arrange moves only canvas windows and preserves attached and hidden window geometry', () => {
  const before: Workspace = {
    ...workspace,
    windows: [
      workspace.windows[0],
      { ...workspace.windows[0], id: 'frame-window' },
      { ...workspace.windows[0], id: 'hidden-window' },
    ],
  }
  const result = transformCanvasWorkspace(
    before,
    {
      ...defaults,
      placements: {
        'window:frame-window': frame,
        'window:hidden-window': { surface: 'hidden' },
      },
    },
    (canvas) => arrangeWindows(canvas, { x: 500, y: 500 }),
  )
  assert.equal(result.windows[0].x, 524)
  assert.equal(result.windows[0].y, 596)
  assert.equal(result.windows[1], before.windows[1])
  assert.equal(result.windows[2], before.windows[2])
  assert.equal(result.items, before.items)
  assert.equal(result.drawings, before.drawings)
})

test('dropping a window in Change layout keeps it fixed and reveals covered windows', () => {
  const before: Workspace = {
    ...workspace,
    windows: [workspace.windows[0], { ...workspace.windows[0], id: 'covered' }],
  }
  const result = settleLayoutDrop(before, defaults, {
    kind: 'window',
    id: 'notes',
  })
  assert.equal(result.windows[0], before.windows[0])
  assert.equal(result.windows[1].y, 76)
  assert.deepEqual(result.items[0].peekOrigin, { x: 140, y: 140 })
  assert.equal(result.windows.length, before.windows.length)
})

test('dropping a background shortcut permanently moves covered shortcuts and ink', () => {
  const before: Workspace = {
    ...workspace,
    windows: [],
    items: [
      workspace.items[0],
      { ...workspace.items[0], id: 'covered-shortcut' },
    ],
    drawings: [
      {
        ...workspace.drawings[0],
        x: 150,
        y: 150,
        width: 40,
        height: 40,
        strokes: [
          [
            { x: 5, y: 5 },
            { x: 35, y: 35 },
          ],
        ],
      },
    ],
  }
  const result = settleLayoutDrop(before, defaults, {
    kind: 'item',
    id: 'notes-shortcut',
  })
  assert.equal(result.items[0], before.items[0])
  assert.notDeepEqual(result.items[1], before.items[1])
  assert.notDeepEqual(result.drawings[0], before.drawings[0])
  assert.equal(result.items[1].peekOrigin, undefined)
  assert.equal(result.drawings[0].peekOrigin, undefined)
  const movedAway = {
    ...result,
    items: [{ ...result.items[0], x: 1000 }, result.items[1]],
  }
  const restored = restoreBackgroundItems(movedAway)
  assert.equal(restored.items[1], result.items[1])
  assert.equal(restored.drawings[0], result.drawings[0])
  assert.equal(result.windows.length, 0)
})

test('placing a background drawing moves other background work instead of the dropped ink', () => {
  const before: Workspace = {
    ...workspace,
    windows: [],
    drawings: [
      {
        ...workspace.drawings[0],
        x: 100,
        y: 100,
        width: 280,
        height: 200,
        strokes: [
          [
            { x: 4, y: 4 },
            { x: 276, y: 196 },
          ],
        ],
      },
      { ...workspace.drawings[0], id: 'covered-ink' },
    ],
  }
  const result = settleLayoutDrop(before, defaults, {
    kind: 'drawing',
    id: 'sketch',
  })
  assert.equal(result.drawings[0], before.drawings[0])
  assert.notDeepEqual(result.drawings[1], before.drawings[1])
  assert.notDeepEqual(result.items[0], before.items[0])
  assert.equal(result.drawings[1].peekOrigin, undefined)
  assert.equal(result.items[0].peekOrigin, undefined)
})

test('a background window drop commits background positions and leaves raised windows fixed', () => {
  const before: Workspace = {
    ...workspace,
    windows: [
      workspace.windows[0],
      { ...workspace.windows[0], id: 'raised' },
      { ...workspace.windows[0], id: 'background-peer' },
    ],
  }
  const result = settleLayoutDrop(
    before,
    {
      ...defaults,
      placements: {
        'window:notes': { surface: 'background' },
        'window:background-peer': { surface: 'background' },
      },
    },
    { kind: 'window', id: 'notes' },
  )
  assert.equal(result.windows[0], before.windows[0])
  assert.equal(result.windows[1], before.windows[1])
  assert.notDeepEqual(result.windows[2], before.windows[2])
  assert.equal(result.items[0].peekOrigin, undefined)
  assert.equal(result.drawings[0].peekOrigin, undefined)
})

test('background widget drops use supplied bounds without moving frame attachments', () => {
  const before: Workspace = {
    ...workspace,
    windows: [],
    items: [
      workspace.items[0],
      { ...workspace.items[0], id: 'attached-shortcut' },
    ],
  }
  const result = settleLayoutDrop(
    before,
    {
      ...defaults,
      placements: {
        'widget:notifications': { surface: 'background', x: 100, y: 100 },
        'item:attached-shortcut': frame,
        'drawing:sketch': frame,
      },
    },
    { kind: 'widget', id: 'notifications' },
    { x: 100, y: 100, width: 280, height: 200 },
  )
  assert.notDeepEqual(result.items[0], before.items[0])
  assert.equal(result.items[0].peekOrigin, undefined)
  assert.equal(result.items[1], before.items[1])
  assert.equal(result.drawings[0], before.drawings[0])
})

test('background drops do not commit unrelated objects that were already peeking elsewhere', () => {
  const unrelated = {
    ...workspace.items[0],
    id: 'unrelated',
    x: 940,
    y: 1000,
    peekOrigin: { x: 1040, y: 1040 },
  }
  const before: Workspace = {
    ...workspace,
    windows: [{ ...workspace.windows[0], x: 1000, y: 1000 }],
    items: [
      workspace.items[0],
      { ...workspace.items[0], id: 'covered' },
      unrelated,
    ],
    drawings: [],
  }
  const result = settleLayoutDrop(before, defaults, {
    kind: 'item',
    id: 'notes-shortcut',
  })
  assert.equal(result.items[1].peekOrigin, undefined)
  assert.equal(result.items[2], unrelated)
})

test('lowering a window commits the background positions it had already displaced', () => {
  const peeking = settleCoveredItems(workspace)
  assert.deepEqual(peeking.items[0].peekOrigin, { x: 140, y: 140 })
  assert.deepEqual(peeking.drawings[0].peekOrigin, { x: 240, y: 140 })
  const lowered = settleLayoutDrop(
    peeking,
    {
      ...defaults,
      placements: { 'window:notes': { surface: 'background' } },
    },
    { kind: 'window', id: 'notes' },
  )
  assert.equal(lowered.items[0].x, peeking.items[0].x)
  assert.equal(lowered.items[0].y, peeking.items[0].y)
  assert.equal(lowered.drawings[0].x, peeking.drawings[0].x)
  assert.equal(lowered.drawings[0].y, peeking.drawings[0].y)
  assert.equal(lowered.items[0].peekOrigin, undefined)
  assert.equal(lowered.drawings[0].peekOrigin, undefined)

  const windowMovedAway = {
    ...lowered,
    windows: [{ ...lowered.windows[0], x: 1200, y: 1000 }],
  }
  const restored = restoreBackgroundItems(windowMovedAway)
  assert.equal(restored.items[0], lowered.items[0])
  assert.equal(restored.drawings[0], lowered.drawings[0])
})
