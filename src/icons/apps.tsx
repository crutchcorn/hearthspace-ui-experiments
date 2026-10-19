import { createIcon } from './createIcon'

export const Compass = createIcon(
  'Compass',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="m15.5 7.5-2 5.5-5 3.5 2-5.5Z" />
    <path d="m10.5 11 3 2" />
  </>,
)

export const Folder = createIcon(
  'Folder',
  <>
    <path d="M3.5 9.5v-4a1 1 0 0 1 1-1h5l2.5 2.5h7.5a1 1 0 0 1 1 1v10.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1Z" />
    <path d="M3.5 9.5h17" />
  </>,
)

export const Terminal = createIcon(
  'Terminal',
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="m7 8.5 3.5 3.5L7 15.5m6.5 0h4" />
  </>,
)

export const Note = createIcon(
  'Note',
  <>
    <path d="M4.5 3.5h15a1 1 0 0 1 1 1v9l-7 7h-9a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
    <path d="M13.5 20.5v-6a1 1 0 0 1 1-1h6M7.5 8h9m-9 3.5h5" />
  </>,
)

export const Music = createIcon(
  'Music',
  <>
    <path d="M9 18V6l10-2.5v13M9 9.5 19 7" />
    <ellipse cx="6.5" cy="18" rx="2.5" ry="2" />
    <ellipse cx="16.5" cy="16.5" rx="2.5" ry="2" />
  </>,
)

export const Photo = createIcon(
  'Photo',
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
    <path d="M3.5 14.5h4l4-4 6 6h3" />
    <circle cx="16.5" cy="8.5" r="1.5" />
  </>,
)

export const Calendar = createIcon(
  'Calendar',
  <>
    <rect x="4" y="5.5" width="16" height="15" rx="1.5" />
    <path d="M8 3.5v4m8-4v4M4 10h16" />
    <path d="M7.5 13.5h1m3 0h1m3 0h1m-9 4h1m3 0h1m3 0h1" />
  </>,
)

export const AppSettings = createIcon(
  'AppSettings',
  <>
    <path d="M8 3.5V7m0 4v9.5M16 3.5V14m0 4v2.5" />
    <rect x="6" y="7" width="4" height="4" rx="0.5" />
    <rect x="14" y="14" width="4" height="4" rx="0.5" />
  </>,
)

export const FileText = createIcon(
  'FileText',
  <>
    <path d="M6 3.5h8l5 5v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-15a1 1 0 0 1 1-1Z" />
    <path d="M14 3.5v4a1 1 0 0 0 1 1h4M8 12.5h8m-8 4h5" />
  </>,
)

export const ImagePlus = createIcon(
  'ImagePlus',
  <>
    <path d="M11 4.5H5A1.5 1.5 0 0 0 3.5 6v12A1.5 1.5 0 0 0 5 19.5h14a1.5 1.5 0 0 0 1.5-1.5v-7" />
    <path d="M3.5 14.5h4l4-4 6 6h3M18 3v5m-2.5-2.5h5" />
  </>,
)
