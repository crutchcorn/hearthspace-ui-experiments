import preview from '../../../../.storybook/preview'
import WindowHost from './window-host'
import { useState } from 'react'

const meta = preview.meta({
  title: 'Desktop/Windows/Window Host',
  component: WindowHost,
  args: {
    container: null,
    children: (
      <label>
        Scratchpad <textarea defaultValue="Move this draft between hosts." />
      </label>
    ),
  },
  render: function Render(args) {
    const [canvas, setCanvas] = useState<HTMLDivElement | null>(null)
    const [frame, setFrame] = useState<HTMLDivElement | null>(null)
    const [pinned, setPinned] = useState(false)
    const hostStyle = {
      minHeight: 72,
      padding: 12,
      border: '1px solid var(--chrome-border)',
      borderRadius: 'var(--radius-control)',
    }
    return (
      <div style={{ display: 'grid', gap: 8, width: 360 }}>
        <button type="button" onClick={() => setPinned(!pinned)}>
          {pinned ? 'Move to canvas' : 'Move to frame'}
        </button>
        <div style={hostStyle}>
          <strong>Frame</strong>
          <div ref={setFrame} />
        </div>
        <div style={hostStyle}>
          <strong>Canvas</strong>
          <div ref={setCanvas} />
        </div>
        <WindowHost {...args} container={pinned ? frame : canvas} />
      </div>
    )
  },
})

export const MoveBetweenHosts = meta.story({})
