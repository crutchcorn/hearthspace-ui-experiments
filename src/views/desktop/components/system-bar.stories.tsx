import preview from '../../../../.storybook/preview'
import SystemBar from './system-bar'
import { fn } from 'storybook/test'
import { useArgs } from 'storybook/preview-api'
import { clock, systemStatus } from '../../../../.storybook/fixtures'
import { WidgetSample } from '../../../../.storybook/surfaces'
import { useSystemStatus } from '../hooks/use-system-status'

const meta = preview.meta({
  title: 'Desktop/Shell/System Control',
  component: SystemBar,
  args: {
    id: 'clock',
    status: systemStatus,
    openPanel: null,
    expanded: true,
    clockDateFormat: 'weekday',
    onPanelChange: fn(),
    onLock: fn(),
  },
  argTypes: { status: { control: false } },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    const status = useSystemStatus()
    return (
      <WidgetSample id={args.id}>
        <SystemBar
          {...args}
          status={{ ...status, now: clock }}
          onPanelChange={(openPanel) => {
            args.onPanelChange(openPanel)
            updateArgs({ openPanel })
          }}
        />
      </WidgetSample>
    )
  },
})

export const Clock = meta.story({})

export const WiFi = meta.story({ args: { id: 'wifi', openPanel: 'wifi' } })

export const Bluetooth = meta.story({
  args: { id: 'bluetooth', openPanel: 'bluetooth' },
})

export const Sound = meta.story({ args: { id: 'volume', openPanel: 'volume' } })

export const Battery = meta.story({
  args: { id: 'battery', openPanel: 'battery' },
})

export const Power = meta.story({ args: { id: 'power', openPanel: 'power' } })
