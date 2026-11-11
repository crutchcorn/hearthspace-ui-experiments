export const ACCENT_THEMES = [
  { id: 'orange', name: 'Orange', color: '#e9642a' },
  { id: 'rose', name: 'Rose', color: '#b74e69' },
  { id: 'violet', name: 'Violet', color: '#7957b5' },
  { id: 'blue', name: 'Blue', color: '#3672b5' },
  { id: 'teal', name: 'Teal', color: '#237e78' },
  { id: 'olive', name: 'Olive', color: '#6f7b38' },
] as const

export type AccentThemeId = (typeof ACCENT_THEMES)[number]['id']
export type ColorMode = 'light' | 'dark'
