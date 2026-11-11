import { useEffect, useState } from 'react'
import { WIFI_NETWORKS } from '../constants/system-status'
import type {
  SystemStatus,
  WifiNetworkId,
  BluetoothDeviceId,
} from '../types/system-status'

export function useSystemStatus(): SystemStatus {
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [wifiNetworkId, setWifiNetworkId] = useState<WifiNetworkId | null>(
    'studio',
  )
  const wifiNetwork = wifiEnabled
    ? (WIFI_NETWORKS.find((network) => network.id === wifiNetworkId) ?? null)
    : null
  const wifiLabel = wifiEnabled
    ? (wifiNetwork?.name ?? 'Not connected')
    : 'Wi-Fi off'
  const [bluetooth, setBluetooth] = useState<{
    enabled: boolean
    paired: BluetoothDeviceId[]
    connected: BluetoothDeviceId[]
  }>({
    enabled: true,
    paired: ['headphones', 'keyboard'],
    connected: ['headphones'],
  })
  const bluetoothLabel = !bluetooth.enabled
    ? 'Bluetooth off'
    : bluetooth.connected.length
      ? `${bluetooth.connected.length} connected`
      : 'Not connected'
  const [volume, setVolume] = useState(64)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  function selectWifiNetwork(id: WifiNetworkId | null) {
    if (wifiEnabled) setWifiNetworkId(id)
  }

  function setBluetoothEnabled(enabled: boolean) {
    setBluetooth((current) => ({
      ...current,
      enabled,
      connected: enabled ? current.connected : [],
    }))
  }

  function toggleBluetoothDevice(id: BluetoothDeviceId) {
    setBluetooth((current) => {
      if (!current.enabled) return current
      return {
        ...current,
        paired: current.paired.includes(id)
          ? current.paired
          : [...current.paired, id],
        connected: current.connected.includes(id)
          ? current.connected.filter((connectedId) => connectedId !== id)
          : [...current.connected, id],
      }
    })
  }

  return {
    wifiEnabled,
    setWifiEnabled,
    wifiNetwork,
    wifiLabel,
    selectWifiNetwork,
    bluetoothEnabled: bluetooth.enabled,
    bluetoothPairedIds: bluetooth.paired,
    bluetoothConnectedIds: bluetooth.connected,
    bluetoothLabel,
    setBluetoothEnabled,
    toggleBluetoothDevice,
    volume,
    setVolume,
    now,
    batteryPercentage: 87,
  }
}
