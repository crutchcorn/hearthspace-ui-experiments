import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'
import { createWorkspace } from '../src/desktop.ts'
import {
  getPlacement,
  getTargetGroup,
  mergeFrameTargets,
  readFrameLayout,
  setObjectPlacement,
} from '../src/frame-layout.ts'
import { createScene, projectScene, updateSceneLayout } from '../src/scene.ts'
import {
  loadScene,
  saveScene,
  SCENE_STORAGE_KEY,
} from '../src/scene-storage.ts'
import { transformCanvasWorkspace } from '../src/layout-workspace.ts'
import { restoreBackgroundItems } from '../src/peek-layout.ts'
import {
  getLayoutItemOptions,
  setLayoutItemOptions,
} from '../src/layout-item-options.ts'

const storage = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
})
beforeEach(() => storage.clear())

test('old split saves are ignored instead of migrated into the scene', () => {
  const oldWorkspace = createWorkspace()
  oldWorkspace.note = 'old split save'
  storage.set('hearthspace-playground-v1', JSON.stringify(oldWorkspace))
  storage.set(
    'hearthspace-frame-layout-v1',
    JSON.stringify({ placements: { 'widget:apps': { surface: 'hidden' } } }),
  )
  const fresh = loadScene()
  assert.notEqual(fresh.workspace.note, 'old split save')
  assert.notEqual(fresh.layout.placements['widget:apps']?.surface, 'hidden')
})

test('one save retains frame attachments without dormant canvas coordinates', () => {
  const workspace = createWorkspace()
  workspace.items[0].peekOrigin = { x: 200, y: 300 }
  const layout = setObjectPlacement(
    readFrameLayout(undefined),
    { kind: 'item', id: workspace.items[0].id },
    { surface: 'frame', edge: 'left', position: 0.4 },
  )
  const scene = createScene(workspace, layout)
  saveScene(scene)
  const saved = JSON.parse(storage.get(SCENE_STORAGE_KEY)!)
  assert.equal('x' in saved.items[0], false)
  assert.equal('y' in saved.items[0], false)
  assert.equal('peekOrigin' in saved.items[0], false)
  assert.deepEqual(saved.items[0].location, {
    surface: 'frame',
    edge: 'left',
    position: 0.4,
  })
  assert.equal('item:projects' in saved.layout.placements, false)
  assert.deepEqual(loadScene().items[0], scene.items[0])
})

test('canvas drawings and icons retain their original peek homes through a reload', () => {
  const workspace = createWorkspace()
  const item = workspace.items[0]
  item.peekOrigin = { x: item.x, y: item.y }
  item.x += 100
  workspace.drawings = [
    {
      id: 'ink',
      x: item.x + 200,
      y: item.y,
      width: 80,
      height: 40,
      layer: 'above',
      strokes: [
        [
          { x: 4, y: 4 },
          { x: 70, y: 30 },
        ],
      ],
      peekOrigin: { x: item.x + 100, y: item.y },
    },
  ]
  const scene = createScene(workspace, readFrameLayout(undefined))
  saveScene(scene)
  const loaded = loadScene()
  assert.deepEqual(loaded.items[0], scene.items[0])
  assert.deepEqual(loaded.drawings[0], scene.drawings[0])
  const projected = projectScene(loaded, {
    ...workspace.home,
    width: 960,
    height: 720,
  })
  assert.deepEqual(
    projected.workspace.drawings[0].peekOrigin,
    workspace.drawings[0].peekOrigin,
  )
})

test('unreadable or invalid locations reset the scene safely', () => {
  storage.set(SCENE_STORAGE_KEY, '{unfinished')
  assert.ok(loadScene().items.length)
  const scene = createScene(createWorkspace(), readFrameLayout(undefined))
  for (const location of [
    { surface: 'group', groupId: 'missing' },
    { surface: 'group', groupId: 'system' },
    { surface: 'frame', edge: 'left', position: 2 },
  ]) {
    const invalid = JSON.parse(JSON.stringify(scene))
    invalid.items[0].location = location
    storage.set(SCENE_STORAGE_KEY, JSON.stringify(invalid))
    assert.equal(loadScene().items[0].location.surface, 'background')
  }
})

test('detached controls retain measured bounds and their first home across reload', () => {
  const workspace = createWorkspace()
  const layout = setObjectPlacement(
    readFrameLayout(undefined),
    { kind: 'widget', id: 'battery' },
    {
      surface: 'canvas',
      x: 400,
      y: 300,
      width: 104,
      height: 54,
      peekOrigin: { x: 200, y: 200 },
    },
  )
  saveScene(createScene({ ...workspace, windows: [], items: [] }, layout))
  const loaded = loadScene()
  const projection = projectScene(loaded, {
    ...workspace.home,
    width: 960,
    height: 720,
  })
  assert.deepEqual(projection.workspace.controls, [
    {
      id: 'battery',
      surface: 'canvas',
      x: 400,
      y: 300,
      width: 104,
      height: 54,
      peekOrigin: { x: 200, y: 200 },
    },
  ])
  const restored = createScene(
    transformCanvasWorkspace(
      projection.workspace,
      projection.layout,
      restoreBackgroundItems,
    ),
    projection.layout,
  )
  assert.deepEqual(restored.layout.placements['widget:battery'], {
    surface: 'canvas',
    x: 200,
    y: 200,
    width: 104,
    height: 54,
  })
  assert.equal(
    'controls' in JSON.parse(storage.get(SCENE_STORAGE_KEY)!).workspace,
    false,
  )
})

test('clock date format survives grouping, detaching, and saved-scene reloads', () => {
  const workspace = createWorkspace()
  const clock = { kind: 'widget', id: 'clock' } as const
  const configured = setLayoutItemOptions(
    readFrameLayout(undefined),
    'widget:clock',
    { dateFormat: 'long' },
  )
  const grouped = mergeFrameTargets(configured, clock, {
    kind: 'widget',
    id: 'apps',
  })
  saveScene(createScene(workspace, grouped))
  const loaded = loadScene()
  assert.deepEqual(getLayoutItemOptions(loaded.layout, 'widget:clock'), {
    dateFormat: 'long',
  })
  assert.ok(
    getTargetGroup(loaded.layout, clock)?.members.some(
      (member) => member.kind === 'widget' && member.id === 'apps',
    ),
  )

  const detached = updateSceneLayout(
    loaded,
    (layout) =>
      setObjectPlacement(layout, clock, { surface: 'canvas', x: 600, y: 500 }),
    { ...workspace.home, width: 960, height: 720 },
  )
  saveScene(detached)
  const returned = loadScene()
  assert.equal(getTargetGroup(returned.layout, clock), undefined)
  assert.equal(getPlacement(returned.layout, clock).surface, 'canvas')
  assert.deepEqual(getLayoutItemOptions(returned.layout, 'widget:clock'), {
    dateFormat: 'long',
  })
})
