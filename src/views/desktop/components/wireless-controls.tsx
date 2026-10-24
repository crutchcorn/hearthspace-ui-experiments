import type { SystemStatus } from '../types/system-status'
import WifiControls from './wifi-controls'
import BluetoothControls from './bluetooth-controls'

interface WirelessControlsProps {
  kind: 'wifi' | 'bluetooth'
  status: SystemStatus
  presentation?: 'popover' | 'settings'
}

export default function WirelessControls({
  kind,
  status,
  presentation = 'popover',
}: WirelessControlsProps) {
  return kind === 'wifi' ? (
    <WifiControls status={status} presentation={presentation} />
  ) : (
    <BluetoothControls status={status} presentation={presentation} />
  )
}
