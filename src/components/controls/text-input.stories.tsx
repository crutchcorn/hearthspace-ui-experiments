import { fn } from 'storybook/test'
import preview from '../../../.storybook/preview'
import TextInput from './text-input'

const meta = preview.meta({
  title: 'Shared/Controls/Text Input',
  component: TextInput,
  args: {
    'aria-label': 'Network name',
    placeholder: 'Enter a network name',
    onChange: fn(),
  },
  render: (args) => (
    <div style={{ width: 256, maxWidth: '100%' }}>
      <label style={{ display: 'grid', gap: 7 }}>
        {args['aria-label']}
        <TextInput {...args} />
      </label>
      {args['aria-invalid'] === true && (
        <p id={args['aria-describedby']}>Enter the password again.</p>
      )}
    </div>
  ),
})

export const Empty = meta.story({})

export const Filled = meta.story({ args: { defaultValue: 'Studio network' } })

export const Password = meta.story({
  args: {
    type: 'password',
    'aria-label': 'Password',
    placeholder: 'Enter a password',
    defaultValue: 'hearthspace',
  },
})

export const Invalid = meta.story({
  args: {
    type: 'password',
    'aria-label': 'Password',
    'aria-invalid': true,
    'aria-describedby': 'password-error',
    defaultValue: 'example',
  },
})

export const Disabled = meta.story({
  args: { defaultValue: 'Studio network', disabled: true },
})
