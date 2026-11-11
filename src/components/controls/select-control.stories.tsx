import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import preview from '../../../.storybook/preview'
import SelectControl from './select-control'

const meta = preview.meta({
  title: 'Shared/Controls/Select',
  component: SelectControl,
  args: {
    value: 'automatic',
    onChange: fn(),
    children: (
      <>
        <option value="automatic">Automatic</option>
        <option value="manual">Manual</option>
      </>
    ),
  },
  argTypes: {
    value: { control: 'select', options: ['automatic', 'manual'] },
    children: { control: false },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    return (
      <label style={{ display: 'grid', width: 220, gap: 8 }}>
        DNS configuration
        <SelectControl
          {...args}
          onChange={(event) => {
            updateArgs({ value: event.currentTarget.value })
            args.onChange?.(event)
          }}
        />
      </label>
    )
  },
})

export const Automatic = meta.story({})

export const Disabled = meta.story({ args: { disabled: true } })
