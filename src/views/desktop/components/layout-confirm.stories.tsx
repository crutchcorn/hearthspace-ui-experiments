import preview from '../../../../.storybook/preview'
import LayoutConfirm from './layout-confirm'
import { fn } from 'storybook/test'
import { useState } from 'react'

const meta = preview.meta({
  title: 'Desktop/Frame/Layout Confirmation',
  component: LayoutConfirm,
  args: {
    title: 'Close and remove from pinned?',
    children: 'This closes the window and removes it from the frame.',
    confirmLabel: 'Close and remove',
    destructive: true,
    onCancel: fn(),
    onConfirm: fn(),
  },
  render: function Render(args) {
    const [open, setOpen] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          Open confirmation
        </button>
        {open && (
          <LayoutConfirm
            {...args}
            onCancel={() => {
              setOpen(false)
              args.onCancel()
            }}
            onConfirm={() => {
              setOpen(false)
              args.onConfirm()
            }}
          />
        )}
      </>
    )
  },
})

export const Destructive = meta.story({})

export const KeepCanvasTools = meta.story({
  args: {
    title: 'Keep a way back to your canvas',
    children: 'Enable hiding canvas tools in Settings first.',
    confirmLabel: 'Open settings',
    destructive: false,
  },
})
