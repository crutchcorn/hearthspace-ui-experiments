import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { loadWorkspace, STORAGE_KEY, type Workspace } from '../src/desktop.ts'

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window')
const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
)
const storage = new Map<string, string>()

before(() => {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { innerWidth: 1000, innerHeight: 800 },
  })
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: { getItem: (key: string) => storage.get(key) ?? null },
  })
})

after(() => {
  if (originalWindow)
    Object.defineProperty(globalThis, 'window', originalWindow)
  else Reflect.deleteProperty(globalThis, 'window')
  if (originalStorage)
    Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
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
  storage.set(STORAGE_KEY, JSON.stringify({ ...workspace, items: [peeking] }))
  const loaded = loadWorkspace()
  assert.deepEqual(
    loaded.items.find((saved) => saved.id === item.id),
    peeking,
  )
  storage.set(STORAGE_KEY, JSON.stringify(loaded))
  assert.deepEqual(
    loadWorkspace().items.find((saved) => saved.id === item.id),
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
    storage.set(
      STORAGE_KEY,
      JSON.stringify({ ...workspace, items: [{ ...item, peekOrigin }] }),
    )
    assert.deepEqual(
      loadWorkspace().items.find((saved) => saved.id === item.id),
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
  storage.set(STORAGE_KEY, JSON.stringify({ ...workspace, items: [peeking] }))
  assert.deepEqual(
    loadWorkspace().items.find((saved) => saved.id === item.id),
    peeking,
  )
})
