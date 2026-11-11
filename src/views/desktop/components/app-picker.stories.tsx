import preview from '../../../../.storybook/preview'
import AppPicker from './app-picker'
import { useArgs } from 'storybook/preview-api'
import { fn } from 'storybook/test'

const meta = preview.meta({
  title: 'Desktop/Apps/App Picker',
  component: AppPicker,
  args: { selectedId: 'browser', onChange: fn() },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <div style={{ width: 280, maxWidth: '100%', minHeight: 360 }}>
        <AppPicker
          {...args}
          onChange={(selectedId) => {
            args.onChange(selectedId)
            updateArgs({ selectedId })
          }}
        />
      </div>
    )
  },
})

export const Searchable = meta.story({})
