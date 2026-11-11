import {
  ACCENT_THEMES,
  type AccentThemeId,
  type ColorMode,
} from '../constants/theme'

const ACCENT_STORAGE_KEY = 'hearthspace-accent-v1'
const COLOR_MODE_STORAGE_KEY = 'hearthspace-color-mode-v1'

export function loadColorMode(): ColorMode {
  try {
    const saved = localStorage.getItem(COLOR_MODE_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    // Use the system preference if storage is unavailable.
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
}

export function saveColorMode(mode: ColorMode) {
  try {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, mode)
  } catch {
    // Keep the selected color mode for this session if storage is unavailable.
  }
}

export function loadAccentTheme(): AccentThemeId {
  try {
    const saved = localStorage.getItem(ACCENT_STORAGE_KEY)
    return ACCENT_THEMES.find((theme) => theme.id === saved)?.id ?? 'orange'
  } catch {
    return 'orange'
  }
}

export function saveAccentTheme(theme: AccentThemeId) {
  try {
    localStorage.setItem(ACCENT_STORAGE_KEY, theme)
  } catch {
    // Keep the selected accent for this session if storage is unavailable.
  }
}
