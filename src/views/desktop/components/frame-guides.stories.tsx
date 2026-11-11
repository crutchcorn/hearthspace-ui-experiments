import preview from '../../../../.storybook/preview'
import FrameGuides from './frame-guides'
import { viewport } from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Frame/Placement Guides',
  component: FrameGuides,
  args: { viewport, target: { zone: 'top' }, layer: 'outline' },
  decorators: [
    (Story) => (
      <CanvasSample>
        <Story />
      </CanvasSample>
    ),
  ],
})

export const TopEdge = meta.story({})

export const BottomRight = meta.story({
  args: { target: { zone: 'bottom-right' } },
})

export const CanvasFill = meta.story({ args: { layer: 'fill' } })
