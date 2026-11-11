import preview from '../../../../.storybook/preview'
import GatherWindows from './gather-windows'
import { fn } from 'storybook/test'
import { windows, viewport } from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Windows/Gather Windows',
  component: GatherWindows,
  args: {
    windows: windows.slice(0, 1),
    view: viewport,
    enabled: true,
    downloading: false,
    onGather: fn(),
  },
  render: (args) => (
    <CanvasSample>
      {args.windows.map((item) => (
        <div
          key={item.id}
          style={{
            position: 'absolute',
            left: item.x,
            top: item.y,
            width: item.width,
            height: item.height,
            padding: 16,
            border: '2px solid var(--accent)',
            borderRadius: 'var(--radius-panel)',
            background: 'var(--material-surface)',
          }}
        >
          {item.title}
        </div>
      ))}
      <GatherWindows {...args} />
    </CanvasSample>
  ),
})

export const Ready = meta.story({})

export const OptInRequired = meta.story({ args: { enabled: false } })

export const Downloading = meta.story({
  args: { enabled: false, downloading: true },
})
