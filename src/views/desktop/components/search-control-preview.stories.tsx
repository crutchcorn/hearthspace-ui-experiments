import preview from '../../../../.storybook/preview'
import SearchControlPreview from './search-control-preview'
import { systemStatus, notifications } from '../../../../.storybook/fixtures'

const meta = preview.meta({
  title: 'Desktop/Canvas/Search Control Preview',
  component: SearchControlPreview,
  args: {
    widgetId: 'wifi',
    status: systemStatus,
    notifications,
    clockDateFormat: 'none',
    tool: 'cursor',
    selectionShape: 'rectangle',
  },
  decorators: [
    (Story) => (
      <div style={{ width: 240 }}>
        <Story />
      </div>
    ),
  ],
})

export const WiFi = meta.story({})

export const Notifications = meta.story({ args: { widgetId: 'notifications' } })

export const SelectedTool = meta.story({
  args: { widgetId: undefined, toolId: 'cursor' },
})
