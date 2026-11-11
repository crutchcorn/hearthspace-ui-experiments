import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import preview from '../../../.storybook/preview'
import ToggleSwitch from './toggle-switch'

const meta = preview.meta({
  title: 'Shared/Controls/Toggle Switch',
  component: ToggleSwitch,
  args: { checked: false, onChange: fn() },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    return (
      <label style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        Bluetooth
        <ToggleSwitch
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

export const Off = meta.story({})

export const On = meta.story({ args: { checked: true } })

export const Disabled = meta.story({ args: { disabled: true } })
