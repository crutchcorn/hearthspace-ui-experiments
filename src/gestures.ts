import { APP_CATALOG } from './components/launcher-apps'

export type GesturePoint = { x: number; y: number }
export type GestureShortcut = { appId: string; points: GesturePoint[] }

const STORAGE_KEY = 'hearthspace-gesture-shortcuts-v1'
export const GESTURE_WIDTH = 440
export const GESTURE_HEIGHT = 190
const DEFAULT_SHORTCUTS: GestureShortcut[] = [
  {
    appId: 'browser',
    points: [
      { x: 178, y: 150 },
      { x: 178, y: 40 },
      { x: 215, y: 40 },
      { x: 240, y: 48 },
      { x: 246, y: 64 },
      { x: 238, y: 82 },
      { x: 211, y: 94 },
      { x: 178, y: 94 },
      { x: 218, y: 94 },
      { x: 246, y: 104 },
      { x: 254, y: 122 },
      { x: 245, y: 140 },
      { x: 218, y: 150 },
      { x: 178, y: 150 },
    ],
  },
  {
    appId: 'terminal',
    points: [
      { x: 172, y: 58 },
      { x: 254, y: 58 },
      { x: 180, y: 130 },
      { x: 263, y: 130 },
    ],
  },
  {
    appId: 'notes',
    points: [
      { x: 179, y: 143 },
      { x: 179, y: 46 },
      { x: 256, y: 143 },
      { x: 256, y: 46 },
    ],
  },
]

export function loadGestureShortcuts(): GestureShortcut[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? 'null',
    )
    if (!Array.isArray(stored)) return DEFAULT_SHORTCUTS
    const ids = new Set<string>()
    const valid = stored.filter((item): item is GestureShortcut => {
      if (
        !item ||
        typeof item !== 'object' ||
        !APP_CATALOG.some((app) => app.id === item.appId) ||
        ids.has(item.appId) ||
        !Array.isArray(item.points) ||
        item.points.length < 2 ||
        item.points.length > 2048 ||
        !item.points.every(
          (point: GesturePoint) =>
            point &&
            Number.isFinite(point.x) &&
            Number.isFinite(point.y) &&
            point.x >= 0 &&
            point.x <= GESTURE_WIDTH &&
            point.y >= 0 &&
            point.y <= GESTURE_HEIGHT,
        )
      )
        return false
      ids.add(item.appId)
      return true
    })
    return stored.length === 0 || valid.length ? valid : DEFAULT_SHORTCUTS
  } catch {
    return DEFAULT_SHORTCUTS
  }
}

export function saveGestureShortcuts(shortcuts: GestureShortcut[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(shortcuts))
  } catch {
    // Edits remain available for this session when storage is unavailable.
  }
}
