import assert from 'node:assert/strict'
import { after, before, beforeEach, test } from 'node:test'
import {
  addFavoriteApp,
  DEFAULT_FAVORITE_APP_IDS,
  loadFavoriteApps,
  saveFavoriteApps,
} from '../src/favorites.ts'

const storageKey = 'hearthspace-favorite-apps-v1'
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

beforeEach(() => storage.clear())

after(() => {
  if (originalStorage)
    Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

test('dropping an app twice keeps one favorite and preserves its position', () => {
  const initial = ['notes', 'browser']
  const withMusic = addFavoriteApp(initial, 'music')
  assert.deepEqual(addFavoriteApp(withMusic, 'notes'), [
    'notes',
    'browser',
    'music',
  ])
  assert.deepEqual(initial, ['notes', 'browser'])
})

test('favorite order survives reload while invalid and duplicate entries are removed', () => {
  storage.set(
    storageKey,
    JSON.stringify(['music', 'removed-app', 'files', 'music', null]),
  )
  const favorites = addFavoriteApp(loadFavoriteApps(), 'settings')
  saveFavoriteApps(favorites)
  assert.deepEqual(loadFavoriteApps(), ['music', 'files', 'settings'])
  assert.deepEqual(addFavoriteApp(favorites, 'removed-app'), favorites)
})

test('an intentionally empty favorites list stays empty after reload', () => {
  saveFavoriteApps([])
  assert.deepEqual(loadFavoriteApps(), [])
})

test('missing or corrupted storage restores the default favorites', () => {
  assert.deepEqual(loadFavoriteApps(), DEFAULT_FAVORITE_APP_IDS)
  storage.set(storageKey, '{')
  assert.deepEqual(loadFavoriteApps(), DEFAULT_FAVORITE_APP_IDS)
  storage.set(storageKey, JSON.stringify({ favorites: ['music'] }))
  assert.deepEqual(loadFavoriteApps(), DEFAULT_FAVORITE_APP_IDS)
})
