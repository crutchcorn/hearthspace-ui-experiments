import preview from '../../../../.storybook/preview'
import LayoutItemControls from './layout-item-controls'
import { fn } from 'storybook/test'
import { clock } from '../../../../.storybook/fixtures'
import ClockLayoutControls from './clock-layout-controls'

const meta = preview.meta({
  title: 'Desktop/Frame/Item Options',
  component: LayoutItemControls,
  args: {
    target: { kind: 'widget', id: 'clock' },
    controls: {
      'widget:clock': (
        <ClockLayoutControls
          now={clock}
          dateFormat="weekday"
          onDateFormatChange={fn()}
        />
      ),
    },
  },
})

export const ClockOptions = meta.story({})
