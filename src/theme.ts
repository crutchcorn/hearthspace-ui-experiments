export const ACCENT_THEMES = [
  { id: 'orange', name: 'Orange', color: '#e9642a' },
  { id: 'rose', name: 'Rose', color: '#b74e69' },
  { id: 'violet', name: 'Violet', color: '#7957b5' },
  { id: 'blue', name: 'Blue', color: '#3672b5' },
  { id: 'teal', name: 'Teal', color: '#237e78' },
  { id: 'olive', name: 'Olive', color: '#6f7b38' },
] as const

export type AccentThemeId = (typeof ACCENT_THEMES)[number]['id']
export type AppPresentation = 'ideal' | 'realistic'
export type ColorMode = 'light' | 'dark'

const ACCENT_STORAGE_KEY = 'hearthspace-accent-v1'
const APP_PRESENTATION_STORAGE_KEY = 'hearthspace-app-presentation-v1'
const BATTERY_PERCENTAGE_STORAGE_KEY = 'hearthspace-battery-percentage-v1'
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

export function loadAppPresentation(): AppPresentation {
  try {
    return localStorage.getItem(APP_PRESENTATION_STORAGE_KEY) === 'realistic'
      ? 'realistic'
      : 'ideal'
  } catch {
    return 'ideal'
  }
}

export function saveAppPresentation(presentation: AppPresentation) {
  try {
    localStorage.setItem(APP_PRESENTATION_STORAGE_KEY, presentation)
  } catch {
    // Keep the selected presentation for this session if storage is unavailable.
  }
}

export function loadShowBatteryPercentage(): boolean {
  try {
    return localStorage.getItem(BATTERY_PERCENTAGE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveShowBatteryPercentage(show: boolean) {
  try {
    localStorage.setItem(BATTERY_PERCENTAGE_STORAGE_KEY, String(show))
  } catch {
    // Keep the selected tray preference for this session if storage is unavailable.
  }
}
