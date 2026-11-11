import preview from '../../../../.storybook/preview'
import AppLauncher from './app-launcher'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'

const meta = preview.meta({
  title: 'Desktop/Apps/App Launcher',
  component: AppLauncher,
  args: {
    mode: 'apps',
    onModeChange: fn(),
    onClose: fn(),
    onLaunch: fn(),
    onCustomizeGestures: fn(),
    onSaveGestureShortcut: fn(),
    onPlayGesture: fn(() => false),
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <div style={{ width: 'min(640px, calc(100vw - 48px))', minHeight: 440 }}>
        <AppLauncher
          {...args}
          onModeChange={(mode) => {
            args.onModeChange(mode)
            updateArgs({ mode })
          }}
        />
      </div>
    )
  },
})

export const Apps = meta.story({})

export const Gestures = meta.story({ args: { mode: 'gestures' } })
