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
      <button type="button" onClick={() => setOpen(true)}>
        Open adapter settings
      </button>
      {open && (
        <WirelessDialog
          title="Adapter settings"
          onClose={close}
          actions={
            <button type="button" onClick={close}>
              Done
            </button>
          }
        >
          <label>
            Computer name <input defaultValue="Hearthspace desktop" />
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
