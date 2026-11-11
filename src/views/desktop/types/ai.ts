export interface AIControls {
  enabled: boolean
  downloading: boolean
  progress: number
  setEnabled: (enabled: boolean) => void
}
