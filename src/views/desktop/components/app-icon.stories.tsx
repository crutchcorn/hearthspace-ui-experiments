import preview from '../../../../.storybook/preview'
import AppIcon from './app-icon'

const meta = preview.meta({
  title: 'Desktop/Apps/App Icon',
  component: AppIcon,
  args: { appId: 'browser', size: 48 },
})

export const Browser = meta.story({})

export const Settings = meta.story({ args: { appId: 'settings' } })

export const Files = meta.story({ args: { appId: 'files' } })
