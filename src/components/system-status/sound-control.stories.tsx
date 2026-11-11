import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'
import preview from '../../../.storybook/preview'
import SoundControl from './sound-control'

const meta = preview.meta({
  title: 'Desktop/Shell/Sound Control',
  component: SoundControl,
  args: { value: 65, onChange: fn() },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()

    return (
      <div style={{ width: 256 }}>
        <SoundControl
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

export const Medium = meta.story({})

export const Muted = meta.story({ args: { value: 0 } })

export const FullVolume = meta.story({ args: { value: 100 } })
