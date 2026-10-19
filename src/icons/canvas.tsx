import { createIcon } from './createIcon'

export const Pan = createIcon(
  'pan-canvas',
  <>
    <path d="M12 3v5M9 6l3-3 3 3M12 16v5m-3-3 3 3 3-3M3 12h5m-2-3-3 3 3 3m10-3h5m-3-3 3 3-3 3" />
    <circle cx="12" cy="12" r="1.5" />
  </>,
)

export const Lasso = createIcon(
  'freeform-selection',
  <>
    <ellipse
      cx="10.5"
      cy="7.75"
      rx="7.65"
      ry="4.95"
      transform="rotate(-18 10.5 7.75)"
    />
    <circle cx="5.1" cy="11.35" r="1.8" />
    <path d="M5.1 13.15v3.35a3 3 0 0 0 3 3h1.4" />
    <path d="m14.2 13.4 7.2 4.4-3.2.8-1.6 2.8Z" />
  </>,
)

export const Overview = createIcon(
  'canvas-overview',
  <>
    <path d="M3.5 8V3.5H8m8 0h4.5V8m0 8v4.5H16m-8 0H3.5V16" />
    <rect x="7" y="7" width="9" height="8" rx="1" />
    <path d="M10 10h3" />
  </>,
)

export const Cursor = createIcon(
  'desktop-cursor',
  <path d="M4 3.5 19.5 12l-7 2-3 6Z" />,
)

export const FrameLayout = createIcon(
  'change-layout',
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
    <path d="M8 3.5v17M3.5 8h17" />
    <rect x="11" y="11" width="6.5" height="6" rx="0.75" />
  </>,
)

export const Pencil = createIcon(
  'draw',
  <>
    <path d="m4 20 1-5L16 4l4 4L9 19Z" />
    <path d="m13 7 4 4M5 15l4 4" />
  </>,
)

export const Search = createIcon(
  'search-canvas',
  <>
    <circle cx="9.5" cy="9.5" r="6" />
    <path d="m14 14 6.5 6.5" />
  </>,
)

export const RectangleSelect = createIcon(
  'rectangle-selection',
  <>
    <path d="M3.5 8V3.5H8m3.5 0h3m4 0V8M3.5 11.5v3m0 4H8" />
    <path d="m11.5 10.5 9 5.5-4 1-2 3.5Z" />
  </>,
)

export const Layers = createIcon(
  'canvas-layers',
  <>
    <path d="m4 8 8-4 8 4-8 4Z" />
    <path d="m4 14 8 4 8-4" />
  </>,
)

export const BackgroundLayer = createIcon(
  'canvas-background',
  <>
    <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
    <path d="m7 11 4-4m-4 10L17 7m-4 10 4-4" />
  </>,
)

export const Ungroup = createIcon(
  'ungroup',
  <>
    <rect x="3.5" y="3.5" width="6" height="6" rx="0.75" />
    <rect x="14.5" y="14.5" width="6" height="6" rx="0.75" />
    <path d="M4 16.5v4h4m-4 0 5-5M16.5 4h4v4m0-4-5 5" />
  </>,
)

export const AppsGrid = createIcon(
  'applications',
  <>
    <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="3.5" y="14" width="6.5" height="6.5" rx="1" />
    <rect x="14" y="14" width="6.5" height="6.5" rx="1" />
  </>,
)

export const ArrangeWindows = createIcon(
  'arrange-windows',
  <>
    <rect x="3.5" y="3.5" width="7.5" height="17" rx="1" />
    <rect x="14" y="3.5" width="6.5" height="6.5" rx="1" />
    <rect x="14" y="14" width="6.5" height="6.5" rx="1" />
  </>,
)

export const GatherWindows = createIcon(
  'gather-windows',
  <>
    <path d="M7 15H4.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1H14a1 1 0 0 1 1 1V7" />
    <rect x="9" y="9" width="11.5" height="11.5" rx="1" />
  </>,
)

export const GestureStroke = createIcon(
  'gesture',
  <>
    <path d="M4.5 15.5 8 6l5 12 4-10h1.5" />
    <circle cx="4" cy="17" r="1" />
    <circle cx="20" cy="8" r="1" />
  </>,
)

export const Eraser = createIcon(
  'eraser',
  <>
    <path d="m4 14 8-10 8 6.5-7.5 9.5H9Z" />
    <path d="m8 9 8 6.5M12.5 20H21" />
  </>,
)

export const Pin = createIcon(
  'pin-to-top',
  <>
    <path d="M8 3.5h8m-7 0v6L6 13v2h12v-2l-3-3.5v-6M12 15v5.5" />
  </>,
)
