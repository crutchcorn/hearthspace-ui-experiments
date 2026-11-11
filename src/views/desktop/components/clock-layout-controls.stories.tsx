import preview from '../../../../.storybook/preview'
import ClockLayoutControls from './clock-layout-controls'
import { fn } from 'storybook/test'
import { useArgs } from 'storybook/preview-api'
import { clock } from '../../../../.storybook/fixtures'

const meta = preview.meta({
  title: 'Desktop/Frame/Clock Date Formats',
  component: ClockLayoutControls,
  args: { now: clock, dateFormat: 'none', onDateFormatChange: fn() },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <ClockLayoutControls
        {...args}
        onDateFormatChange={(dateFormat) => {
          args.onDateFormatChange(dateFormat)
          updateArgs({ dateFormat })
        }}
      />
    )
  },
})

export const TimeOnly = meta.story({})

export const LongDate = meta.story({ args: { dateFormat: 'long' } })
