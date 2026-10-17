export const ACCENT_THEMES = [
  { id: 'orange', name: 'Orange', color: '#e9642a' },
  { id: 'rose', name: 'Rose', color: '#b74e69' },
  { id: 'violet', name: 'Violet', color: '#7957b5' },
  { id: 'blue', name: 'Blue', color: '#3672b5' },
  { id: 'teal', name: 'Teal', color: '#237e78' },
  { id: 'olive', name: 'Olive', color: '#6f7b38' },
] as const

export type AccentThemeId = (typeof ACCENT_THEMES)[number]['id']

const ACCENT_STORAGE_KEY = 'hearthspace-accent-v1'

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
