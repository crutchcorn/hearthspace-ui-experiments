import preview from '../../../../.storybook/preview'
import LockScreen from './lock-screen'
import { fn } from 'storybook/test'
import { systemStatus } from '../../../../.storybook/fixtures'
import { useState } from 'react'

const meta = preview.meta({
  title: 'Desktop/Shell/Lock Screen',
  component: LockScreen,
  args: {
    status: systemStatus,
    photo: null,
    onUnlock: fn((password: string) => password === 'hearthspace'),
  },
  render: function Render(args) {
    const [locked, setLocked] = useState(false)
    return (
      <>
        <button type="button" onClick={() => setLocked(true)}>
          Lock screen
        </button>
        <p>
          Demo password: <code>hearthspace</code>
        </p>
        {locked && (
          <LockScreen
            {...args}
            onUnlock={(password) => {
              const accepted = args.onUnlock(password)
              if (accepted) setLocked(false)
              return accepted
            }}
          />
        )}
      </>
    )
  },
})

export const LockAndUnlock = meta.story({})
