import { createContext, type CSSProperties } from 'react'
import type { FrameEdge } from '../frame-layout'

export const WidgetPopoverContext = createContext<{
  id: string
  host: HTMLElement | null
  edge?: FrameEdge
  style: CSSProperties
} | null>(null)
