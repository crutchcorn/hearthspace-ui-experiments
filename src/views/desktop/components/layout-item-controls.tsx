import type { ReactNode } from 'react'
import { targetKey, type LayoutTarget } from '../utils/frame-layout'

interface LayoutItemControlsProps {
  target: LayoutTarget | null
  controls: Readonly<Record<string, ReactNode>>
}

/** Each item supplies its own controls without teaching the editor its UI. */
export default function LayoutItemControls({
  target,
  controls,
}: LayoutItemControlsProps) {
  return target ? <>{controls[targetKey(target)]}</> : null
}
