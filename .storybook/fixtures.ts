import { fn } from 'storybook/test'
import { INITIAL_NOTIFICATIONS } from '../src/views/desktop/constants/notifications'
import type { AIControls } from '../src/views/desktop/types/ai'
import type {
  Bounds,
  DesktopItem,
  DesktopWindow,
  Workspace,
} from '../src/views/desktop/types/desktop'
import type { CanvasDrawing } from '../src/views/desktop/types/drawing'
import type { GestureShortcut } from '../src/views/desktop/types/gestures'
import type { NotificationsState } from '../src/views/desktop/types/notifications'
import type { SystemStatus } from '../src/views/desktop/types/system-status'
import { createBluetoothModel } from '../src/views/desktop/utils/bluetooth'
import { readFrameLayout } from '../src/views/desktop/utils/frame-layout'
import { createWifiSession } from '../src/views/desktop/utils/wifi'

export const viewport: Bounds = { x: 0, y: 0, width: 640, height: 360 }
export const clock = new Date(2026, 10, 11, 14, 5)
export const frameLayout = readFrameLayout(undefined)

export const windows: DesktopWindow[] = [
  {
    id: 'notes',
    title: 'Scratchpad',
    kind: 'notes',
    x: 80,
    y: 78,
    width: 320,
    height: 212,
  },
  {
    id: 'files',
    title: 'Files',
    kind: 'empty',
    appId: 'files',
    x: 310,
    y: 136,
    width: 290,
    height: 200,
  },
  {
    id: 'browser',
    title: 'Browser',
    kind: 'empty',
    appId: 'browser',
    x: 690,
    y: 210,
    width: 320,
    height: 240,
  },
]

export const items: DesktopItem[] = [
  {
    id: 'projects',
    title: 'Projects',
    kind: 'folder',
    appId: 'files',
    x: 36,
    y: 44,
    width: 88,
    height: 96,
  },
  {
    id: 'notes-file',
    title: 'Notes.txt',
    kind: 'file',
    appId: 'notes',
    x: 140,
    y: 44,
    width: 88,
    height: 96,
  },
  {
    id: 'settings',
    title: 'Settings',
    kind: 'app',
    appId: 'settings',
    x: 244,
    y: 44,
    width: 88,
    height: 96,
  },
]

export const drawing: CanvasDrawing = {
  id: 'arrow',
  layer: 'above',
  x: 128,
  y: 135,
  width: 174,
  height: 72,
  strokes: [
    [
      { x: 8, y: 51 },
      { x: 40, y: 40 },
      { x: 83, y: 33 },
      { x: 165, y: 33 },
    ],
    [
      { x: 130, y: 7 },
      { x: 165, y: 33 },
      { x: 130, y: 65 },
    ],
  ],
}

export const workspace: Workspace = {
  width: 1440,
  height: 840,
  home: { x: 0, y: 0 },
  note: 'Interface notes\n\nKeep current work in view while exploring the canvas.',
  windows,
  items,
  drawings: [drawing],
}

export const gestureShortcuts: GestureShortcut[] = [
  {
    appId: 'terminal',
    points: [
      { x: 154, y: 52 },
      { x: 274, y: 52 },
      { x: 154, y: 140 },
      { x: 274, y: 140 },
    ],
  },
]

export const notifications: NotificationsState = {
  notifications: INITIAL_NOTIFICATIONS,
  unreadCount: INITIAL_NOTIFICATIONS.length,
  markRead: fn(),
  markAllRead: fn(),
  dismiss: fn(),
  previewNotification: fn(
    (index: number) =>
      INITIAL_NOTIFICATIONS[index % INITIAL_NOTIFICATIONS.length],
  ),
}

const wifi = createWifiSession()
const bluetooth = createBluetoothModel()

export const systemStatus: SystemStatus = {
  now: clock,
  volume: 64,
  setVolume: fn(),
  batteryPercentage: 87,
  wifiEnabled: true,
  wifiNetwork:
    wifi.networks.find((network) => network.id === wifi.connectedId) ?? null,
  wifiNetworks: wifi.networks,
  wifiLabel: 'Studio network',
  wifiConnectionStatus: 'Connected',
  wifiPendingNetwork: null,
  wifiScanning: false,
  wifiScanCount: 0,
  wifiFeedback: null,
  setWifiEnabled: fn(),
  selectWifiNetwork: fn(),
  wifiConnect: fn(() => null),
  wifiJoinHiddenNetwork: fn(() => null),
  wifiSaveSettings: fn(() => null),
  wifiScan: fn(),
  wifiCancelConnection: fn(),
  wifiForgetNetwork: fn(),
  wifiAcceptPortal: fn(),
  wifiClearFeedback: fn(),
  bluetoothEnabled: true,
  bluetoothPairedIds: bluetooth.paired,
  bluetoothConnectedIds: bluetooth.connected,
  bluetoothLabel: '1 connected',
  bluetoothDevices: bluetooth.devices,
  bluetoothDiscoveredIds: bluetooth.discovered,
  bluetoothPairing: null,
  bluetoothConnectingIds: [],
  bluetoothConnectionErrors: {},
  bluetoothScanning: false,
  bluetoothComputerName: bluetooth.computerName,
  bluetoothDiscoverable: bluetooth.discoverable,
  bluetoothAllowNewPairings: bluetooth.allowNewPairings,
  bluetoothMessage: null,
  setBluetoothEnabled: fn(),
  toggleBluetoothDevice: fn(() => null),
  bluetoothStartPairing: fn(() => 1),
  bluetoothSubmitPin: fn(),
  bluetoothConfirmPairing: fn(),
  bluetoothCancelPairing: fn(),
  bluetoothRetryConnection: fn(),
  bluetoothRescan: fn(),
  bluetoothForgetDevice: fn(),
  bluetoothSetDeviceAvailable: fn(),
  bluetoothUpdateDevice: fn(),
  bluetoothUpdateAdapter: fn(),
}

export const ai: AIControls = {
  enabled: false,
  downloading: false,
  progress: 0,
  setEnabled: fn(),
}

export const backgroundProps = {
  background: null,
  backgroundBusy: false,
  backgroundError: null,
  onBackgroundUpload: fn(),
  onBackgroundFitChange: fn(),
  onBackgroundReset: fn(),
}

export const settingsProps = {
  ...backgroundProps,
  ai,
  status: systemStatus,
  colorMode: 'light' as const,
  accentTheme: 'orange' as const,
  allowHideTools: false,
  gestureShortcuts,
  onColorModeChange: fn(),
  onAccentThemeChange: fn(),
  onAllowHideToolsChange: fn(),
  onRestoreCanvasTools: fn(),
  onChangeLayout: fn(),
  onSaveGestureShortcut: fn(),
  onRemoveGestureShortcut: fn(),
}
