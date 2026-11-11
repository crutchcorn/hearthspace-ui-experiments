import preview from '../../../../.storybook/preview'
import DrawingActions from './drawing-actions'
import { fn } from 'storybook/test'
import { drawing, viewport } from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'
import DrawingLayer from './drawing-layer'

const meta = preview.meta({
  title: 'Desktop/Canvas/Drawing Actions',
  component: DrawingActions,
  args: {
    drawing,
    view: viewport,
    editing: false,
    onChangeLayout: fn(),
    onDelete: fn(),
    onFinish: fn(),
    onPlay: fn(() => true),
  },
  render: (args) => (
    <CanvasSample>
      <DrawingLayer
        drawings={[args.drawing]}
        layer="above"
        selectedId={args.drawing.id}
        interactive={false}
        onPointerDown={fn()}
      />
      <DrawingActions {...args} />
    </CanvasSample>
  ),
})

export const PlayAndArrange = meta.story({})

export const Editing = meta.story({ args: { editing: true } })

export const NoMatch = meta.story({ args: { onPlay: fn(() => false) } })
