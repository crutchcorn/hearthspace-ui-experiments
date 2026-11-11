import preview from '../../../../.storybook/preview'
import FrameShell from './frame-shell'
import { fn } from 'storybook/test'
import {
  frameLayout,
  systemStatus,
  viewport,
} from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'
import SystemBar from './system-bar'
import { AppsGrid, Bell, Cursor } from '../../../components/icons'

const systemWidgets = [
  'clock',
  'wifi',
  'bluetooth',
  'volume',
  'battery',
  'power',
] as const

const meta = preview.meta({
  title: 'Desktop/Frame/Frame Shell',
  component: FrameShell,
  args: {
    canvasHost: null,
    dragHost: null,
    popoverHost: null,
    layout: frameLayout,
    view: viewport,
    editing: false,
    selected: null,
    selectedControlIds: [],
    onControlPointerDown: fn(),
    onControlSizeChange: fn(),
    draggingWidget: null,
    groupDropTarget: null,
    hidden: false,
    inert: false,
    widgets: {
      ...Object.fromEntries(
        systemWidgets.map((id) => [
          id,
          <SystemBar
            key={id}
            id={id}
            status={systemStatus}
            openPanel={null}
            expanded={false}
            clockDateFormat="none"
            onPanelChange={fn()}
            onLock={fn()}
          />,
        ]),
      ),
      notifications: <Bell size={24} />,
      tools: <Cursor size={24} />,
      apps: <AppsGrid size={24} />,
    },
    renderItem: fn(() => null),
  },
  decorators: [
    (Story) => (
      <CanvasSample>
        <Story />
      </CanvasSample>
    ),
  ],
})

export const DefaultLayout = meta.story({})

export const Editing = meta.story({
  args: { editing: true, selected: { kind: 'widget', id: 'clock' } },
})
