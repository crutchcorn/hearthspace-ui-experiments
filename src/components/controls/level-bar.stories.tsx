import preview from '../../../.storybook/preview'
import LevelBar from './level-bar'

const meta = preview.meta({
  title: 'Shared/Controls/Level Bar',
  component: LevelBar,
  args: { label: 'Battery charge', value: 72 },
  argTypes: {
    value: { control: { type: 'range', min: 0, max: 100 } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 256 }}>
        <Story />
      </div>
    ),
  ],
})

export const Meter = meta.story({})

export const Progress = meta.story({
  args: { role: 'progressbar', label: 'Model download', value: 38 },
})
