import preview from '../../../../.storybook/preview'
import NotificationInbox from './notification-inbox'
import { fn } from 'storybook/test'
import { useArgs } from 'storybook/preview-api'
import { notifications } from '../../../../.storybook/fixtures'
import { WidgetSample } from '../../../../.storybook/surfaces'
import { useNotifications } from '../hooks/use-notifications'

const meta = preview.meta({
  title: 'Desktop/Shell/Notification Inbox',
  component: NotificationInbox,
  args: {
    state: notifications,
    expanded: true,
    open: false,
    previewVisible: true,
    onToggle: fn(),
    onClose: fn(),
    onNavigate: fn(),
  },
  decorators: [
    (Story) => (
      <WidgetSample id="notifications">
        <Story />
      </WidgetSample>
    ),
  ],
  argTypes: { state: { control: false } },
  render: function Render(args) {
    const state = useNotifications()
    const [, updateArgs] = useArgs()
    return (
      <NotificationInbox
        {...args}
        state={state}
        onToggle={() => {
          args.onToggle()
          updateArgs({ open: !args.open })
        }}
        onClose={() => {
          args.onClose()
          updateArgs({ open: false })
        }}
      />
    )
  },
})

export const Unread = meta.story({})

export const InboxOpen = meta.story({ args: { open: true } })

export const IconOnly = meta.story({ args: { expanded: false } })
