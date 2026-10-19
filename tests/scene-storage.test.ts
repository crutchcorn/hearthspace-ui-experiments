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
  readScene,
  saveScene,
  SCENE_STORAGE_KEY,
} from '../src/scene-storage.ts'
import { transformCanvasWorkspace } from '../src/layout-workspace.ts'
import { restoreBackgroundItems } from '../src/peek-layout.ts'
import {
  getLayoutItemOptions,
  setLayoutItemOptions,
} from '../src/layout-item-options.ts'
import { APP_CATALOG } from '../src/components/launcher-apps.ts'
import { MAX_DRAWING_STROKES } from '../src/drawings.ts'
import type { Scene } from '../src/scene.ts'

const storage = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  },
})
beforeEach(() => storage.clear())

function freshScene() {
  return createScene(createWorkspace(), readFrameLayout(undefined))
}

const drawing: Scene['drawings'][number] = {
  id: 'ink',
  width: 100,
  height: 80,
  location: { surface: 'background', x: 100, y: 200 },
  strokes: [
    [
      { x: 4, y: 4 },
      { x: 96, y: 76 },
    ],
  ],
}

test('the previous scene format resets without changing separate preferences', () => {
  const previous = freshScene()
  previous.workspace.note = 'Previous scene format'
  storage.set('hearthspace-scene-v2', JSON.stringify(previous))
  storage.set('hearthspace-accent-v1', 'teal')
  assert.notEqual(loadScene().workspace.note, previous.workspace.note)
  assert.equal(storage.get('hearthspace-accent-v1'), 'teal')
})

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

test('direct scene loading preserves freeform pinned artwork without projecting it into the canvas', () => {
  const scene = freshScene()
  scene.workspace.home = {
    x: scene.workspace.width - 100,
    y: scene.workspace.height - 100,
  }
  scene.drawings = [
    {
      ...drawing,
      width: 1200,
      height: 900,
      location: { surface: 'pinned', x: 320, y: 240 },
    },
  ]
  const original = structuredClone(scene)
  const loaded = readScene(scene)
  assert.deepEqual(loaded.drawings, scene.drawings)
  assert.deepEqual(loaded.workspace.home, scene.workspace.home)
  assert.deepEqual(scene, original)
  assert.deepEqual(readScene(JSON.parse(JSON.stringify(loaded))), loaded)
})

test('reading the same scene is independent of the current browser viewport', () => {
  const scene = freshScene()
  scene.items = scene.items.slice(0, 1)
  scene.drawings = [
    { ...drawing, location: { surface: 'pinned', x: 840, y: 50 } },
  ]
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
  try {
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { innerWidth: 1000, innerHeight: 800 },
    })
    const narrow = readScene(scene)
    Object.defineProperty(globalThis, 'window', {
      configurable: true,
      value: { innerWidth: 2400, innerHeight: 1600 },
    })
    assert.deepEqual(readScene(scene), narrow)
  } finally {
    if (originalWindow)
      Object.defineProperty(globalThis, 'window', originalWindow)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

test('blocked storage leaves scene loading and saving usable', () => {
  const originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    'localStorage',
  )!
  try {
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error('Storage unavailable')
        },
        setItem: () => {
          throw new Error('Storage unavailable')
        },
      },
    })
    assert.deepEqual(loadScene(), freshScene())
    assert.doesNotThrow(() => saveScene(freshScene()))
  } finally {
    Object.defineProperty(globalThis, 'localStorage', originalStorage)
  }
})

test('invalid workspace headers create a fresh scene', () => {
  const scene = freshScene()
  for (const input of [
    undefined,
    null,
    [],
    {},
    { ...scene, workspace: { ...scene.workspace, width: Infinity } },
    { ...scene, workspace: { ...scene.workspace, height: 0 } },
    { ...scene, workspace: { ...scene.workspace, home: { x: 0, y: NaN } } },
    { ...scene, workspace: { ...scene.workspace, note: null } },
    { ...scene, workspace: { ...scene.workspace, windows: {} } },
    { ...scene, items: null },
    { ...scene, drawings: {} },
  ])
    assert.deepEqual(readScene(input), freshScene())
})

test('malformed windows do not discard neighboring windows or edited notes', () => {
  const scene = freshScene()
  const valid = { ...scene.workspace.windows[0], appId: 'notes', dockOrder: 0 }
  scene.workspace.note = 'Keep my edited note.'
  const loaded = readScene({
    ...scene,
    workspace: {
      ...scene.workspace,
      windows: [
        { ...valid, id: 'invalid-kind', kind: 'unknown' },
        { ...valid, id: 'invalid-position', x: Infinity },
        valid,
        { ...valid, title: 'Duplicate identifier' },
      ],
    },
  })
  assert.deepEqual(loaded.workspace.windows, [valid])
  assert.equal(loaded.workspace.note, scene.workspace.note)
  assert.deepEqual(loaded.items, scene.items)
})

