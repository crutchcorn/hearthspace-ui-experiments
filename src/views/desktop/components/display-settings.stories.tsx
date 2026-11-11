import preview from '../../../../.storybook/preview'
import DisplaySettings from './display-settings'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import { SettingsSample } from '../../../../.storybook/surfaces'
import { INITIAL_DISPLAY_LAYOUT } from '../utils/display-layout'

const meta = preview.meta({
  title: 'Desktop/Settings/Display Arrangement',
  component: DisplaySettings,
  args: {
    layout: INITIAL_DISPLAY_LAYOUT,
    preferences: [
      { resolution: '1920 × 1200', scale: '100%', refreshRate: '60 Hz' },
      { resolution: '2560 × 1440', scale: '100%', refreshRate: '120 Hz' },
    ],
    onLayoutChange: fn(),
    onPreferencesChange: fn(),
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <SettingsSample>
        <DisplaySettings
          {...args}
          onLayoutChange={(layout) => {
            args.onLayoutChange(layout)
            updateArgs({ layout })
          }}
          onPreferencesChange={(preferences) => {
            args.onPreferencesChange(preferences)
            updateArgs({ preferences })
          }}
        />
      </SettingsSample>
    )
  },
})

export const TwoDisplays = meta.story({})
