import preview from '../../../../.storybook/preview'
import WindowContent from './window-content'
import { fn } from 'storybook/test'
import { useArgs } from 'storybook/preview-api'
import {
  settingsProps,
  windows,
  workspace,
} from '../../../../.storybook/fixtures'
import { SettingsSample } from '../../../../.storybook/surfaces'

const meta = preview.meta({
  title: 'Desktop/Windows/App Content',
  component: WindowContent,
  args: {
    ...settingsProps,
    item: windows[0],
    note: workspace.note,
    onNoteChange: fn(),
  },
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <SettingsSample>
        <WindowContent
          {...args}
          onNoteChange={(note) => {
            args.onNoteChange(note)
            updateArgs({ note })
          }}
        />
      </SettingsSample>
    )
  },
})

export const Scratchpad = meta.story({})

export const Files = meta.story({ args: { item: windows[1] } })

export const Browser = meta.story({ args: { item: windows[2] } })
