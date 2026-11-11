import preview from '../../../../.storybook/preview'
import GesturePad from './gesture-pad'
import { fn } from 'storybook/test'
import { gestureShortcuts } from '../../../../.storybook/fixtures'

const meta = preview.meta({
  title: 'Desktop/Apps/Gesture Pad',
  component: GesturePad,
  args: { onSaveShortcut: fn() },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(440px, 100%)' }}>
        <Story />
      </div>
    ),
  ],
})

export const Launcher = meta.story({
  args: {
    mode: 'launcher',
    onPlayGesture: fn(() => false),
    onCustomizeGestures: fn(),
  },
})

export const EditAssignment = meta.story({
  args: { mode: 'editor', initialShortcut: gestureShortcuts[0] },
})
