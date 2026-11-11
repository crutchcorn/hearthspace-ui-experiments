import type { StorybookConfig } from '@storybook/react-vite'

export default {
  framework: '@storybook/react-vite',
  stories: ['../src/{components,views}/**/*.stories.tsx'],
  addons: ['@storybook/addon-docs', '@storybook/addon-themes'],
} satisfies StorybookConfig
