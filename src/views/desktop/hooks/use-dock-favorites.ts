import { useEffect, useRef, useState } from 'react'
import {
  loadFavoriteApps,
  saveFavoriteApps,
} from '../services/favorites-storage'
import type { DesktopItem } from '../types/desktop'
import { addFavoriteApp } from '../utils/favorites'

export function useDockFavorites(items: DesktopItem[]) {
  const launcherTrigger = useRef<HTMLButtonElement>(null)
  const [favoriteAppIds, setFavoriteAppIds] = useState(loadFavoriteApps)
  const [favoriteDropActive, setFavoriteDropActive] = useState(false)
  const [justFavoritedAppId, setJustFavoritedAppId] = useState<string | null>(
    null,
  )
  const [returningFavoriteIds, setReturningFavoriteIds] = useState<string[]>([])
  const favoriteTimer = useRef<number | undefined>(undefined)
  useEffect(() => saveFavoriteApps(favoriteAppIds), [favoriteAppIds])
  useEffect(() => () => window.clearTimeout(favoriteTimer.current), [])

  function isFavoriteDrop(itemId: string | null, x: number, y: number) {
    const item = items.find((item) => item.id === itemId)
    if (item?.kind !== 'app') return false
    const target = launcherTrigger.current
    if (!target || target.closest('[hidden]')) return false
    const bounds = target.getBoundingClientRect()
    return (
      bounds.width > 0 &&
      x >= bounds.left - 10 &&
      x <= bounds.right + 10 &&
      y >= bounds.top - 10 &&
      y <= bounds.bottom + 10
    )
  }

  function hoverFavoriteDrop(itemId: string | null, x: number, y: number) {
    const active = isFavoriteDrop(itemId, x, y)
    setFavoriteDropActive(active)
    return active
  }

  function dropFavorite(itemId: string, x: number, y: number) {
    if (!isFavoriteDrop(itemId, x, y)) return false
    const item = items.find((item) => item.id === itemId)!
    setFavoriteAppIds((current) => addFavoriteApp(current, item.appId))
    setJustFavoritedAppId(item.appId)
    setReturningFavoriteIds([itemId])
    setFavoriteDropActive(false)
    window.clearTimeout(favoriteTimer.current)
    favoriteTimer.current = window.setTimeout(() => {
      setJustFavoritedAppId(null)
      setReturningFavoriteIds([])
    }, 700)
    return true
  }

  return {
    launcherTrigger,
    favoriteAppIds,
    favoriteDropActive,
    setFavoriteDropActive,
    justFavoritedAppId,
    returningFavoriteIds,
    isFavoriteDrop,
    hoverFavoriteDrop,
    dropFavorite,
  }
}
