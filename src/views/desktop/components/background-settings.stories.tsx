import preview from '../../../../.storybook/preview'
import BackgroundSettings from './background-settings'
import { backgroundProps } from '../../../../.storybook/fixtures'
import { SettingsSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Settings/Background',
  component: BackgroundSettings,
  args: backgroundProps,
  decorators: [
    (Story) => (
      <SettingsSample>
        <Story />
      </SettingsSample>
    ),
  ],
})

export const CanvasDots = meta.story({})

export const Loading = meta.story({ args: { backgroundBusy: true } })

export const UploadError = meta.story({
  args: {
    backgroundError:
      'Choose an image your browser can open, such as PNG or JPEG.',
  },
})
