import type { ComponentType, Dispatch, SetStateAction } from 'react'
import { targetKey, type FrameLayout, type LayoutTarget } from '../frame-layout'
import ClockLayoutControls from './ClockLayoutControls'

interface ItemControlsProps {
  target: LayoutTarget
  layout: FrameLayout
  onChange: Dispatch<SetStateAction<FrameLayout>>
  now: Date
}

const itemControls: Record<
  string,
  ComponentType<ItemControlsProps> | undefined
> = {
  'widget:clock': ClockLayoutControls,
}

interface LayoutItemControlsProps extends Omit<ItemControlsProps, 'target'> {
  target: LayoutTarget | null
}

/** Each item supplies its own controls without teaching the editor its UI. */
export default function LayoutItemControls({
  target,
  ...props
}: LayoutItemControlsProps) {
  if (!target) return null
  const Controls = itemControls[targetKey(target)]
  return Controls ? <Controls {...props} target={target} /> : null
}
