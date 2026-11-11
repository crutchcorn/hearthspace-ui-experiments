import preview from '../../../../.storybook/preview'
import WirelessControls from './wireless-controls'
import { systemStatus } from '../../../../.storybook/fixtures'
import { useSystemStatus } from '../hooks/use-system-status'

const meta = preview.meta({
  title: 'Desktop/Settings/Wireless Controls',
  component: WirelessControls,
  args: { kind: 'wifi', status: systemStatus },
  argTypes: { status: { control: false } },
  render: function Render(args) {
    const status = useSystemStatus()
    return (
      <div style={{ width: 'min(360px, 100%)' }}>
        <WirelessControls {...args} status={status} />
      </div>
    )
  },
})

export const WiFi = meta.story({})

export const Bluetooth = meta.story({ args: { kind: 'bluetooth' } })
