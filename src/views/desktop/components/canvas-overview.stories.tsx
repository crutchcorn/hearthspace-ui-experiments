import preview from '../../../../.storybook/preview'
import CanvasOverview from './canvas-overview'
import { fn } from 'storybook/test'
import { viewport, workspace } from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Canvas/Overview',
  component: CanvasOverview,
  args: { workspace, view: viewport, onNavigate: fn() },
  decorators: [
    (Story) => (
      <CanvasSample>
        <Story />
      </CanvasSample>
    ),
  ],
})

export const OverviewPanel = meta.story({})
