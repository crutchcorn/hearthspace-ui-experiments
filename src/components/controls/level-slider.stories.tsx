import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import preview from '../../../.storybook/preview'
import LevelSlider from './level-slider'

const meta = preview.meta({
  title: 'Shared/Controls/Level Slider',
  component: LevelSlider,
  args: { 'aria-label': 'Sound', value: 65, onChange: fn() },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    return (
      <div style={{ display: 'flex', width: 256 }}>
        <LevelSlider
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

export const Adjustable = meta.story({})

export const Disabled = meta.story({ args: { disabled: true } })