test('window bounds are clamped and temporary maximization restores its saved size', () => {
  const scene = freshScene()
  const window = scene.workspace.windows[0]
  const loaded = readScene({
    ...scene,
    workspace: {
      ...scene.workspace,
      windows: [
        { ...window, x: -100, y: 9000, width: 20, height: 9000 },
        {
          ...window,
          id: 'enlarged',
          restore: { x: 200, y: 300, width: 400, height: 350 },
        },
      ],
    },
  })
  assert.deepEqual(loaded.workspace.windows[0], {
    ...window,
    dockOrder: undefined,
    x: 0,
    y: 0,
    width: 280,
    height: scene.workspace.height,
  })
  assert.deepEqual(loaded.workspace.windows[1], {
    ...window,
    id: 'enlarged',
    dockOrder: undefined,
    x: 200,
    y: 300,
    width: 400,
    height: 350,
  })
})

test('loading keeps one shortcut per catalog app and repairs missing shortcuts without ID collisions', () => {
  const scene = freshScene()
  const browser = scene.items.find((item) => item.appId === 'browser')!
  const folder = { ...scene.items[0], id: 'notes-shortcut' }
  const loaded = readScene({
    ...scene,
    items: [
      folder,
      {
        ...browser,
        location: { surface: 'frame', edge: 'left', position: 0.4 },
      },
      { ...browser, id: 'browser-duplicate' },
      { ...browser, id: 'unknown-app', appId: 'uninstalled' },
      { ...browser, id: 'invalid-title', title: '' },
      {
        ...browser,
        id: 'invalid-location',
        location: { surface: 'foreground', x: 10, y: 10 },
      },
    ],
  })
  assert.equal(loaded.items[0].id, folder.id)
  assert.deepEqual(
    loaded.items.find((item) => item.id === browser.id)?.location,
    { surface: 'frame', edge: 'left', position: 0.4 },
  )
  assert.deepEqual(
    loaded.items
      .filter((item) => item.kind === 'app')
      .map((item) => item.appId)
      .sort(),
    APP_CATALOG.map((app) => app.id).sort(),
  )
  assert.equal(
    new Set(loaded.items.map((item) => item.id)).size,
    loaded.items.length,
  )
  assert.equal(
    loaded.items.find((item) => item.kind === 'app' && item.appId === 'notes')
      ?.id,
    'notes-shortcut-2',
  )
})

test('invalid peek homes are discarded while icons and artwork remain intact', () => {
  const scene = freshScene()
  const item = scene.items[0]
  for (const peekOrigin of [
    null,
    '100,200',
    {},
    { x: 100, y: '200' },
    { x: Infinity, y: 200 },
    { x: 100, y: NaN },
    { x: -1, y: 200 },
    { x: 100, y: -1 },
    { x: scene.workspace.width, y: 200 },
    { x: 100, y: scene.workspace.height },
  ]) {
    const loaded = readScene({
      ...scene,
      items: [{ ...item, location: { ...item.location, peekOrigin } }],
      drawings: [{ ...drawing, location: { ...drawing.location, peekOrigin } }],
    })
    assert.deepEqual(loaded.items[0], item)
    assert.deepEqual(loaded.drawings, [drawing])
  }
})

test('both canvas drawing layers keep first homes at the world boundary', () => {
  const scene = freshScene()
  const peekOrigin = {
    x: scene.workspace.width - drawing.width,
    y: scene.workspace.height - drawing.height,
  }
  scene.drawings = [
    {
      ...drawing,
      location: { surface: 'background', x: 400, y: 500, peekOrigin },
    },
    {
      ...drawing,
      id: 'raised-ink',
      location: { surface: 'canvas', x: 800, y: 900, peekOrigin },
    },
  ]
  assert.deepEqual(
    readScene(JSON.parse(JSON.stringify(scene))).drawings,
    scene.drawings,
  )
})

test('invalid drawing records and stroke data leave valid neighboring artwork intact', () => {
  const scene = freshScene()
  const invalid = [
    {
      ...drawing,
      id: 'bad-position',
      location: { surface: 'canvas', x: NaN, y: 0 },
    },
    { ...drawing, id: 'zero-size', width: 0 },
    { ...drawing, id: 'oversized', width: scene.workspace.width + 1 },
    { ...drawing, id: 'empty', strokes: [] },
    { ...drawing, id: 'empty-stroke', strokes: [[]] },
    { ...drawing, id: 'outside-mark', strokes: [[{ x: 101, y: 0 }]] },
    { ...drawing, id: 'negative-mark', strokes: [[{ x: -1, y: 0 }]] },
    { ...drawing, id: 'invalid-mark', strokes: [[{ x: 5, y: Infinity }]] },
    {
      ...drawing,
      id: 'too-many-strokes',
      strokes: Array(MAX_DRAWING_STROKES + 1).fill([{ x: 4, y: 4 }]),
    },
    {
      ...drawing,
      id: 'too-many-points',
      strokes: [Array(4097).fill({ x: 4, y: 4 })],
    },
  ]
  assert.deepEqual(
    readScene({ ...scene, drawings: [...invalid, drawing, drawing] }).drawings,
    [drawing],
  )
  const many = Array.from({ length: 205 }, (_, index) => ({
    ...drawing,
    id: `ink-${index}`,
  }))
  assert.deepEqual(readScene({ ...scene, drawings: many }).drawings, many)
})

