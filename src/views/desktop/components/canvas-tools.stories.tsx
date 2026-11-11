import preview from '../../../../.storybook/preview'
import CanvasTools from './canvas-tools'
import { fn } from 'storybook/test'
import { useArgs } from 'storybook/preview-api'
import { WidgetSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Canvas/Tool Picker',
  component: CanvasTools,
  args: {
    mode: 'cursor',
    selectionShape: 'rectangle',
    mapOpen: false,
    windowCount: 3,
    menusAllowed: true,
    onModeChange: fn(),
    onSelectionShapeChange: fn(),
    onOpenToolMenu: fn(),
    onToggleMap: fn(),
    onArrange: fn(),
  },
  decorators: [
    (Story) => (
      <WidgetSample id="tools">
        <Story />
      </WidgetSample>
    ),
  ],
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <CanvasTools
        {...args}
        onModeChange={(mode) => {
          args.onModeChange(mode)
          updateArgs({ mode })
        }}
        onSelectionShapeChange={(selectionShape) => {
          args.onSelectionShapeChange(selectionShape)
          updateArgs({ mode: 'select', selectionShape })
        }}
        onToggleMap={() => {
          args.onToggleMap()
          updateArgs({ mapOpen: !args.mapOpen })
        }}
      />
    )
  },
})

export const Cursor = meta.story({})

export const Lasso = meta.story({
  args: { mode: 'select', selectionShape: 'freeform' },
})

export const Drawing = meta.story({ args: { mode: 'draw' } })
