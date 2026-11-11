import preview from '../../../../.storybook/preview'
import DesktopCanvas from './desktop-canvas'
import { fn } from 'storybook/test'
import {
  drawing,
  items,
  viewport,
  workspace,
} from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Canvas/Desktop Canvas',
  component: DesktopCanvas,
  args: {
    viewport: null,
    setCanvasHost: null,
    view: viewport,
    world: workspace,
    photo: null,
    tool: 'cursor',
    focusView: false,
    previewLayout: false,
    spaceHeld: false,
    dragging: false,
    switcherOpen: false,
    switcherId: null,
    windowCount: 0,
    selection: null,
    events: {},
    controls: [],
    guide: null,
    items: {
      items,
      selectedIds: [],
      onPointerDown: fn(),
      onOpen: fn(),
      onSelect: fn(),
    },
    ink: {
      drawings: [drawing],
      selectedId: null,
      interactive: true,
      onPointerDown: fn(),
    },
    children: null,
  },
  decorators: [
    (Story) => (
      <CanvasSample>
        <Story />
      </CanvasSample>
    ),
  ],
})

export const Canvas = meta.story({})

export const RectangleSelection = meta.story({
  args: {
    tool: 'select',
    selection: { target: 'items', x: 28, y: 35, width: 215, height: 116 },
  },
})
