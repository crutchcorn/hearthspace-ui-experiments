import { useCallback, useEffect, useReducer, useRef } from 'react'
import type {
  BluetoothAdapterSettings,
  BluetoothDeviceId,
  BluetoothDeviceSettings,
  BluetoothState,
} from '../types/bluetooth'
import { bluetoothReducer, createBluetoothModel } from '../utils/bluetooth'

export function useBluetooth(): BluetoothState {
  const [bluetooth, dispatch] = useReducer(
    bluetoothReducer,
    undefined,
    createBluetoothModel,
  )
  const pairingSequence = useRef(0)
  const connectionTimers = useRef(new Map<number, number>())

  useEffect(() => {
    const timers = connectionTimers.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  useEffect(() => {
    if (bluetooth.pairing?.stage !== 'pairing') return
    const requestId = bluetooth.pairing.requestId
    const timer = window.setTimeout(
      () => dispatch({ type: 'finish-pairing', requestId }),
      550,
    )
    return () => window.clearTimeout(timer)
  }, [bluetooth.pairing])

  useEffect(() => {
    const timers = connectionTimers.current
    const activeTokens = new Set(
      bluetooth.connecting.map((connection) => connection.token),
    )
    for (const [token, timer] of timers) {
      if (activeTokens.has(token)) continue
      window.clearTimeout(timer)
      timers.delete(token)
    }
    // Other devices must not restart an attempt's original deadline.
    for (const { deviceId, token } of bluetooth.connecting) {
      if (timers.has(token)) continue
      timers.set(
        token,
        window.setTimeout(
          () => dispatch({ type: 'finish-connection', deviceId, token }),
          700,
        ),
      )
    }
  }, [bluetooth.connecting])

  useEffect(() => {
    if (bluetooth.scanning === null) return
    const token = bluetooth.scanning
    const timer = window.setTimeout(
      () => dispatch({ type: 'finish-scan', token }),
      900,
    )
    return () => window.clearTimeout(timer)
  }, [bluetooth.scanning])

  function bluetoothStartPairing(
    deviceId: BluetoothDeviceId,
    incoming = false,
  ) {
    const requestId = ++pairingSequence.current
    dispatch({ type: 'start-pairing', deviceId, requestId, incoming })
    return requestId
  }

  function toggleBluetoothDevice(deviceId: BluetoothDeviceId) {
    if (!bluetooth.paired.includes(deviceId))
      return bluetoothStartPairing(deviceId)
    dispatch({ type: 'toggle', deviceId })
    return null
  }

  const bluetoothCancelPairing = useCallback((requestId: number) => {
    dispatch({ type: 'cancel-pairing', requestId })
  }, [])

  return {
    bluetoothEnabled: bluetooth.enabled,
    setBluetoothEnabled: (enabled: boolean) =>
      dispatch({ type: 'radio', enabled }),
    bluetoothPairedIds: bluetooth.paired,
    bluetoothConnectedIds: bluetooth.connected,
    bluetoothLabel: !bluetooth.enabled
      ? 'Bluetooth off'
      : bluetooth.connected.length
        ? `${bluetooth.connected.length} connected`
        : 'Not connected',
    toggleBluetoothDevice,
    bluetoothDevices: bluetooth.devices,
    bluetoothDiscoveredIds: bluetooth.discovered,
    bluetoothPairing: bluetooth.pairing,
    bluetoothConnectingIds: bluetooth.connecting.map((item) => item.deviceId),
    bluetoothConnectionErrors: bluetooth.failures,
    bluetoothScanning: bluetooth.scanning !== null,
    bluetoothComputerName: bluetooth.computerName,
    bluetoothDiscoverable: bluetooth.discoverable,
    bluetoothAllowNewPairings: bluetooth.allowNewPairings,
    bluetoothMessage: bluetooth.message,
    bluetoothStartPairing,
    bluetoothSubmitPin: (requestId: number, pin: string) =>
      dispatch({ type: 'pin', requestId, pin }),
    bluetoothConfirmPairing: (requestId: number, matches: boolean) =>
      dispatch({ type: 'confirm', requestId, matches }),
    bluetoothCancelPairing,
    bluetoothRetryConnection: (deviceId: BluetoothDeviceId) =>
      dispatch({ type: 'retry', deviceId }),
    bluetoothRescan: () => dispatch({ type: 'scan' }),
    bluetoothForgetDevice: (deviceId: BluetoothDeviceId) =>
      dispatch({ type: 'forget', deviceId }),
    bluetoothSetDeviceAvailable: (
      deviceId: BluetoothDeviceId,
      available: boolean,
    ) => dispatch({ type: 'availability', deviceId, available }),
    bluetoothUpdateDevice: (
      deviceId: BluetoothDeviceId,
      settings: BluetoothDeviceSettings,
    ) => dispatch({ type: 'update-device', deviceId, settings }),
    bluetoothUpdateAdapter: (settings: BluetoothAdapterSettings) =>
      dispatch({ type: 'adapter', ...settings }),
  }
}
