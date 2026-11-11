import { definePreview } from '@storybook/react-vite'
import addonDocs from '@storybook/addon-docs'
import addonThemes, { DecoratorHelpers } from '@storybook/addon-themes'
import type { CSSProperties } from 'react'
import '../src/index.css'
import { ACCENT_THEMES } from '../src/views/desktop/constants/theme'
import desktopStyles from '../src/views/desktop/desktop.module.css'
import { defaultAccent, getStoryAccent } from './accent'
import './preview.css'

DecoratorHelpers.initializeThemeState(
  ACCENT_THEMES.map((accent) => accent.name),
  defaultAccent.name,
)

export default definePreview({
  addons: [addonDocs(), addonThemes()],
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { story: { inline: true } },
  },
  globalTypes: {
    colorMode: {
      description: 'Hearthspace color mode',
      toolbar: {
        title: 'Color mode',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { colorMode: 'light' },
  decorators: [
    (Story, { globals, parameters, viewMode }) => {
      const accent = getStoryAccent(
        parameters.themes?.themeOverride || globals.theme,
      )

      return (
        <div
          className={`${desktopStyles.desktop} hearthspace-preview`}
          data-story-canvas={viewMode === 'story'}
          data-accent={accent.id}
          data-color-mode={globals.colorMode}
          data-presentation="realistic"
          style={{ '--accent-base': accent.color } as CSSProperties}
        >
          <Story />
        </div>
      )
    },
  ],
})
