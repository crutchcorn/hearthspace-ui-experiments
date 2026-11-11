import { useState } from 'react'
import {
  ACCENT_THEMES,
  type AccentThemeId,
  type ColorMode,
} from '../constants/theme'
import {
  loadGestureShortcuts,
  saveGestureShortcuts,
} from '../services/gestures-storage'
import {
  loadAccentTheme,
  loadColorMode,
  saveAccentTheme,
  saveColorMode,
} from '../services/theme-storage'
import type { GestureShortcut } from '../types/gestures'

export function useDesktopPreferences() {
  const [accentTheme, setAccentTheme] = useState(loadAccentTheme)
  const [colorMode, setColorMode] = useState(loadColorMode)
  const [gestureShortcuts, setGestureShortcuts] = useState(loadGestureShortcuts)
  const accent =
    ACCENT_THEMES.find((theme) => theme.id === accentTheme) ?? ACCENT_THEMES[0]

  function changeAccentTheme(theme: AccentThemeId) {
    setAccentTheme(theme)
    saveAccentTheme(theme)
  }

  function saveGestureShortcut(
    shortcut: GestureShortcut,
    originalAppId?: string,
  ) {
    const next = [
      shortcut,
      ...gestureShortcuts.filter(
        (item) => item.appId !== shortcut.appId && item.appId !== originalAppId,
      ),
    ]
    setGestureShortcuts(next)
    saveGestureShortcuts(next)
  }

  function removeGestureShortcut(appId: string) {
    const next = gestureShortcuts.filter((item) => item.appId !== appId)
    setGestureShortcuts(next)
    saveGestureShortcuts(next)
  }

  function changeColorMode(mode: ColorMode) {
    setColorMode(mode)
    saveColorMode(mode)
  }

  return {
    accentTheme,
    accent,
    colorMode,
    gestureShortcuts,
    changeAccentTheme,
    changeColorMode,
    saveGestureShortcut,
    removeGestureShortcut,
  }
}
