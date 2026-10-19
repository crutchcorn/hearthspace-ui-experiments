import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getCanvasSearchLayout,
  getWindowSwitcherLayout,
} from '../src/canvas-search.ts'
import type { Bounds, Workspace } from '../src/desktop.ts'
import { FRAME_WIDGETS } from '../src/frame-layout.ts'

const view: Bounds = { x: 4000, y: 3000, width: 1200, height: 800 }
const workspace: Workspace = {
  width: 12000,
  height: 8000,
  home: { x: 4000, y: 3000 },
  note: '',
  items: [
    {
      id: 'drawings-folder',
      title: 'Drawings',
      kind: 'folder',
      appId: 'files',
      x: 4200,
      y: 3200,
      width: 88,
      height: 96,
    },
    {
      id: 'browser-shortcut',
      title: 'Browser',
      kind: 'app',
      appId: 'browser',
      x: 4200,
      y: 3304,
      width: 88,
      height: 96,
    },
  ],
  windows: [
    {
      id: 'notes-window',
      title: 'Drawing ideas',
      kind: 'notes',
      appId: 'notes',
      x: 4400,
      y: 3200,
      width: 400,
      height: 300,
    },
  ],
  drawings: [
    {
      id: 'large-sketch',
      layer: 'below',
      x: 6000,
      y: 5000,
      width: 1200,
      height: 900,
      strokes: [
        [
          { x: 5, y: 5 },
          { x: 1195, y: 895 },
        ],
      ],
    },
    {
      id: 'small-sketch',
      layer: 'above',
      x: 4200,
      y: 3100,
      width: 90,
      height: 60,
      strokes: [
        [
          { x: 5, y: 5 },
          { x: 85, y: 55 },
        ],
      ],
    },
  ],
}

test('one query returns desktop items, windows, drawings, and widgets together', () => {
  const before = structuredClone(workspace)
  const layout = getCanvasSearchLayout(
    workspace,
    view,
    { x: 600, y: 150 },
    'draw',
    false,
    { widgets: FRAME_WIDGETS },
  )
  assert.deepEqual(layout.results, [
    { kind: 'item', id: 'drawings-folder' },
    { kind: 'window', id: 'notes-window' },
    { kind: 'drawing', id: 'large-sketch' },
    { kind: 'drawing', id: 'small-sketch' },
    { kind: 'widget', id: 'tools' },
  ])
  assert.equal(layout.items.get('browser-shortcut')?.matches, false)
  assert.equal(layout.windows.get('notes-window')?.matches, true)
  assert.equal(layout.drawings.get('large-sketch')?.matches, true)
  assert.equal(layout.widgets.get('tools')?.matches, true)
  assert.deepEqual(workspace, before)
})

test('empty search includes drawings and recoverable widgets alongside shortcuts', () => {
  const layout = getCanvasSearchLayout(
    workspace,
    view,
    { x: 600, y: 150 },
    '',
    false,
    { widgets: FRAME_WIDGETS },
  )
  assert.deepEqual(
    layout.results.map((result) => `${result.kind}:${result.id}`),
    [
      'item:drawings-folder',
      'item:browser-shortcut',
      'drawing:large-sketch',
      'drawing:small-sketch',
      'widget:notifications',
      'widget:clock',
      'widget:wifi',
      'widget:volume',
      'widget:battery',
      'widget:tools',
      'widget:apps',
    ],
  )
})

test('widget descriptions and keywords make removed defaults discoverable', () => {
  const layout = getCanvasSearchLayout(
    workspace,
    view,
    { x: 600, y: 150 },
    ' BATTERY  power ',
    false,
    { widgets: FRAME_WIDGETS },
  )
  assert.deepEqual(layout.results, [{ kind: 'widget', id: 'battery' }])
  assert.equal(layout.widgets.get('battery')?.matches, true)
  assert.equal(layout.widgets.get('tools')?.matches, false)
})

test('drawings can be found by their displayed number or ink and sketch terms', () => {
  const numbered = getCanvasSearchLayout(
    workspace,
    view,
    { x: 600, y: 150 },
    'drawing 2',
  )
  assert.deepEqual(numbered.results, [{ kind: 'drawing', id: 'small-sketch' }])
  assert.equal(numbered.drawings.get('large-sketch')?.matches, false)
  const byMaterial = getCanvasSearchLayout(
    workspace,
    view,
    { x: 600, y: 150 },
    'ink sketch',
  )
  assert.deepEqual(byMaterial.results, [
    { kind: 'drawing', id: 'large-sketch' },
    { kind: 'drawing', id: 'small-sketch' },
  ])
})

test('large drawings fit above a low search field without leaving the viewport', () => {
  const layout = getCanvasSearchLayout(
    workspace,
    view,
    { x: 600, y: 650 },
    'drawing 1',
    true,
  )
  assert.equal(layout.resultsAbove, true)
  const drawing = workspace.drawings[0]
  const placement = layout.drawings.get(drawing.id)!
  assert.ok(placement.scale > 0 && placement.scale < 1)
  assert.ok(placement.x >= view.x)
  assert.ok(placement.y >= view.y)
  assert.ok(
    placement.x + drawing.width * placement.scale <= view.x + view.width,
  )
  assert.ok(
    placement.y + drawing.height * placement.scale <
      view.y + layout.position.y - layout.handwritingHeight,
  )
})

test('a query without matches moves drawings out of the result area', () => {
  const layout = getCanvasSearchLayout(
    workspace,
    view,
    { x: 600, y: 150 },
    'no such object',
    false,
    { widgets: FRAME_WIDGETS },
  )
  assert.equal(layout.results.length, 0)
  for (const drawing of workspace.drawings) {
    const placement = layout.drawings.get(drawing.id)!
    assert.equal(placement.matches, false)
    assert.ok(
      placement.x + drawing.width <= view.x ||
        placement.x >= view.x + view.width ||
        placement.y + drawing.height <= view.y ||
        placement.y >= view.y + view.height,
    )
  }
})

test('window switching leaves drawing and widget search results empty', () => {
  const layout = getWindowSwitcherLayout(workspace, view, workspace.windows)
  assert.equal(layout.drawings.size, 0)
  assert.equal(layout.widgets.size, 0)
  assert.equal(layout.windows.get('notes-window')?.matches, true)
})
