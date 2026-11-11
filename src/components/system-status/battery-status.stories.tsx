import preview from '../../../.storybook/preview'
import BatteryStatus from './battery-status'

const meta = preview.meta({
  title: 'Desktop/Shell/Battery Status',
  component: BatteryStatus,
  args: { percentage: 87, powerSource: 'On battery power' },
  argTypes: {
    percentage: { control: { type: 'range', min: 0, max: 100 } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 256 }}>
        <Story />
      </div>
    ),
  ],
})

export const OnBatteryPower = meta.story({})

export const LowBattery = meta.story({ args: { percentage: 12 } })

export const Charging = meta.story({
  args: { percentage: 64, powerSource: 'Charging' },
})
