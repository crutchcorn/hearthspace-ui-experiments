import preview from '../../../../.storybook/preview'
import WifiControls from './wifi-controls'
import { systemStatus } from '../../../../.storybook/fixtures'
import { SettingsSample } from '../../../../.storybook/surfaces'
import { useSystemStatus } from '../hooks/use-system-status'
import SettingsDialogBoundary from './settings-dialog-boundary'

const meta = preview.meta({
  title: 'Desktop/Settings/Wi-Fi Controls',
  component: WifiControls,
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

export const Networks = meta.story({
  render: function Render(args) {
    const status = useSystemStatus()
    return <WifiControls {...args} status={status} />
  },
})

export const RadioOff = meta.story({
  args: {
    status: {
      ...systemStatus,
      wifiEnabled: false,
      wifiNetwork: null,
      wifiLabel: 'Wi-Fi off',
      wifiConnectionStatus: 'Wi-Fi off',
    },
  },
})
