import preview from '../../../../.storybook/preview'
import AISettings from './ai-settings'
import { ai } from '../../../../.storybook/fixtures'
import { SettingsSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Settings/AI Gathering',
  component: AISettings,
  args: { ai },
  decorators: [
    (Story) => (
      <SettingsSample>
        <Story />
      </SettingsSample>
    ),
  ],
})

export const Disabled = meta.story({})

export const Downloading = meta.story({
  args: { ai: { ...ai, downloading: true, progress: 46 } },
})

export const Enabled = meta.story({
  args: { ai: { ...ai, enabled: true, progress: 100 } },
})
