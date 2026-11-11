import preview from '../../../../.storybook/preview'
import { getStoryAccent } from '../../../../.storybook/accent'
import Settings from './settings'
import { settingsProps, clock } from '../../../../.storybook/fixtures'
import { SettingsSample } from '../../../../.storybook/surfaces'
import { useSystemStatus } from '../hooks/use-system-status'

const meta = preview.meta({
  title: 'Desktop/Settings/Settings Window',
  component: Settings,
  args: settingsProps,
  argTypes: { status: { control: false } },
  render: function Render(args, { globals }) {
    const status = useSystemStatus()
    return (
      <SettingsSample>
        <Settings
          {...args}
          status={{ ...status, now: clock }}
          colorMode={globals.colorMode === 'dark' ? 'dark' : 'light'}
          accentTheme={getStoryAccent(globals.theme).id}
        />
      </SettingsSample>
    )
  },
})

export const Appearance = meta.story({})

export const WiFi = meta.story({
  args: { navigation: { id: 'story-wifi', category: 'wifi' } },
})

export const Bluetooth = meta.story({
  args: { navigation: { id: 'story-bluetooth', category: 'bluetooth' } },
})
