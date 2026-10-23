import { createIcon } from './createIcon'

export const Power = createIcon(
  'Power',
  <>
    <path d="M12 3v9M7 5.5a8.5 8.5 0 1 0 10 0" />
  </>,
)

export const Lock = createIcon(
  'Lock',
  <>
    <rect x="5" y="10" width="14" height="11" rx="1" />
    <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
  </>,
)

export const LogOut = createIcon(
  'LogOut',
  <path d="M10 3H4v18h6M9 12h12m-5-5 5 5-5 5" />,
)

export const User = createIcon(
  'User',
  <>
    <circle cx="12" cy="7" r="4" />
    <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
  </>,
)

export const Eye = createIcon(
  'Eye',
  <>
    <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
)

const batteryCase = (
  <>
    <rect x="3" y="7" width="16" height="10" rx="1" />
    <path d="M21 10v4" />
  </>
)

export const BatteryFull = createIcon(
  'BatteryFull',
  <>
    {batteryCase}
    <path d="M6.5 10v4M11 10v4M15.5 10v4" />
  </>,
)

const bell = <path d="M7 16V9l2-3h6l2 3v7l2 2H5l2-2ZM12 3v3M10 21h4" />

export const Bell = createIcon('Bell', bell)

export const BellUnread = createIcon(
  'BellUnread',
  <>
    {bell}
    <circle cx="19.5" cy="4.5" r="1.5" fill="currentColor" stroke="none" />
  </>,
)

export const Clock = createIcon(
  'Clock',
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 6v6h5" />
  </>,
)

const speaker = <path d="M3 9h4l5-4v14l-5-4H3V9Z" />

export const Volume = createIcon(
  'Volume',
  <>
    {speaker}
    <path d="M16 8c2.5 2 2.5 6 0 8M18 5c3.5 3.7 3.5 10.3 0 14" />
  </>,
)

export const VolumeMuted = createIcon(
  'VolumeMuted',
  <>
    {speaker}
    <path d="m16 9 5 6m0-6-5 6" />
  </>,
)

const wifiBands = (
  <>
    <path d="M3 8c5-4 13-4 18 0M6.5 11.5c3.1-2.5 7.9-2.5 11 0M10 14.5c1.1-.8 2.9-.8 4 0" />
    <circle cx="12" cy="20" r="1" />
  </>
)

export const Wifi = createIcon('Wifi', wifiBands)

export const WifiOff = createIcon(
  'WifiOff',
  <>
    {wifiBands}
    <path d="m4 20 16-16" />
  </>,
)

export const Monitor = createIcon(
  'Monitor',
  <>
    <rect x="3" y="4" width="18" height="13" rx="1" />
    <path d="M12 17v4M9 21h6" />
  </>,
)

export const Laptop = createIcon(
  'Laptop',
  <>
    <rect x="5" y="4" width="14" height="12" rx="1" />
    <path d="m5 16-2 4h18l-2-4" />
  </>,
)

export const Sun = createIcon(
  'Sun',
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5 7 7M17 17l1.5 1.5M5.5 18.5 7 17M17 7l1.5-1.5" />
  </>,
)

export const Moon = createIcon(
  'Moon',
  <path d="M15 3.5A8.5 8.5 0 1 0 20.5 15A8 8 0 0 1 15 3.5Z" />,
)

export const Appearance = createIcon(
  'Appearance',
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 3.5v17M12 12h8.5" />
  </>,
)

export const Processor = createIcon(
  'Processor',
  <>
    <rect x="6" y="6" width="12" height="12" rx="1" />
    <path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3" />
    <rect x="9" y="10" width="6" height="4" />
  </>,
)

export const Sliders = createIcon(
  'Sliders',
  <>
    <path d="M3 5h4m4 0h10M3 12h11m4 0h3M3 19h6m4 0h8" />
    <rect x="7" y="3" width="4" height="4" rx="1" />
    <rect x="14" y="10" width="4" height="4" rx="1" />
    <rect x="9" y="17" width="4" height="4" rx="1" />
  </>,
)

export const Settings = createIcon(
  'Settings',
  <>
    <path d="M9 3h6v2l2 2h2v2h2v6h-2v2h-2l-2 2v2H9v-2l-2-2H5v-2H3V9h2V7h2l2-2V3Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
)
