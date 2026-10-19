import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Bounds, Workspace } from '../src/desktop.ts'
import {
  getFrameBounds,
  mergeFrameTargets,
  setObjectPlacement,
  type FrameLayout,
} from '../src/frame-layout.ts'
import {
  restoreBackgroundItems,
  settleCoveredItems,
} from '../src/peek-layout.ts'
import {
  createScene,
  projectScene,
  removeSceneObject,
  updateSceneLayout,
  updateSceneWorkspace,
} from '../src/scene.ts'
import { transformCanvasWorkspace } from '../src/layout-workspace.ts'

const view: Bounds = { x: 1000, y: 800, width: 1280, height: 720 }
const defaults: FrameLayout = { placements: {}, allowHideTools: false }
const icon = { kind: 'item', id: 'notes-shortcut' } as const
const drawing = { kind: 'drawing', id: 'sketch' } as const
const workspace: Workspace = {
  width: 6000,
  height: 5000,
  home: { x: 1000, y: 800 },
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

test('pinning personal work discards its canvas coordinates and peek home', () => {
  const displaced: Workspace = {
    ...workspace,
    items: workspace.items.map((item) => ({
      ...item,
      x: 420,
      peekOrigin: { x: 140, y: 140 },
    })),
    drawings: workspace.drawings.map((item) => ({
      ...item,
      x: 520,
      peekOrigin: { x: 240, y: 140 },
    })),
  }
  let scene = createScene(displaced, defaults)
  scene = updateSceneLayout(
    scene,
    (layout) =>
      setObjectPlacement(layout, icon, {
        surface: 'frame',
        edge: 'right',
        position: 0.5,
      }),
    view,
  )
  scene = updateSceneLayout(
    scene,
    (layout) =>
      setObjectPlacement(layout, drawing, {
        surface: 'frame',
        edge: 'top',
        position: 0.2,
      }),
    view,
  )

  assert.deepEqual(scene.items[0], {
    id: 'notes-shortcut',
    title: 'Notes',
    kind: 'app',
    appId: 'notes',
    width: 88,
    height: 96,
    location: { surface: 'frame', edge: 'right', position: 0.5 },
  })
  assert.deepEqual(scene.drawings[0], {
    id: 'sketch',
    width: 100,
    height: 80,
    strokes: workspace.drawings[0].strokes,
    location: { surface: 'frame', edge: 'top', position: 0.2 },
  })
  assert.equal(
    Object.hasOwn(scene.layout.placements, 'item:notes-shortcut'),
    false,
  )
  assert.equal(Object.hasOwn(scene.layout.placements, 'drawing:sketch'), false)
})

test('closing a pinned window removes its placement and releases its group neighbor', () => {
  const target = { kind: 'window', id: 'notes' } as const
  const initial = createScene(
    workspace,
    mergeFrameTargets(defaults, target, { kind: 'widget', id: 'apps' }),
  )
  const closed = removeSceneObject(initial, target, view)

  assert.equal(closed.workspace.windows.length, 0)
  assert.equal(Object.hasOwn(closed.layout.placements, 'window:notes'), false)
  assert.deepEqual(closed.layout.groups, {})
  assert.deepEqual(closed.layout.placements['widget:apps'], {
    surface: 'frame',
    edge: 'bottom',
    position: 1,
  })
})

test('closing a canvas window restores the first home of the icons it displaced', () => {
  const initial = updateSceneWorkspace(
    createScene({ ...workspace, drawings: [] }, defaults),
    settleCoveredItems,
    view,
  )
  assert.ok('peekOrigin' in initial.items[0].location)
  const closed = removeSceneObject(
    initial,
    { kind: 'window', id: 'notes' },
    view,
  )
  assert.deepEqual(closed.items[0].location, {
    surface: 'background',
    x: 140,
    y: 140,
  })
})

test('detaching starts at the visible frame location then accepts the actual drop position', () => {
  const scene = createScene(
    workspace,
    setObjectPlacement(defaults, icon, {
      surface: 'frame',
      edge: 'left',
      position: 0.6,
    }),
  )
  const projected = projectScene(scene, view).workspace.items[0]
  const detached = updateSceneLayout(
    scene,
    (layout) => setObjectPlacement(layout, icon, { surface: 'canvas' }),
    view,
  )
  assert.deepEqual(detached.items[0].location, {
    surface: 'canvas',
    x: projected.x,
    y: projected.y,
  })

  const dropped = updateSceneWorkspace(
    detached,
    (current) => ({
      ...current,
      items: current.items.map((item) => ({ ...item, x: 1900, y: 1200 })),
    }),
    view,
  )
  assert.deepEqual(dropped.items[0].location, {
    surface: 'canvas',
    x: 1900,
    y: 1200,
  })
  assert.deepEqual(
    projectScene(dropped, view).layout.placements['item:notes-shortcut'],
    {
      surface: 'canvas',
    },
  )
})

test('frame projection follows the viewport without changing stored object locations', () => {
  const attachment = { surface: 'frame', edge: 'right', position: 0.5 } as const
  const scene = createScene(
    workspace,
    setObjectPlacement(defaults, icon, attachment),
  )
  const snapshot = JSON.stringify(scene)
  const movedView = { ...view, x: 2300, y: 1700, width: 900 }
  const first = projectScene(scene, view).workspace.items[0]
  const next = projectScene(scene, movedView).workspace.items[0]
  const frame = getFrameBounds(attachment, 54, 54, movedView, 'padded')

  assert.notEqual(first.x, next.x)
  assert.equal(next.x, movedView.x + frame.x)
  assert.equal(next.y, movedView.y + frame.y)
  assert.equal(next.width, 88)
  assert.equal(next.height, 96)
  assert.equal(JSON.stringify(scene), snapshot)
})

test('joining a group stores only its reference and detaching uses the group frame position', () => {
  const initial = createScene(workspace, defaults)
  const grouped = updateSceneLayout(
    initial,
    (layout) => mergeFrameTargets(layout, icon, { kind: 'widget', id: 'apps' }),
    view,
  )
  const group = Object.values(grouped.layout.groups ?? {})[0]
  assert.deepEqual(grouped.items[0].location, {
    surface: 'group',
    groupId: group.id,
  })
  assert.equal(
    Object.hasOwn(grouped.layout.placements, 'item:notes-shortcut'),
    false,
  )
  const projection = projectScene(grouped, view)
  assert.equal(
    Object.hasOwn(projection.layout.placements, 'item:notes-shortcut'),
    false,
  )

  const detached = updateSceneLayout(
    grouped,
    (layout) => setObjectPlacement(layout, icon, { surface: 'background' }),
    view,
  )
  assert.deepEqual(detached.items[0].location, {
    surface: 'background',
    x: projection.workspace.items[0].x,
    y: projection.workspace.items[0].y,
  })
  assert.deepEqual(detached.layout.groups, {})
})

test('a group dragged onto the canvas projects members from the group anchor', () => {
  const grouped = updateSceneLayout(
    createScene(workspace, defaults),
    (layout) => mergeFrameTargets(layout, icon, { kind: 'widget', id: 'apps' }),
    view,
  )
  const group = Object.values(grouped.layout.groups ?? {})[0]
  const moved = updateSceneLayout(
    grouped,
    (layout) =>
      setObjectPlacement(
        layout,
        { kind: 'group', id: group.id },
        {
          surface: 'canvas',
          x: 1620,
          y: 1120,
        },
      ),
    view,
  )
  const item = projectScene(moved, view).workspace.items[0]
  assert.deepEqual(moved.items[0].location, {
    surface: 'group',
    groupId: group.id,
  })
  assert.equal(item.x, 1620)
  assert.equal(item.y, 1120)
})

test('canvas icons keep the first peek home through repeated movement and restore it', () => {
  const initial = createScene({ ...workspace, drawings: [] }, defaults)
  const once = updateSceneWorkspace(initial, settleCoveredItems, view)
  const onceItem = projectScene(once, view).workspace.items[0]
  assert.notDeepEqual({ x: onceItem.x, y: onceItem.y }, { x: 140, y: 140 })
  assert.deepEqual(once.items[0].location, {
    surface: 'background',
    x: projectScene(once, view).workspace.items[0].x,
    y: projectScene(once, view).workspace.items[0].y,
    peekOrigin: { x: 140, y: 140 },
  })
  const twice = updateSceneWorkspace(
    once,
    (current) =>
      settleCoveredItems({
        ...current,
        windows: [
          ...current.windows,
          {
            ...current.windows[0],
            id: 'second',
            x: current.items[0].x - 10,
            y: current.items[0].y - 10,
          },
        ],
      }),
    view,
  )
  const twiceItem = projectScene(twice, view).workspace.items[0]
  assert.notDeepEqual(
    { x: twiceItem.x, y: twiceItem.y },
    { x: onceItem.x, y: onceItem.y },
  )
  assert.deepEqual(twiceItem.peekOrigin, { x: 140, y: 140 })
  const restored = updateSceneWorkspace(
    twice,
    (current) => restoreBackgroundItems({ ...current, windows: [] }),
    view,
  )
  assert.deepEqual(restored.items[0].location, {
    surface: 'background',
    x: 140,
    y: 140,
  })
})

test('sequential updates use the latest scene and frame content edits cannot persist coordinates', () => {
  const initial = createScene(workspace, defaults)
  const moved = updateSceneWorkspace(
    initial,
    (current) => ({
      ...current,
      items: current.items.map((item) => ({ ...item, x: item.x + 100 })),
    }),
    view,
  )
  const again = updateSceneWorkspace(
    moved,
    (current) => ({
      ...current,
      items: current.items.map((item) => ({ ...item, x: item.x + 50 })),
    }),
    view,
  )
  assert.deepEqual(again.items[0].location, {
    surface: 'background',
    x: 290,
    y: 140,
  })
  const attached = updateSceneLayout(
    again,
    (layout) =>
      setObjectPlacement(layout, icon, {
        surface: 'frame',
        edge: 'top',
        position: 0,
      }),
    view,
  )
  const renamed = updateSceneWorkspace(
    attached,
    (current) => ({
      ...current,
      items: current.items.map((item) => ({
        ...item,
        title: 'Notebook',
        x: 99,
        y: 88,
        peekOrigin: { x: 1, y: 2 },
      })),
    }),
    view,
  )
  assert.equal(renamed.items[0].title, 'Notebook')
  assert.deepEqual(renamed.items[0].location, {
    surface: 'frame',
    edge: 'top',
    position: 0,
  })
})

test('removing grouped artwork removes its membership and preserves the remaining attachment', () => {
  const initial = createScene(workspace, defaults)
  const grouped = updateSceneLayout(
    initial,
    (layout) =>
      mergeFrameTargets(layout, drawing, { kind: 'widget', id: 'apps' }),
    view,
  )
  const removed = updateSceneWorkspace(
    grouped,
    (current) => ({ ...current, drawings: [] }),
    view,
  )
  assert.equal(removed.drawings.length, 0)
  assert.deepEqual(removed.layout.groups, {})
  assert.deepEqual(removed.layout.placements['widget:apps'], {
    surface: 'frame',
    edge: 'bottom',
    position: 1,
  })
})

test('equivalent workspace and layout updates retain scene identity', () => {
  const scene = createScene(workspace, defaults)
  assert.equal(
    updateSceneWorkspace(scene, (current) => ({ ...current }), view),
    scene,
  )
  assert.equal(
    updateSceneLayout(
      scene,
      (layout) => ({ ...layout, placements: { ...layout.placements } }),
      view,
    ),
    scene,
  )
  assert.equal(
    updateSceneWorkspace(scene, (current) => current, view),
    scene,
  )
})

test('canvas controls keep one layout position while repeated peeks retain their first home', () => {
  const battery = { kind: 'widget', id: 'battery' } as const
  const layout = setObjectPlacement(defaults, battery, {
    surface: 'canvas',
    x: 150,
    y: 150,
    width: 54,
    height: 54,
  })
  const initial = createScene({ ...workspace, items: [], drawings: [] }, layout)
  const settle = (current: typeof initial) =>
    updateSceneWorkspace(
      current,
      (canvas) =>
        transformCanvasWorkspace(
          canvas,
          projectScene(current, view).layout,
          settleCoveredItems,
        ),
      view,
    )
  const first = settle(initial)
  const firstControl = projectScene(first, view).workspace.controls![0]
  assert.notEqual(firstControl.y, 150)
  assert.deepEqual(firstControl.peekOrigin, { x: 150, y: 150 })
  const coveredAgain = updateSceneWorkspace(
    first,
    (current) => ({
      ...current,
      windows: [
        ...current.windows,
        {
          ...current.windows[0],
          id: 'second',
          x: firstControl.x - 10,
          y: firstControl.y - 10,
        },
      ],
    }),
    view,
  )
  const second = settle(coveredAgain)
  const secondControl = projectScene(second, view).workspace.controls![0]
  assert.notDeepEqual(
    { x: secondControl.x, y: secondControl.y },
    { x: firstControl.x, y: firstControl.y },
  )
  assert.deepEqual(secondControl.peekOrigin, { x: 150, y: 150 })
  assert.equal('controls' in second.workspace, false)
  assert.deepEqual(second.layout.placements['widget:battery'], {
    surface: 'canvas',
    x: secondControl.x,
    y: secondControl.y,
    width: 54,
    height: 54,
    peekOrigin: { x: 150, y: 150 },
  })
  const restored = updateSceneWorkspace(
    second,
    (current) => restoreBackgroundItems({ ...current, windows: [] }),
    view,
  )
  assert.deepEqual(restored.layout.placements['widget:battery'], {
    surface: 'canvas',
    x: 150,
    y: 150,
    width: 54,
    height: 54,
  })
})

test('direct control movement establishes a new home and layout edits remain authoritative', () => {
  const target = { kind: 'widget', id: 'battery' } as const
  const initial = createScene(
    workspace,
    setObjectPlacement(defaults, target, {
      surface: 'canvas',
      x: 100,
      y: 80,
      width: 64,
      height: 54,
      peekOrigin: { x: 150, y: 150 },
    }),
  )
  const dragged = updateSceneWorkspace(
    initial,
    (current) => ({
      ...current,
      controls: current.controls?.map((control) => ({
        ...control,
        x: 900,
        y: 700,
        peekOrigin: undefined,
      })),
    }),
    view,
  )
  assert.deepEqual(dragged.layout.placements['widget:battery'], {
    surface: 'canvas',
    x: 900,
    y: 700,
    width: 64,
    height: 54,
  })
  const resized = updateSceneLayout(
    dragged,
    (layout) =>
      setObjectPlacement(layout, target, {
        surface: 'canvas',
        x: 920,
        y: 720,
        width: 110,
        height: 54,
      }),
    view,
  )
  assert.deepEqual(projectScene(resized, view).workspace.controls![0], {
    id: 'battery',
    surface: 'canvas',
    x: 920,
    y: 720,
    width: 110,
    height: 54,
  })
  const attached = updateSceneLayout(
    resized,
    (layout) =>
      setObjectPlacement(layout, target, {
        surface: 'frame',
        edge: 'right',
        position: 0.5,
      }),
    view,
  )
  assert.deepEqual(projectScene(attached, view).workspace.controls, [])
  assert.deepEqual(attached.layout.placements['widget:battery'], {
    surface: 'frame',
    edge: 'right',
    position: 0.5,
  })
})
