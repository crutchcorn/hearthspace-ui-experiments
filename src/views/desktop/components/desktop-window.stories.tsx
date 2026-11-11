import preview from '../../../../.storybook/preview'
import DesktopWindow from './desktop-window'
import { fn } from 'storybook/test'
import {
  viewport,
  windows,
  settingsProps,
  workspace,
} from '../../../../.storybook/fixtures'
import { CanvasSample } from '../../../../.storybook/surfaces'
import { useState } from 'react'
import WindowContent from './window-content'

const meta = preview.meta({
  title: 'Desktop/Windows/Desktop Window',
  component: DesktopWindow,
  args: {
    item: windows[0],
    appId: 'notes',
    index: 0,
    windowCount: 1,
    view: viewport,
    container: null,
    surface: 'canvas',
    attached: false,
    expanded: false,
    frameBounds: null,
    canvasBounds: windows[0],
    offset: { x: 0, y: 0 },
    editing: false,
    layoutSelected: false,
    drawingLaunch: false,
    active: true,
    focused: false,
    otherFocused: false,
    inFocusView: false,
    previewLayout: false,
    previewExiting: false,
    previewSelected: false,
    switcherOpen: false,
    selected: false,
    grouped: false,
    contentInert: false,
    onElement: fn(),
    onHover: fn(),
    onFocus: fn(),
    onMove: fn(),
    onMaximize: fn(),
    onToggleFocus: fn(),
    onClose: fn(),
    onResize: fn(),
    onSelectPreview: fn(),
    children: (
      <WindowContent
        {...settingsProps}
        item={windows[0]}
        note={workspace.note}
        onNoteChange={fn()}
      />
    ),
  },
  render: function Render(args) {
    const [host, setHost] = useState<HTMLDivElement | null>(null)
    return (
      <CanvasSample>
        <div ref={setHost} style={{ position: 'absolute', inset: 0 }} />
        <DesktopWindow {...args} container={host} />
      </CanvasSample>
    )
  },
})

export const Active = meta.story({})

export const Selected = meta.story({
  args: { selected: true, contentInert: true },
})

export const Focused = meta.story({
  args: { focused: true, inFocusView: true },
})

export const Pinned = meta.story({
  args: {
    attached: true,
    surface: 'frame',
    edge: 'top',
    frameBounds: { ...windows[0], y: 0 },
    offset: { x: 0, y: -168 },
  },
})
