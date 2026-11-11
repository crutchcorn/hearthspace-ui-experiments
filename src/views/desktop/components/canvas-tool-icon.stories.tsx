import preview from '../../../../.storybook/preview'
import CanvasToolIcon from './canvas-tool-icon'

const meta = preview.meta({
  title: 'Desktop/Canvas/Tool Icon',
  component: CanvasToolIcon,
  args: { tool: 'cursor', size: 40 },
})

export const Select = meta.story({})

export const Freeform = meta.story({ args: { tool: 'freeform' } })

export const Arrange = meta.story({ args: { tool: 'arrange' } })
