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

const bluetooth = <path d="m6 6 12 12-6 4V2l6 4L6 18" />

export const Bluetooth = createIcon('Bluetooth', bluetooth)

export const BluetoothOff = createIcon(
  'BluetoothOff',
  <>
    {bluetooth}
    <path d="m3 3 18 18" />
  </>,
)

export const Headphones = createIcon(
  'Headphones',
  <>
    <path d="M4 13V10a8 8 0 0 1 16 0v3" />
    <rect x="3" y="12" width="5" height="9" rx="1" />
    <rect x="16" y="12" width="5" height="9" rx="1" />
  </>,
)

export const Keyboard = createIcon(
  'Keyboard',
  <>
    <rect x="2" y="5" width="20" height="14" rx="1" />
    <path d="M6 9h1m4 0h1m4 0h2M6 12h1m4 0h1m4 0h2M7 16h10" />
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
    <path d="M9.56 5.53Q9.95 5.31 10.05 4.87L10.34 3.58Q10.44 3.14 10.89 3.14L13.11 3.14Q13.56 3.14 13.66 3.58L13.95 4.87Q14.05 5.31 14.44 5.53L16.38 6.66Q16.77 6.88 17.2 6.75L18.47 6.35Q18.89 6.21 19.12 6.6L20.23 8.53Q20.46 8.92 20.13 9.23L19.15 10.12Q18.82 10.43 18.82 10.88L18.82 13.12Q18.82 13.57 19.15 13.88L20.13 14.77Q20.46 15.08 20.23 15.47L19.12 17.4Q18.89 17.79 18.47 17.65L17.2 17.25Q16.77 17.12 16.38 17.34L14.44 18.47Q14.05 18.69 13.95 19.13L13.66 20.42Q13.56 20.86 13.11 20.86L10.89 20.86Q10.44 20.86 10.34 20.42L10.05 19.13Q9.95 18.69 9.56 18.47L7.62 17.34Q7.23 17.12 6.8 17.25L5.53 17.65Q5.11 17.79 4.88 17.4L3.77 15.47Q3.54 15.08 3.87 14.77L4.85 13.88Q5.18 13.57 5.18 13.12L5.18 10.88Q5.18 10.43 4.85 10.12L3.87 9.23Q3.54 8.92 3.77 8.53L4.88 6.6Q5.11 6.21 5.53 6.35L6.8 6.75Q7.23 6.88 7.62 6.66Z" />
    <circle cx="12" cy="12" r="3" />
  </>,
)
