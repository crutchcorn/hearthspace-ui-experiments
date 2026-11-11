import { fn } from 'storybook/test'
import preview from '../../../.storybook/preview'
import { X } from '../icons'
import Button from './button'

const meta = preview.meta({
  title: 'Shared/Controls/Button',
  component: Button,
  args: { children: 'Cancel', onClick: fn() },
})

export const Neutral = meta.story({})

export const Primary = meta.story({
  args: { variant: 'primary', children: 'Connect' },
})

export const Destructive = meta.story({
  args: { variant: 'danger', children: 'Forget device' },
})

export const Quiet = meta.story({
  args: { variant: 'quiet', children: 'Refresh networks' },
})

export const Disabled = meta.story({
  args: { variant: 'primary', children: 'Connect', disabled: true },
})

export const IconOnly = meta.story({
  args: {
    variant: 'quiet',
    'aria-label': 'Close dialog',
    children: <X size={18} />,
  },
})
