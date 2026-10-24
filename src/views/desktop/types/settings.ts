export type SettingsCategory =
  | 'appearance'
  | 'displays'
  | 'background'
  | 'wifi'
  | 'bluetooth'
  | 'gestures'
  | 'ai'
  | 'system'

export type SettingsNavigationRequest = {
  id: string
  category: SettingsCategory
}
