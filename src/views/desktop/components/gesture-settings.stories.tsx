import preview from '../../../../.storybook/preview'
import GestureSettings from './gesture-settings'
import { fn } from 'storybook/test'
import { gestureShortcuts } from '../../../../.storybook/fixtures'
import { SettingsSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Settings/Gesture Assignments',
  component: GestureSettings,
  args: {
    gestureShortcuts,
    onSaveGestureShortcut: fn(),
    onRemoveGestureShortcut: fn(),
    onScreenChange: fn(),
  },
  decorators: [
    (Story) => (
      <SettingsSample>
        <Story />
      </SettingsSample>
    ),
  ],
})

export const SavedAssignments = meta.story({})

export const Empty = meta.story({ args: { gestureShortcuts: [] } })
