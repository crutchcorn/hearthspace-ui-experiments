import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import preview from '../../../.storybook/preview'
import SelectControl from './select-control'

const meta = preview.meta({
  title: 'Shared/Controls/Select',
  component: SelectControl,
  args: {
    label: 'DNS configuration',
    value: 'automatic',
    onChange: fn(),
    options: [
      { id: 'automatic', label: 'Automatic' },
      { id: 'manual', label: 'Manual' },
    ],
  },
  argTypes: {
    value: { control: 'select', options: ['automatic', 'manual'] },
    options: { control: false },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    return (
      <div style={{ width: 220, maxWidth: '100%', minHeight: 200 }}>
        <SelectControl
          {...args}
          onChange={(value) => {
            updateArgs({ value })
            args.onChange(value)
          }}
        />
      </div>
    )
  },
})

export const Automatic = meta.story({})

export const Disabled = meta.story({ args: { isDisabled: true } })
