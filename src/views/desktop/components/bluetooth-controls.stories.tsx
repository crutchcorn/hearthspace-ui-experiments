import preview from '../../../../.storybook/preview'
import BluetoothControls from './bluetooth-controls'
import { systemStatus } from '../../../../.storybook/fixtures'
import { SettingsSample } from '../../../../.storybook/surfaces'
import { useSystemStatus } from '../hooks/use-system-status'
import SettingsDialogBoundary from './settings-dialog-boundary'

const meta = preview.meta({
  title: 'Desktop/Settings/Bluetooth Controls',
  component: BluetoothControls,
  args: { status: systemStatus, presentation: 'settings' },
  argTypes: { status: { control: false } },
  decorators: [
    (Story) => (
      <SettingsSample>
        <SettingsDialogBoundary>
          <Story />
        </SettingsDialogBoundary>
      </SettingsSample>
    ),
  ],
})

export const Devices = meta.story({
  render: function Render(args) {
    const status = useSystemStatus()
    return <BluetoothControls {...args} status={status} />
  },
})

export const RadioOff = meta.story({
  args: {
    status: {
      ...systemStatus,
      bluetoothEnabled: false,
      bluetoothConnectedIds: [],
      bluetoothLabel: 'Bluetooth off',
    },
  },
})
