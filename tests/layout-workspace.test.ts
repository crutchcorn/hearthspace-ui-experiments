import assert from 'node:assert/strict'
import { test } from 'node:test'
import { arrangeWindows, type Workspace } from '../src/desktop.ts'
import { setObjectPlacement, type FrameLayout } from '../src/frame-layout.ts'
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

test('pinned drawings and frame shortcuts retain their geometry when canvas windows settle', () => {
  const stacked: Workspace = {
    ...workspace,
    windows: [...workspace.windows, { ...workspace.windows[0], id: 'front' }],
  }
  const result = transformCanvasWorkspace(
    stacked,
    {
      ...defaults,
      placements: {
        'item:notes-shortcut': frame,
        'drawing:sketch': { surface: 'pinned', x: 240, y: 140 },
      },
    },
    settleCoveredItems,
  )
  assert.equal(result.items[0], workspace.items[0])
  assert.equal(result.drawings[0], workspace.drawings[0])
  assert.equal(result.windows[0].y, 76)
  assert.equal(result.windows[1], stacked.windows[1])
})

test('a grouped shortcut ignores its old canvas placement when windows settle', () => {
  const layout: FrameLayout = {
    ...defaults,
    placements: {
      'item:notes-shortcut': { surface: 'background' },
      'group:dock': frame,
    },
    groups: {
      dock: {
        id: 'dock',
        members: [
          { kind: 'item', id: 'notes-shortcut' },
          { kind: 'widget', id: 'apps' },
        ],
      },
    },
  }
  const result = transformCanvasWorkspace(workspace, layout, settleCoveredItems)
  assert.equal(result.items[0], workspace.items[0])
  assert.notDeepEqual(result.drawings[0], workspace.drawings[0])
})

test('arranging windows preserves a grouped shortcut home until it returns to the canvas', () => {
  const before: Workspace = {
    ...workspace,
    items: [{ ...workspace.items[0], x: 20, peekOrigin: { x: 140, y: 140 } }],
  }
  const layout: FrameLayout = {
    ...defaults,
    placements: { 'group:dock': frame },
    groups: {
      dock: {
        id: 'dock',
        members: [
          { kind: 'item', id: 'notes-shortcut' },
          { kind: 'widget', id: 'apps' },
        ],
      },
    },
  }
  const arranged = transformCanvasWorkspace(before, layout, (canvas, layers) =>
    restoreBackgroundItems(arrangeWindows(canvas, { x: 500, y: 500 }), layers),
  )
  assert.equal(arranged.windows[0].x, 524)
  assert.equal(arranged.items[0], before.items[0])
  const returned = transformCanvasWorkspace(
    arranged,
    setObjectPlacement(
      layout,
      { kind: 'item', id: 'notes-shortcut' },
      { surface: 'background' },
    ),
    restoreBackgroundItems,
  )
  assert.deepEqual(returned.items[0], workspace.items[0])
})

