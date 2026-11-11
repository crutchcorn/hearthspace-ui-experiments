import preview from '../../../../.storybook/preview'
import PlacedWidget from './placed-widget'
import { fn } from 'storybook/test'
import { viewport, systemStatus } from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'
import SystemBar from './system-bar'

const meta = preview.meta({
  title: 'Desktop/Frame/Placed Widget',
  component: PlacedWidget,
  args: {
    canvasHost: null,
    dragHost: null,
    popoverHost: null,
    id: 'clock',
    placement: { surface: 'frame', edge: 'top', position: 0.5 },
    view: viewport,
    editing: false,
    selected: false,
    draggingWidget: null,
    children: (
      <SystemBar
        id="clock"
        status={systemStatus}
        openPanel={null}
        expanded
        clockDateFormat="none"
        onPanelChange={fn()}
        onLock={fn()}
      />
    ),
  },
  decorators: [
    (Story) => (
      <CanvasSample>
        <Story />
      </CanvasSample>
    ),
  ],
})

export const Attached = meta.story({})

export const Selected = meta.story({ args: { editing: true, selected: true } })
