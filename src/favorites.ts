import { APP_CATALOG } from './components/launcher-apps.ts'

export const DEFAULT_FAVORITE_APP_IDS = ['browser', 'files', 'notes']

const FAVORITES_STORAGE_KEY = 'hearthspace-favorite-apps-v1'

function normalizeFavoriteApps(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_FAVORITE_APP_IDS]
  return [...new Set(value)].filter((id): id is string =>
    APP_CATALOG.some((app) => app.id === id),
  )
}

export function loadFavoriteApps(): string[] {
  try {
    return normalizeFavoriteApps(
      JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) ?? 'null'),
    )
  } catch {
    return [...DEFAULT_FAVORITE_APP_IDS]
  }
}

export function saveFavoriteApps(ids: string[]): void {
  try {
    localStorage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(normalizeFavoriteApps(ids)),
    )
  } catch {
    // Keep favorites available for this session when storage is unavailable.
  }
}

export function addFavoriteApp(ids: string[], appId: string): string[] {
  return normalizeFavoriteApps([...ids, appId])
}
