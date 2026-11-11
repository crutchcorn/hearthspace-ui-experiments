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
        Password <input type="password" />
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
        <button type="button" onClick={() => setOpen(true)}>
          Open network dialog
        </button>
        {open && (
          <WirelessDialog
            {...args}
            onClose={close}
            actions={
              <button type="button" onClick={close}>
                Cancel
              </button>
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
