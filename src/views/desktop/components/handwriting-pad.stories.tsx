import preview from '../../../../.storybook/preview'
import HandwritingPad from './handwriting-pad'
import { fn } from 'storybook/test'

const meta = preview.meta({
  title: 'Desktop/Canvas/Handwriting Pad',
  component: HandwritingPad,
  args: {
    strokes: [
      [
        { x: 46, y: 65 },
        { x: 46, y: 24 },
        { x: 71, y: 65 },
        { x: 71, y: 24 },
      ],
    ],
    drawing: false,
    busy: false,
    error: '',
    message: '',
    clear: fn(),
    readInk: fn(async () => {}),
    onPointerDown: fn(),
    onPointerMove: fn(),
    onPointerUp: fn(),
    onPointerCancel: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ width: 'min(420px, calc(100vw - 48px))' }}>
        <Story />
      </div>
    ),
  ],
})

export const Ink = meta.story({})

export const Downloading = meta.story({
  args: { busy: true, message: 'Downloading handwriting… · 46%' },
})

export const Retry = meta.story({
  args: {
    error: 'Could not read that. Try writing it again.',
    message: 'Could not read that. Try writing it again.',
  },
})
