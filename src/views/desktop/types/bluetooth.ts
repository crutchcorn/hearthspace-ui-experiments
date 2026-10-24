export type BluetoothDeviceId = 'headphones' | 'keyboard' | 'speaker' | 'phone'
type BluetoothAudioProfile = 'stereo' | 'hands-free'

export interface BluetoothDevice {
  id: BluetoothDeviceId
  name: string
  kind: 'headphones' | 'keyboard' | 'speaker' | 'phone'
  battery: number
  address: string
  services: string[]
  pairingMethod: 'pin' | 'comparison' | 'passkey'
  pairingCode: string
  available: boolean
  autoConnect: boolean
  audioProfile: BluetoothAudioProfile | null
}

interface BluetoothPairing {
  requestId: number
  deviceId: BluetoothDeviceId
  stage: BluetoothDevice['pairingMethod'] | 'pairing' | 'connecting' | 'failed'
  incoming: boolean
  error: string | null
}

export interface BluetoothModel {
  enabled: boolean
  devices: BluetoothDevice[]
  paired: BluetoothDeviceId[]
  connected: BluetoothDeviceId[]
  discovered: BluetoothDeviceId[]
  pairing: BluetoothPairing | null
  connecting: { deviceId: BluetoothDeviceId; token: number }[]
  failures: Partial<Record<BluetoothDeviceId, string>>
  scanning: number | null
  nextToken: number
  computerName: string
  discoverable: boolean
  allowNewPairings: boolean
  message: string | null
}

export type BluetoothDeviceSettings = Pick<
  BluetoothDevice,
  'name' | 'autoConnect' | 'audioProfile'
>
export type BluetoothAdapterSettings = Pick<
  BluetoothModel,
  'computerName' | 'discoverable' | 'allowNewPairings'
>

export interface BluetoothState {
  bluetoothEnabled: boolean
  setBluetoothEnabled: (enabled: boolean) => void
  bluetoothPairedIds: BluetoothDeviceId[]
  bluetoothConnectedIds: BluetoothDeviceId[]
  bluetoothLabel: string
  toggleBluetoothDevice: (deviceId: BluetoothDeviceId) => number | null
  bluetoothDevices: BluetoothDevice[]
  bluetoothDiscoveredIds: BluetoothDeviceId[]
  bluetoothPairing: BluetoothPairing | null
  bluetoothConnectingIds: BluetoothDeviceId[]
  bluetoothConnectionErrors: BluetoothModel['failures']
  bluetoothScanning: boolean
  bluetoothComputerName: string
  bluetoothDiscoverable: boolean
  bluetoothAllowNewPairings: boolean
  bluetoothMessage: string | null
  bluetoothStartPairing: (
    deviceId: BluetoothDeviceId,
    incoming?: boolean,
  ) => number
  bluetoothSubmitPin: (requestId: number, pin: string) => void
  bluetoothConfirmPairing: (requestId: number, matches: boolean) => void
  bluetoothCancelPairing: (requestId: number) => void
  bluetoothRetryConnection: (deviceId: BluetoothDeviceId) => void
  bluetoothRescan: () => void
  bluetoothForgetDevice: (deviceId: BluetoothDeviceId) => void
  bluetoothSetDeviceAvailable: (
    deviceId: BluetoothDeviceId,
    available: boolean,
  ) => void
  bluetoothUpdateDevice: (
    deviceId: BluetoothDeviceId,
    settings: BluetoothDeviceSettings,
  ) => void
  bluetoothUpdateAdapter: (settings: BluetoothAdapterSettings) => void
}
