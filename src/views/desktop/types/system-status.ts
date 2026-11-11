import type {
  BLUETOOTH_DEVICES,
  WIFI_NETWORKS,
} from '../constants/system-status'

export type WifiNetworkId = (typeof WIFI_NETWORKS)[number]['id']
export type BluetoothDeviceId = (typeof BLUETOOTH_DEVICES)[number]['id']

export interface SystemStatus {
  wifiEnabled: boolean
  setWifiEnabled: (enabled: boolean) => void
  wifiNetwork: (typeof WIFI_NETWORKS)[number] | null
  wifiLabel: string
  selectWifiNetwork: (id: WifiNetworkId | null) => void
  bluetoothEnabled: boolean
  bluetoothPairedIds: BluetoothDeviceId[]
  bluetoothConnectedIds: BluetoothDeviceId[]
  bluetoothLabel: string
  setBluetoothEnabled: (enabled: boolean) => void
  toggleBluetoothDevice: (id: BluetoothDeviceId) => void
  volume: number
  setVolume: (volume: number) => void
  now: Date
  batteryPercentage: number
}

export type SystemPanel =
  'wifi' | 'bluetooth' | 'volume' | 'battery' | 'clock' | 'power' | null
