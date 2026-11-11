import preview from '../../../../.storybook/preview'
import { AppGlyph } from './app-icon'

const meta = preview.meta({
  title: 'Desktop/Apps/App Glyph',
  component: AppGlyph,
  args: { appId: 'settings', size: 48 },
})

export const Outline = meta.story({})

export const Filled = meta.story({ args: { variant: 'filled' } })
