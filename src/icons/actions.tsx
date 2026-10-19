import { createIcon } from './createIcon'

export const ArrowLeft = createIcon(
  'arrow-left',
  <path d="M20 12H4m6-6-6 6 6 6" />,
)

export const ArrowUpRight = createIcon(
  'open',
  <path d="M5 19 19 5M9 5h10v10" />,
)

export const ArrowDownRight = createIcon(
  'resize',
  <path d="m6 6 13 13M9 19h10V9" />,
)

export const ChevronLeft = createIcon('previous', <path d="m15 5-7 7 7 7" />)
export const ChevronRight = createIcon('next', <path d="m9 5 7 7-7 7" />)
export const ChevronUp = createIcon('expand-up', <path d="m5 15 7-7 7 7" />)
export const ChevronDown = createIcon('expand-down', <path d="m5 9 7 7 7-7" />)

export const Check = createIcon('check', <path d="m5 12 4.5 4.5L19 7" />)
export const CheckCheck = createIcon(
  'read-all',
  <path d="m3 12 4.5 4.5L17 7m-5 7 2.5 2.5L22 9" />,
)
export const Plus = createIcon('add', <path d="M5 12h14M12 5v14" />)
export const X = createIcon('close', <path d="m6 6 12 12M6 18 18 6" />)

export const CornerDownLeft = createIcon(
  'enter',
  <path d="M20 5v9H4m5-5-5 5 5 5" />,
)

export const GripVertical = createIcon(
  'reorder',
  <path d="M9 4v3m6-3v3m-6 4v3m6-3v3m-6 4v3m6-3v3" />,
)

export const Grip = createIcon(
  'move-group',
  <path d="M4 9h3m4 0h3m4 0h3M4 15h3m4 0h3m4 0h3" />,
)

export const List = createIcon(
  'list',
  <path d="M4 5.5h2m4 0h10M4 12h2m4 0h10M4 18.5h2m4 0h10" />,
)

export const Hourglass = createIcon(
  'processing',
  <>
    <path d="M6 3.5h12m-12 17h12M7 3.5v4l5 4.5-5 4.5v4m10-17v4L12 12l5 4.5v4" />
    <path d="M10 6.5h4" />
  </>,
)

export const Maximize = createIcon(
  'focus-window',
  <path d="M3.5 9v-5.5H9m6 0h5.5V9m0 6v5.5H15m-6 0H3.5V15" />,
)

export const Minimize = createIcon(
  'restore-window',
  <path d="M3.5 9H9V3.5m6 0V9h5.5m0 6H15v5.5m-6 0V15H3.5" />,
)

export const PanelLeft = createIcon(
  'sidebar',
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1" />
    <path d="M9 4.5v15m-3-10v5" />
  </>,
)

export const Play = createIcon('play', <path d="M7 4.5 20 12 7 19.5Z" />)

export const RotateCcw = createIcon(
  'reset',
  <path d="M4.5 9a8 8 0 1 1-.3 6M4.5 3.5V9H10" />,
)

export const Square = createIcon(
  'compact',
  <rect x="5" y="5" width="14" height="14" rx="1" />,
)

export const Trash2 = createIcon(
  'remove',
  <>
    <path d="M3.5 6.5h17M8.5 6.5v-3h7v3M5.5 6.5l1 14h11l1-14M10 10.5v6m4-6v6" />
  </>,
)

const magnifier = (
  <>
    <circle cx="9.5" cy="9.5" r="6" />
    <path d="m14 14 6.5 6.5" />
  </>
)

export const ZoomIn = createIcon(
  'zoom-in',
  <>
    {magnifier}
    <path d="M6.5 9.5h6m-3-3v6" />
  </>,
)

export const ZoomOut = createIcon(
  'zoom-out',
  <>
    {magnifier}
    <path d="M6.5 9.5h6" />
  </>,
)
