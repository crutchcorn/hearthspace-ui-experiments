import preview from '../../../../.storybook/preview'
import FramePreviewSlot from './frame-preview-slot'
import { fn } from 'storybook/test'

const meta = preview.meta({
  title: 'Desktop/Frame/Pinned Preview Slot',
  component: FramePreviewSlot,
  args: {
    target: { kind: 'window', id: 'notes' },
    width: 260,
    height: 44,
    onBounds: fn(),
    children: <span style={{ padding: 12, display: 'block' }}>Scratchpad</span>,
  },
})

export const TopEdge = meta.story({})

export const VerticalSlot = meta.story({
  args: { width: 44, height: 180, children: undefined },
})
