import preview from '../../../../.storybook/preview'
import CanvasSearch from './canvas-search'
import { fn } from 'storybook/test'
import { useArgs } from 'storybook/preview-api'
import { CanvasSample } from '../../../../.storybook/surfaces'
import HandwritingPad from './handwriting-pad'

function HandwritingSample({ onText }: { onText: (text: string) => void }) {
  return (
    <HandwritingPad
      strokes={[
        [
          { x: 45, y: 58 },
          { x: 70, y: 28 },
          { x: 95, y: 58 },
        ],
      ]}
      drawing={false}
      busy={false}
      error=""
      message=""
      clear={fn()}
      readInk={async () => onText('Scratchpad')}
      onPointerDown={fn()}
      onPointerMove={fn()}
      onPointerUp={fn()}
      onPointerCancel={fn()}
    />
  )
}

const meta = preview.meta({
  title: 'Desktop/Canvas/Search Field',
  component: CanvasSearch,
  args: {
    position: { x: 140, y: 58, width: 360 },
    query: '',
    empty: false,
    resultsAbove: false,
    handwritingOpen: false,
    Handwriting: HandwritingSample,
    onQueryChange: fn(),
    onRecognizedText: fn(),
    onHandwritingOpenChange: fn(),
    onClose: fn(),
    onActivate: fn(),
    onNavigate: fn(),
  },
  decorators: [
    (Story) => (
      <CanvasSample>
        <Story />
      </CanvasSample>
    ),
  ],
  render: function Render(args) {
    const [, updateArgs] = useArgs()
    return (
      <CanvasSearch
        {...args}
        onQueryChange={(query) => {
          args.onQueryChange(query)
          updateArgs({ query })
        }}
        onHandwritingOpenChange={(handwritingOpen) => {
          args.onHandwritingOpenChange(handwritingOpen)
          updateArgs({ handwritingOpen })
        }}
        onRecognizedText={(text) => {
          args.onRecognizedText(text)
          updateArgs({ query: `${args.query.trimEnd()} ${text}`.trim() })
        }}
      />
    )
  },
})

export const Search = meta.story({})

export const NoMatches = meta.story({
  args: { query: 'unmatched item', empty: true },
})

export const Handwriting = meta.story({ args: { handwritingOpen: true } })
