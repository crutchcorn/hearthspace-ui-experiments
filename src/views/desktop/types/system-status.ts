import type { WifiState } from './wifi'
import type { BluetoothState } from './bluetooth'

export interface SystemStatus extends WifiState, BluetoothState {
  volume: number
  setVolume: (volume: number) => void
  now: Date
  batteryPercentage: number
}

export type SystemPanel =
  'wifi' | 'bluetooth' | 'volume' | 'battery' | 'clock' | 'power' | null
