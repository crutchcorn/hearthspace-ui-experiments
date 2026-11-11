import preview from '../../../../.storybook/preview'
import DrawingLayer from './drawing-layer'
import { fn } from 'storybook/test'
import { drawing, viewport } from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Canvas/Drawing Layer',
  component: DrawingLayer,
  args: {
    drawings: [drawing],
    layer: 'above',
    selectedId: null,
    interactive: true,
    view: viewport,
    onPointerDown: fn(),
    onSelect: fn(),
  },
  decorators: [
    (Story) => (
      <CanvasSample>
        <Story />
      </CanvasSample>
    ),
  ],
})

export const Ink = meta.story({})

export const Selected = meta.story({ args: { selectedId: drawing.id } })

export const Draft = meta.story({
  args: {
    drawings: [],
    draft: {
      layer: 'above',
      points: [
        { x: 160, y: 110 },
        { x: 185, y: 145 },
        { x: 240, y: 102 },
      ],
    },
  },
})
