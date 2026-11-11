import TextInput from '../../../components/controls/text-input'
import Button from '../../../components/controls/button'
import preview from '../../../../.storybook/preview'
import SettingsDialogBoundary from './settings-dialog-boundary'
import { useState } from 'react'
import { SettingsSample } from '../../../../.storybook/surfaces'
import WirelessDialog from './wireless-dialog'

function NetworkPanel() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <div style={{ padding: 20 }}>
      <Button type="button" onClick={() => setOpen(true)}>
        Open adapter settings
      </Button>
      {open && (
        <WirelessDialog
          title="Adapter settings"
          onClose={close}
          actions={
            <Button type="button" onClick={close}>
              Done
            </Button>
          }
        >
          <label>
            Computer name <TextInput defaultValue="Hearthspace desktop" />
          </label>
        </WirelessDialog>
      )}
    </div>
  )
}

const meta = preview.meta({
  title: 'Desktop/Settings/Dialog Boundary',
  component: SettingsDialogBoundary,
  args: { children: <NetworkPanel /> },
  decorators: [
    (Story) => (
      <SettingsSample>
        <Story />
      </SettingsSample>
    ),
  ],
})

export const WindowContained = meta.story({})
