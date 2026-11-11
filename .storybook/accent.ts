import { ACCENT_THEMES } from '../src/views/desktop/constants/theme'

export const defaultAccent = ACCENT_THEMES[0]

export function getStoryAccent(name: string | undefined) {
  return ACCENT_THEMES.find((accent) => accent.name === name) ?? defaultAccent
}
