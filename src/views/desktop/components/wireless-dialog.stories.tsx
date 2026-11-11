import TextInput from '../../../components/controls/text-input'
import Button from '../../../components/controls/button'
import preview from '../../../../.storybook/preview'
import WirelessDialog from './wireless-dialog'
import { useState } from 'react'
import { fn } from 'storybook/test'
import { SettingsSample } from '../../../../.storybook/surfaces'
import SettingsDialogBoundary from './settings-dialog-boundary'

const meta = preview.meta({
  title: 'Desktop/Settings/Wireless Dialog',
  component: WirelessDialog,
  args: {
    title: 'Connect to Workshop',
    description: 'WPA2 Personal',
    onClose: fn(),
    children: (
      <label>
        Password <TextInput type="password" />
      </label>
    ),
  },
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    const close = () => {
      setOpen(false)
      args.onClose()
    }
    return (
      <>
        <Button type="button" onClick={() => setOpen(true)}>
          Open network dialog
        </Button>
        {open && (
          <WirelessDialog
            {...args}
            onClose={close}
            actions={
              <Button type="button" onClick={close}>
                Cancel
              </Button>
            }
          />
        )}
      </>
    )
  },
})

export const FromTray = meta.story({})

export const InsideSettings = meta.story({
  decorators: [
    (Story) => (
      <SettingsSample>
        <SettingsDialogBoundary>
          <Story />
        </SettingsDialogBoundary>
      </SettingsSample>
    ),
  ],
})
