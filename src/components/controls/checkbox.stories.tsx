import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import preview from '../../../.storybook/preview'
import Checkbox from './checkbox'

const meta = preview.meta({
  title: 'Shared/Controls/Checkbox',
  component: Checkbox,
  args: { checked: false, onChange: fn() },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        Metered connection
        <Checkbox
          {...args}
          onChange={(event) => {
            updateArgs({ checked: event.currentTarget.checked })
            args.onChange?.(event)
          }}
        />
      </label>
    )
  },
})

export const Unchecked = meta.story({})

export const Checked = meta.story({ args: { checked: true } })

export const Disabled = meta.story({ args: { disabled: true } })
