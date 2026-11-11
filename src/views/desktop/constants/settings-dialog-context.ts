import { createContext } from 'react'

export const SettingsDialogContext = createContext<{
  host: HTMLDivElement | null
  registerDialog: (dialog: HTMLDialogElement) => () => void
} | null>(null)
