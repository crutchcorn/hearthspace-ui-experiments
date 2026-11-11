import preview from '../../../../.storybook/preview'
import WindowSwitcher from './window-switcher'
import { CanvasSample } from '../../../../.storybook/surfaces'
import { useRef } from 'react'

const meta = preview.meta({
  title: 'Desktop/Windows/Switcher Caption',
  component: WindowSwitcher,
  args: {
    title: 'Scratchpad',
    position: { x: 160, y: 230, width: 320 },
    focusTarget: { current: null },
  },
  render: function Render(args) {
    const focusTarget = useRef<HTMLDivElement>(null)
    return (
      <CanvasSample>
        <div
          ref={focusTarget}
          tabIndex={-1}
          role="listbox"
          aria-label="Switch windows"
          style={{
            position: 'absolute',
            top: 80,
            left: args.position.x,
            width: args.position.width,
            height: args.position.y - 92,
            border: '2px solid var(--accent)',
            borderRadius: 'var(--radius-panel)',
            background: 'var(--material-surface)',
          }}
        >
          <div role="option" aria-selected="true" aria-label={args.title} />
        </div>
        <WindowSwitcher {...args} focusTarget={focusTarget} />
      </CanvasSample>
    )
  },
})

export const SelectedWindow = meta.story({})
