import preview from '../../../../.storybook/preview'
import DesktopItems from './desktop-items'
import { fn } from 'storybook/test'
import { items } from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Canvas/Desktop Items',
  component: DesktopItems,
  args: {
    items,
    selectedIds: [],
    onPointerDown: fn(),
    onOpen: fn(),
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

export const Icons = meta.story({})

export const Selected = meta.story({
  args: { selectedIds: ['projects', 'notes-file'] },
})

export const Filled = meta.story({ args: { iconVariant: 'filled' } })
