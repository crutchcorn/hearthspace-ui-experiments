import {
  ArrangeWindows,
  Pan,
  Lasso,
  Overview,
  Cursor,
  FrameLayout,
  Pencil,
  Search,
  RectangleSelect,
} from '../../../components/icons'
import type { CANVAS_TOOLS } from '../constants/canvas-tool-catalog'

const GLYPHS = {
  cursor: Cursor,
  pan: Pan,
  search: Search,
  rectangle: RectangleSelect,
  freeform: Lasso,
  draw: Pencil,
  layout: FrameLayout,
  map: Overview,
  arrange: ArrangeWindows,
} satisfies Record<keyof typeof CANVAS_TOOLS, typeof Cursor>

export default function CanvasToolIcon({
  tool,
  size,
}: {
  tool: keyof typeof CANVAS_TOOLS
  size: number
}) {
  const Icon = GLYPHS[tool]
  return <Icon size={size} aria-hidden="true" />
}
