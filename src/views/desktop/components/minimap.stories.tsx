import preview from '../../../../.storybook/preview'
import Minimap from './minimap'
import { fn } from 'storybook/test'
import { useArgs } from 'storybook/preview-api'
import { viewport, workspace } from '../../../../.storybook/fixtures'

const meta = preview.meta({
  title: 'Desktop/Canvas/Minimap',
  component: Minimap,
  args: { workspace, view: viewport, onNavigate: fn() },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <div style={{ width: 300 }}>
        <Minimap
          {...args}
          onNavigate={(x, y) => {
            args.onNavigate(x, y)
            updateArgs({
              view: {
                ...args.view,
                x: Math.max(
                  0,
                  Math.min(x, args.workspace.width - args.view.width),
                ),
                y: Math.max(
                  0,
                  Math.min(y, args.workspace.height - args.view.height),
                ),
              },
            })
          }}
        />
      </div>
    )
  },
})

export const DragViewport = meta.story({})
