import preview from '../../../../.storybook/preview'
import LayoutEditor from './layout-editor'
import { fn } from 'storybook/test'
import { useArgs } from 'storybook/preview-api'
import { clock } from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'
import ClockLayoutControls from './clock-layout-controls'

const meta = preview.meta({
  title: 'Desktop/Frame/Layout Editor',
  component: LayoutEditor,
  args: {
    title: 'Clock',
    target: { kind: 'widget', id: 'clock' },
    placement: { surface: 'frame', edge: 'top', position: 0.5 },
    expanded: true,
    grouped: false,
    onToggleExpanded: fn(),
    onUngroup: fn(),
    onPlacementChange: fn(),
    onFrame: fn(),
    onRemove: fn(),
    onDone: fn(),
    children: (
      <ClockLayoutControls
        now={clock}
        dateFormat="weekday"
        onDateFormatChange={fn()}
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
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <LayoutEditor
        {...args}
        onToggleExpanded={() => {
          args.onToggleExpanded()
          updateArgs({ expanded: !args.expanded })
        }}
        onPlacementChange={(placement) => {
          args.onPlacementChange(placement)
          updateArgs({ placement })
        }}
      />
    )
  },
})

export const FrameClock = meta.story({})

export const GroupedClock = meta.story({ args: { grouped: true } })

export const CanvasClock = meta.story({
  args: { placement: { surface: 'canvas', x: 180, y: 120 } },
})
