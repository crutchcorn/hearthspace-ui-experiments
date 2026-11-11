import preview from '../../../../.storybook/preview'
import LauncherDock from './launcher-dock'
import { fn } from 'storybook/test'
import { useArgs } from 'storybook/preview-api'
import { windows } from '../../../../.storybook/fixtures'
import { WidgetSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Apps/Launcher Dock',
  component: LauncherDock,
  args: {
    open: false,
    favoriteAppIds: ['browser', 'files', 'notes'],
    triggerRef: null,
    windows,
    activeWindowId: 'notes',
    selectedAppId: null,
    onToggle: fn(),
    onLaunch: fn(),
    onSelectApp: fn(),
    onFocusWindow: fn(),
    onReorderWindows: fn(),
  },
  decorators: [
    (Story) => (
      <WidgetSample id="apps">
        <Story />
      </WidgetSample>
    ),
  ],
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <LauncherDock
        {...args}
        onToggle={() => {
          args.onToggle()
          updateArgs({ open: !args.open })
        }}
        onSelectApp={(selectedAppId) => {
          args.onSelectApp(selectedAppId)
          updateArgs({ selectedAppId })
        }}
      />
    )
  },
})

export const Favorites = meta.story({})

export const RunningInstances = meta.story({ args: { selectedAppId: 'notes' } })

export const FavoriteDrop = meta.story({ args: { favoriteDropActive: true } })
