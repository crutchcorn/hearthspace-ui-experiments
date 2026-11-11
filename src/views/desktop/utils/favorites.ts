import { APP_CATALOG } from '../constants/launcher-apps.ts'

export const DEFAULT_FAVORITE_APP_IDS = ['browser', 'files', 'notes']

export function normalizeFavoriteApps(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_FAVORITE_APP_IDS]
  return [...new Set(value)].filter((id): id is string =>
    APP_CATALOG.some((app) => app.id === id),
  )
}

export function addFavoriteApp(ids: string[], appId: string): string[] {
  return normalizeFavoriteApps([...ids, appId])
}
