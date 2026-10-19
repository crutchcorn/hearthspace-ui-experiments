import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  createWorkspace,
  readWorkspace,
  type Workspace,
} from '../src/desktop.ts'

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
before(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { innerWidth: 1000, innerHeight: 800 },
  })
})

after(() => {
  if (originalWindow)
    Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
})

const item = {
  id: 'project-folder',
  title: 'Projects',
  kind: 'folder' as const,
  appId: 'files',
  x: 200,
  y: 300,
  width: 88,
  height: 96,
}
const workspace: Workspace = {
  width: 10000,
  height: 8000,
  home: { x: 100, y: 100 },
  windows: [],
  items: [item],
  drawings: [],
  note: '',
}

test('a saved desktop shortcut retains both its peek and home positions', () => {
  const peeking = { ...item, peekOrigin: { x: 420, y: 500 } }
  const loaded = readWorkspace({ ...workspace, items: [peeking] })
  assert.deepEqual(
    loaded.items.find((saved) => saved.id === item.id),
    peeking,
  )
  assert.deepEqual(
    readWorkspace(JSON.parse(JSON.stringify(loaded))).items.find(
      (saved) => saved.id === item.id,
    ),
    peeking,
  )
})

test('malformed home positions do not discard desktop shortcuts', () => {
  const origins = [
    null,
    '200,300',
    {},
    { x: 200, y: '300' },
    { x: Infinity, y: 300 },
    { x: 200, y: NaN },
    { x: -1, y: 300 },
    { x: 200, y: -1 },
    { x: workspace.width - item.width + 1, y: 300 },
    { x: 200, y: workspace.height - item.height + 1 },
  ]
  for (const peekOrigin of origins) {
    assert.deepEqual(
      readWorkspace({
        ...workspace,
        items: [{ ...item, peekOrigin }],
      }).items.find((saved) => saved.id === item.id),
      item,
    )
  }
})

test('home positions may touch the edge when the complete item remains in bounds', () => {
  const peeking = {
    ...item,
    peekOrigin: {
      x: workspace.width - item.width,
      y: workspace.height - item.height,
    },
  }
  assert.deepEqual(
    readWorkspace({ ...workspace, items: [peeking] }).items.find(
      (saved) => saved.id === item.id,
    ),
    peeking,
  )
})

test('invalid window records do not discard neighboring windows or other work', () => {
  const valid = {
    id: 'notes',
    title: 'Scratchpad',
    kind: 'notes' as const,
    appId: 'notes',
    dockOrder: 0,
    x: 700,
    y: 500,
    width: 350,
    height: 360,
  }
  const loaded = readWorkspace({
    ...workspace,
    note: 'Keep my edited note.',
    windows: [
      { ...valid, id: 'invalid-kind', kind: 'unknown' },
      { ...valid, id: 'invalid-position', x: Infinity },
      valid,
      { ...valid, title: 'Duplicate identifier' },
    ],
  })
  assert.deepEqual(loaded.windows, [valid])
  assert.equal(loaded.note, 'Keep my edited note.')
  assert.deepEqual(
    loaded.items.find((saved) => saved.id === item.id),
    item,
  )
  assert.deepEqual(loaded.home, workspace.home)
  assert.equal(loaded.width, workspace.width)
  assert.equal(loaded.height, workspace.height)
})

test('invalid workspace data creates the current default workspace', () => {
  assert.deepEqual(readWorkspace(undefined), createWorkspace())
  assert.deepEqual(readWorkspace(null), createWorkspace())
  assert.deepEqual(
    readWorkspace({ ...workspace, width: Infinity }),
    createWorkspace(),
  )
})

test('reading a workspace bounds window geometry and retains every installed app shortcut', () => {
  const loaded = readWorkspace({
    ...workspace,
    windows: [
      {
        id: 'notes',
        title: 'Scratchpad',
        kind: 'notes',
        x: -100,
        y: 9000,
        width: 20,
        height: 9000,
      },
    ],
    items: [item],
  })
  assert.deepEqual(loaded.windows[0], {
    id: 'notes',
    title: 'Scratchpad',
    kind: 'notes',
    dockOrder: undefined,
    x: 0,
    y: 0,
    width: 280,
    height: workspace.height,
  })
  assert.deepEqual(
    loaded.items
      .filter((entry) => entry.kind === 'app')
      .map((entry) => entry.appId)
      .sort(),
    createWorkspace()
      .items.filter((entry) => entry.kind === 'app')
      .map((entry) => entry.appId)
      .sort(),
  )
})
