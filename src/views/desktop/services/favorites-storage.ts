import {
  DEFAULT_FAVORITE_APP_IDS,
  normalizeFavoriteApps,
} from '../utils/favorites.ts'

const FAVORITES_STORAGE_KEY = 'hearthspace-favorite-apps-v1'

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
