import { createContext, type CSSProperties } from 'react'

export const WidgetPopoverContext = createContext<{
  id: string
  host: HTMLElement | null
  style: CSSProperties
} | null>(null)