test('canvas shortcuts peek from ordinary windows', () => {
  const result = transformCanvasWorkspace(
    workspace,
    {
      ...defaults,
      placements: { 'item:notes-shortcut': { surface: 'canvas' } },
    },
    settleCoveredItems,
  )
  assert.notDeepEqual(result.items[0], workspace.items[0])
  assert.deepEqual(result.items[0].peekOrigin, { x: 140, y: 140 })
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
  assert.notDeepEqual(raised.drawings[0], workspace.drawings[0])
  assert.equal(raised.drawings[0].layer, 'below')
  assert.deepEqual(raised.drawings[0].peekOrigin, { x: 240, y: 140 })
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

test('Arrange moves only canvas windows and preserves attached window geometry', () => {
  const before: Workspace = {
    ...workspace,
    windows: [
      workspace.windows[0],
      { ...workspace.windows[0], id: 'frame-window' },
    ],
  }
  const result = transformCanvasWorkspace(
    before,
    {
      ...defaults,
      placements: {
        'window:frame-window': frame,
      },
    },
    (canvas) => arrangeWindows(canvas, { x: 500, y: 500 }),
  )
  assert.equal(result.windows[0].x, 524)
  assert.equal(result.windows[0].y, 596)
  assert.equal(result.windows[1], before.windows[1])
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
        'drawing:sketch': { surface: 'pinned', x: 240, y: 140 },
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

test('a detached canvas shortcut retains its first home across repeated window coverage', () => {
  const before = { ...workspace, drawings: [] }
  const layout = setObjectPlacement(
    { ...defaults, placements: { 'item:notes-shortcut': frame } },
    { kind: 'item', id: 'notes-shortcut' },
    { surface: 'canvas' },
  )
  const first = transformCanvasWorkspace(before, layout, settleCoveredItems)
  const second = transformCanvasWorkspace(
    {
      ...first,
      windows: [
        ...first.windows,
        {
          ...workspace.windows[0],
          id: 'second-window',
          x: first.items[0].x,
          y: first.items[0].y,
        },
      ],
    },
    layout,
    settleCoveredItems,
  )
  assert.notDeepEqual(
    { x: second.items[0].x, y: second.items[0].y },
    { x: first.items[0].x, y: first.items[0].y },
  )
  assert.deepEqual(second.items[0].peekOrigin, { x: 140, y: 140 })
  const restored = transformCanvasWorkspace(
    { ...second, windows: [] },
    layout,
    restoreBackgroundItems,
  )
  assert.deepEqual(restored.items, before.items)
  assert.deepEqual(layout.placements['item:notes-shortcut'], {
    surface: 'canvas',
  })
})

test('a background drawing peeks repeatedly and returns without rewriting its legacy layer', () => {
  const before: Workspace = {
    ...workspace,
    items: [],
    drawings: [{ ...workspace.drawings[0], layer: 'above' }],
  }
  const layout = setObjectPlacement(
    {
      ...defaults,
      placements: { 'drawing:sketch': { surface: 'pinned', x: 240, y: 140 } },
    },
    { kind: 'drawing', id: 'sketch' },
    { surface: 'canvas' },
  )
  const first = transformCanvasWorkspace(before, layout, settleCoveredItems)
  assert.deepEqual(first.drawings[0].peekOrigin, { x: 240, y: 140 })
  const second = transformCanvasWorkspace(
    {
      ...first,
      windows: [
        ...first.windows,
        {
          ...workspace.windows[0],
          id: 'second-window',
          x: first.drawings[0].x,
          y: first.drawings[0].y,
        },
      ],
    },
    layout,
    settleCoveredItems,
  )
  assert.notDeepEqual(
    { x: second.drawings[0].x, y: second.drawings[0].y },
    { x: first.drawings[0].x, y: first.drawings[0].y },
  )
  assert.deepEqual(second.drawings[0].peekOrigin, { x: 240, y: 140 })
  assert.equal(second.drawings[0].layer, 'above')
  assert.equal(second.drawings[0].strokes, before.drawings[0].strokes)
  const restored = transformCanvasWorkspace(
    { ...second, windows: [] },
    layout,
    restoreBackgroundItems,
  )
  assert.deepEqual(restored.drawings, before.drawings)
  assert.deepEqual(layout.placements['drawing:sketch'], {
    surface: 'background',
  })
})

test('background windows only displace background shortcuts', () => {
  const before: Workspace = {
    ...workspace,
    items: [
      workspace.items[0],
      { ...workspace.items[0], id: 'raised-shortcut', x: 240 },
    ],
    drawings: [],
  }
  const layout: FrameLayout = {
    ...defaults,
    placements: {
      'window:notes': { surface: 'background' },
      'item:raised-shortcut': { surface: 'canvas' },
    },
  }
  const result = transformCanvasWorkspace(before, layout, settleCoveredItems)
  assert.notDeepEqual(result.items[0], before.items[0])
  assert.equal(result.items[1], before.items[1])
})

test('background windows displace background drawings while pinned drawings stay still', () => {
  const before: Workspace = {
    ...workspace,
    items: [],
    drawings: [
      workspace.drawings[0],
      { ...workspace.drawings[0], id: 'raised-sketch', layer: 'above' },
    ],
  }
  const layout: FrameLayout = {
    ...defaults,
    placements: {
      'window:notes': { surface: 'background' },
      'drawing:raised-sketch': { surface: 'pinned', x: 240, y: 140 },
    },
  }
  const result = transformCanvasWorkspace(before, layout, settleCoveredItems)
  assert.notDeepEqual(result.drawings[0], before.drawings[0])
  assert.equal(result.drawings[1], before.drawings[1])
})

test('raised shortcuts return over a lowered window while background drawings remain exposed', () => {
  const layout: FrameLayout = {
    ...defaults,
    placements: {
      'item:notes-shortcut': { surface: 'canvas' },
      'drawing:sketch': { surface: 'background' },
    },
  }
  const first = transformCanvasWorkspace(workspace, layout, settleCoveredItems)
  assert.ok(first.items[0].peekOrigin)
  assert.ok(first.drawings[0].peekOrigin)
  const lowered = setObjectPlacement(
    layout,
    { kind: 'window', id: 'notes' },
    { surface: 'background' },
  )
  const restored = transformCanvasWorkspace(
    first,
    lowered,
    restoreBackgroundItems,
  )
  assert.deepEqual(restored.items, workspace.items)
  assert.deepEqual(restored.drawings, first.drawings)
})

test('raised icons cover background icons regardless of their saved array order', () => {
  const before: Workspace = {
    ...workspace,
    windows: [],
    items: [
      workspace.items[0],
      { ...workspace.items[0], id: 'background-shortcut' },
    ],
    drawings: [],
  }
  const layout: FrameLayout = {
    ...defaults,
    placements: { 'item:notes-shortcut': { surface: 'canvas' } },
  }
  const result = transformCanvasWorkspace(before, layout, settleCoveredItems)
  assert.equal(result.items[0], before.items[0])
  assert.notDeepEqual(result.items[1], before.items[1])
})

test('background icon glyphs do not displace pinned drawings', () => {
  const before: Workspace = {
    ...workspace,
    windows: [],
    drawings: [
      {
        ...workspace.drawings[0],
        layer: 'above',
        x: 166,
        y: 160,
        width: 30,
        height: 30,
        strokes: [
          [
            { x: 2, y: 2 },
            { x: 28, y: 28 },
          ],
        ],
      },
    ],
  }
  const result = transformCanvasWorkspace(
    before,
    {
      ...defaults,
      placements: { 'drawing:sketch': { surface: 'pinned', x: 166, y: 160 } },
    },
    settleCoveredItems,
  )
  assert.equal(result, before)
})

test('a shortcut dropped from the frame under a window peeks immediately', () => {
  const before = { ...workspace, drawings: [] }
  const layout = setObjectPlacement(
    { ...defaults, placements: { 'item:notes-shortcut': frame } },
    { kind: 'item', id: 'notes-shortcut' },
    { surface: 'canvas' },
  )
  const result = settleLayoutDrop(before, layout, {
    kind: 'item',
    id: 'notes-shortcut',
  })
  assert.deepEqual(result.items[0].peekOrigin, { x: 140, y: 140 })
  assert.notDeepEqual(result.items[0], before.items[0])
  assert.equal(result.windows[0], before.windows[0])
})

test('unpinning a drawing to the background under a window makes it peek immediately', () => {
  const before: Workspace = {
    ...workspace,
    items: [],
    drawings: [{ ...workspace.drawings[0], layer: 'above' }],
  }
  const layout = setObjectPlacement(
    {
      ...defaults,
      placements: { 'drawing:sketch': { surface: 'pinned', x: 240, y: 140 } },
    },
    { kind: 'drawing', id: 'sketch' },
    { surface: 'canvas' },
  )
  const result = settleLayoutDrop(before, layout, {
    kind: 'drawing',
    id: 'sketch',
  })
  assert.deepEqual(result.drawings[0].peekOrigin, { x: 240, y: 140 })
  assert.notDeepEqual(result.drawings[0], before.drawings[0])
  assert.equal(result.drawings[0].layer, 'above')
  assert.equal(result.windows[0], before.windows[0])
})

test('background drop obstacles do not displace raised decorations or ordinary windows', () => {
  const layout: FrameLayout = {
    ...defaults,
    placements: {
      'widget:notifications': { surface: 'background', x: 100, y: 100 },
      'item:notes-shortcut': { surface: 'canvas' },
      'drawing:sketch': { surface: 'pinned', x: 240, y: 140 },
    },
  }
  const before = {
    ...workspace,
    windows: [{ ...workspace.windows[0], x: 1000 }],
  }
  const result = settleLayoutDrop(
    before,
    layout,
    { kind: 'widget', id: 'notifications' },
    { x: 100, y: 100, width: 280, height: 200 },
  )
  assert.deepEqual(result.items, before.items)
  assert.deepEqual(result.drawings, before.drawings)
  assert.equal(result.windows[0], before.windows[0])
})

test('canvas transforms receive original drawing layers and explicit surfaces', () => {
  const before: Workspace = {
    ...workspace,
    windows: [],
    items: [],
    drawings: [{ ...workspace.drawings[0], layer: 'above' }],
  }
  const layout = setObjectPlacement(
    defaults,
    { kind: 'drawing', id: 'sketch' },
    {
      surface: 'background',
    },
  )
  const result = transformCanvasWorkspace(before, layout, (canvas, context) => {
    assert.equal(canvas.drawings[0], before.drawings[0])
    assert.equal(canvas.drawings[0].layer, 'above')
    assert.equal(context.drawingSurfaces?.get('sketch'), 'background')
    return canvas
  })
  assert.equal(result, before)
})

test('background drops use the actual position of ordinary windows while settling their peers', () => {
  const before: Workspace = {
    ...workspace,
    items: [],
    drawings: [],
    windows: [
      workspace.windows[0],
      { ...workspace.windows[0], id: 'ordinary' },
      { ...workspace.windows[0], id: 'background-peer', y: 76 },
    ],
  }
  const layout: FrameLayout = {
    ...defaults,
    placements: {
      'window:notes': { surface: 'background' },
      'window:background-peer': { surface: 'background' },
    },
  }
  const result = settleLayoutDrop(before, layout, {
    kind: 'window',
    id: 'notes',
  })

  assert.equal(result.windows[0], before.windows[0])
  assert.equal(result.windows[1], before.windows[1])
  // This peer is already exposed above both windows. A temporary move of the
  // ordinary window must not make it appear covered during the calculation.
  assert.equal(result.windows[2], before.windows[2])
})

test('a background drop commits the dropped shortcut home while making its later peer yield', () => {
  const dropped = {
    ...workspace.items[0],
    peekOrigin: { x: 20, y: 20 },
  }
  const before: Workspace = {
    ...workspace,
    windows: [],
    drawings: [],
    items: [dropped, { ...workspace.items[0], id: 'later-peer' }],
  }
  const result = settleLayoutDrop(before, defaults, {
    kind: 'item',
    id: dropped.id,
  })
  assert.equal(result.items[0].x, dropped.x)
  assert.equal(result.items[0].y, dropped.y)
  assert.equal(result.items[0].peekOrigin, undefined)
  assert.notDeepEqual(result.items[1], before.items[1])
  assert.equal(result.items[1].peekOrigin, undefined)
})

test('settling canvas work excludes pinned and grouped controls from the calculation', () => {
  const controls = ['battery', 'wifi'].map((id) => ({
    id,
    surface: 'canvas' as const,
    x: 150,
    y: 150,
    width: 54,
    height: 54,
    peekOrigin: { x: 160, y: 160 },
  }))
  const before = { ...workspace, items: [], drawings: [], controls }
  const layout: FrameLayout = {
    ...defaults,
    placements: { 'widget:battery': frame, 'group:status': frame },
    groups: {
      status: {
        id: 'status',
        members: [
          { kind: 'widget', id: 'wifi' },
          { kind: 'widget', id: 'volume' },
        ],
      },
    },
  }
  assert.equal(
    transformCanvasWorkspace(before, layout, settleCoveredItems),
    before,
  )
})

test('dropping a canvas control under a window makes it peek without moving the window', () => {
  const control = {
    id: 'battery',
    surface: 'canvas' as const,
    x: 150,
    y: 150,
    width: 54,
    height: 54,
  }
  const before = { ...workspace, items: [], drawings: [], controls: [control] }
  const layout = setObjectPlacement(
    defaults,
    { kind: 'widget', id: 'battery' },
    control,
  )
  const result = settleLayoutDrop(before, layout, {
    kind: 'widget',
    id: 'battery',
  })
  assert.equal(result.windows[0], before.windows[0])
  assert.notDeepEqual(result.controls![0], control)
  assert.deepEqual(result.controls![0].peekOrigin, { x: 150, y: 150 })
})

test('a background window drop commits the new home of displaced controls', () => {
  const control = {
    id: 'battery',
    surface: 'background' as const,
    x: 150,
    y: 150,
    width: 54,
    height: 54,
  }
  const before = { ...workspace, items: [], drawings: [], controls: [control] }
  let layout = setObjectPlacement(
    defaults,
    { kind: 'widget', id: 'battery' },
    control,
  )
  layout = setObjectPlacement(
    layout,
    { kind: 'window', id: 'notes' },
    { surface: 'background' },
  )
  const result = settleLayoutDrop(before, layout, {
    kind: 'window',
    id: 'notes',
  })
  assert.notDeepEqual(result.controls![0], control)
  assert.equal(result.controls![0].peekOrigin, undefined)
  assert.deepEqual(
    restoreBackgroundItems({ ...result, windows: [] }).controls,
    result.controls,
  )
})