test('groups retain valid members and release a lone survivor onto the same frame edge', () => {
  const workspace = createWorkspace()
  let layout = setObjectPlacement(
    readFrameLayout(undefined),
    { kind: 'item', id: workspace.items[0].id },
    { surface: 'frame', edge: 'left', position: 0.4 },
  )
  layout = mergeFrameTargets(
    layout,
    { kind: 'window', id: workspace.windows[0].id },
    { kind: 'item', id: workspace.items[0].id },
  )
  const scene = createScene(workspace, layout)
  const group = getTargetGroup(layout, {
    kind: 'item',
    id: workspace.items[0].id,
  })!
  assert.deepEqual(readScene(scene).layout.groups?.[group.id], group)

  const loaded = readScene({
    ...scene,
    workspace: { ...scene.workspace, windows: [] },
  })
  assert.equal(loaded.layout.groups?.[group.id], undefined)
  assert.deepEqual(loaded.items[0].location, {
    surface: 'frame',
    edge: 'left',
    position: 0.4,
  })
  assert.equal(
    `item:${workspace.items[0].id}` in loaded.layout.placements,
    false,
  )
  assert.equal(`group:${group.id}` in loaded.layout.placements, false)
})

test('saved drawing frame attachments and groups are rejected', () => {
  const scene = freshScene()
  const placement = { surface: 'frame', edge: 'left', position: 0.4 } as const
  scene.drawings = [
    { ...drawing, location: { surface: 'group', groupId: 'art' } },
    { ...drawing, id: 'edge', location: placement },
  ]
  scene.layout = {
    ...scene.layout,
    groups: {
      art: { id: 'art', members: [{ kind: 'drawing', id: drawing.id }] },
    },
    placements: { 'group:art': placement },
  }

  const loaded = readScene(scene)

  assert.deepEqual(loaded.drawings, [])
  assert.deepEqual(loaded.layout.groups, {})
  assert.equal('drawing:ink' in loaded.layout.placements, false)
  assert.equal('group:art' in loaded.layout.placements, false)
})

test('a file survives when its other frame group member is invalid', () => {
  const scene = freshScene()
  const file = scene.items.find((item) => item.kind === 'file')!
  const placement = { surface: 'frame', edge: 'bottom', position: 0.6 } as const
  file.location = { surface: 'group', groupId: 'files' }
  scene.layout = {
    ...scene.layout,
    groups: {
      files: {
        id: 'files',
        members: [
          { kind: 'item', id: file.id },
          { kind: 'widget', id: 'unknown-widget' },
        ],
      },
    },
    placements: { 'group:files': placement },
  }

  const loaded = readScene(scene)

  assert.deepEqual(
    loaded.items.find((item) => item.id === file.id),
    {
      ...file,
      location: placement,
    },
  )
  assert.deepEqual(loaded.layout.groups, {})
  assert.equal(`item:${file.id}` in loaded.layout.placements, false)
  assert.equal('group:files' in loaded.layout.placements, false)
})

test('pinned drawing coordinates round-trip without a canvas home or frame membership', () => {
  const scene = freshScene()
  scene.drawings = [
    { ...drawing, location: { surface: 'pinned', x: -20, y: 180 } },
  ]
  saveScene(scene)
  const saved = JSON.parse(storage.get(SCENE_STORAGE_KEY)!)
  assert.deepEqual(saved.drawings, scene.drawings)
  const loaded = loadScene()
  assert.deepEqual(loaded.drawings, scene.drawings)
  assert.deepEqual(loaded.layout, scene.layout)
  assert.equal('drawing:ink' in loaded.layout.placements, false)
})

test('pinned locations are invalid for files and invalid drawing anchors are discarded', () => {
  const scene = freshScene()
  const file = scene.items.find((item) => item.kind === 'file')!
  file.location = { surface: 'pinned', x: 10, y: 20 }
  scene.drawings = [
    { ...drawing, location: { surface: 'pinned', x: NaN, y: 20 } },
    { ...drawing, id: 'valid', location: { surface: 'pinned', x: 10, y: 20 } },
  ]
  const loaded = readScene(scene)
  assert.equal(
    loaded.items.some((item) => item.id === file.id),
    false,
  )
  assert.deepEqual(loaded.drawings, [scene.drawings[1]])
})
