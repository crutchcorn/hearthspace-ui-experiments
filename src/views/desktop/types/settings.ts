export type SettingsCategory =
  'appearance' | 'displays' | 'background' | 'gestures' | 'ai' | 'system'

export type SettingsNavigationRequest = {
  id: string
  category: SettingsCategory
}
