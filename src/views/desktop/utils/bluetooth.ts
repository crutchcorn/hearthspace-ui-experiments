import { BLUETOOTH_DEVICES } from '../constants/bluetooth'
import type {
  BluetoothDeviceId,
  BluetoothDeviceSettings,
  BluetoothModel,
} from '../types/bluetooth'

type BluetoothAction =
  | { type: 'radio'; enabled: boolean }
  | { type: 'toggle'; deviceId: BluetoothDeviceId }
  | {
      type: 'start-pairing'
      deviceId: BluetoothDeviceId
      requestId: number
      incoming: boolean
    }
  | { type: 'pin'; requestId: number; pin: string }
  | { type: 'confirm'; requestId: number; matches: boolean }
  | { type: 'cancel-pairing'; requestId: number }
  | { type: 'finish-pairing'; requestId: number }
  | { type: 'finish-connection'; deviceId: BluetoothDeviceId; token: number }
  | { type: 'retry'; deviceId: BluetoothDeviceId }
  | { type: 'scan' }
  | { type: 'finish-scan'; token: number }
  | { type: 'forget'; deviceId: BluetoothDeviceId }
  | { type: 'availability'; deviceId: BluetoothDeviceId; available: boolean }
  | {
      type: 'update-device'
      deviceId: BluetoothDeviceId
      settings: BluetoothDeviceSettings
    }
  | {
      type: 'adapter'
      computerName: string
      discoverable: boolean
      allowNewPairings: boolean
    }

export function createBluetoothModel(): BluetoothModel {
  return {
    enabled: true,
    devices: BLUETOOTH_DEVICES.map((device) => ({ ...device })),
    paired: ['headphones', 'keyboard'],
    connected: ['headphones'],
    discovered: ['headphones', 'keyboard', 'speaker'],
    pairing: null,
    connecting: [],
    failures: {},
    scanning: null,
    nextToken: 1,
    computerName: 'Hearthspace desktop',
    discoverable: false,
    allowNewPairings: true,
    message: null,
  }
}

function connectDevice(
  state: BluetoothModel,
  deviceId: BluetoothDeviceId,
): BluetoothModel {
  if (
    !state.enabled ||
    !state.paired.includes(deviceId) ||
    state.connected.includes(deviceId) ||
    state.connecting.some((connection) => connection.deviceId === deviceId)
  ) {
    return state
  }
  return {
    ...state,
    connecting: [...state.connecting, { deviceId, token: state.nextToken }],
    nextToken: state.nextToken + 1,
    failures: { ...state.failures, [deviceId]: undefined },
    message: null,
  }
}

export function bluetoothReducer(
  state: BluetoothModel,
  action: BluetoothAction,
): BluetoothModel {
  const device =
    'deviceId' in action
      ? state.devices.find((item) => item.id === action.deviceId)
      : null
  switch (action.type) {
    case 'radio': {
      if (state.enabled === action.enabled) return state
      if (!action.enabled) {
        return {
          ...state,
          enabled: false,
          connected: [],
          connecting: [],
          pairing: null,
          scanning: null,
          failures: {},
          message: null,
        }
      }
      let next = { ...state, enabled: true }
      for (const item of state.devices) {
        if (item.autoConnect) next = connectDevice(next, item.id)
      }
      return next
    }
    case 'toggle': {
      if (!state.enabled || !device || !state.paired.includes(device.id))
        return state
      if (state.connected.includes(device.id)) {
        return {
          ...state,
          connected: state.connected.filter((id) => id !== device.id),
          message: `${device.name} disconnected.`,
        }
      }
      if (state.connecting.some((item) => item.deviceId === device.id)) {
        return {
          ...state,
          connecting: state.connecting.filter(
            (item) => item.deviceId !== device.id,
          ),
          pairing: state.pairing?.deviceId === device.id ? null : state.pairing,
          message: `Connection to ${device.name} canceled.`,
        }
      }
      return connectDevice(state, device.id)
    }
    case 'start-pairing': {
      if (
        !state.enabled ||
        !state.allowNewPairings ||
        !device ||
        state.pairing ||
        state.paired.includes(device.id) ||
        (action.incoming && !state.discoverable)
      )
        return state
      return {
        ...state,
        discovered: [...new Set([...state.discovered, device.id])],
        failures: { ...state.failures, [device.id]: undefined },
        pairing: {
          requestId: action.requestId,
          deviceId: device.id,
          stage: device.pairingMethod,
          incoming: action.incoming,
          error: null,
        },
        message: null,
      }
    }
    case 'pin': {
      const pairing = state.pairing
      if (pairing?.requestId !== action.requestId || pairing.stage !== 'pin')
        return state
      const target = state.devices.find((item) => item.id === pairing.deviceId)!
      return {
        ...state,
        pairing: {
          ...pairing,
          stage: action.pin === target.pairingCode ? 'pairing' : 'pin',
          error:
            action.pin === target.pairingCode
              ? null
              : 'Incorrect PIN. Try again.',
        },
      }
    }
    case 'confirm': {
      const pairing = state.pairing
      if (
        pairing?.requestId !== action.requestId ||
        (pairing.stage !== 'comparison' && pairing.stage !== 'passkey')
      )
        return state
      return {
        ...state,
        pairing: action.matches
          ? { ...pairing, stage: 'pairing', error: null }
          : null,
        message: action.matches
          ? null
          : 'Pairing declined. No device was paired.',
      }
    }
    case 'cancel-pairing': {
      if (state.pairing?.requestId !== action.requestId) return state
      return {
        ...state,
        connecting: state.connecting.filter(
          (item) => item.deviceId !== state.pairing!.deviceId,
        ),
        pairing: null,
        message: state.paired.includes(state.pairing.deviceId)
          ? 'Connection canceled. The device remains paired.'
          : 'Pairing canceled.',
      }
    }
    case 'finish-pairing': {
      const pairing = state.pairing
      if (
        !state.enabled ||
        pairing?.requestId !== action.requestId ||
        pairing.stage !== 'pairing'
      )
        return state
      const target = state.devices.find((item) => item.id === pairing.deviceId)!
      if (!target.available) {
        return {
          ...state,
          pairing: {
            ...pairing,
            stage: 'failed',
            error: `${target.name} is out of range. Make it nearby and retry.`,
          },
        }
      }
      return connectDevice(
        {
          ...state,
          paired: [...new Set([...state.paired, target.id])],
          pairing: { ...pairing, stage: 'connecting' },
        },
        target.id,
      )
    }
    case 'finish-connection': {
      if (
        !state.enabled ||
        !device ||
        !state.paired.includes(device.id) ||
        !state.connecting.some(
          (item) => item.deviceId === device.id && item.token === action.token,
        )
      )
        return state
      const error = device.available
        ? null
        : `${device.name} is out of range. Make it nearby and retry.`
      return {
        ...state,
        connecting: state.connecting.filter(
          (item) => item.deviceId !== device.id,
        ),
        connected: error
          ? state.connected
          : [...new Set([...state.connected, device.id])],
        failures: { ...state.failures, [device.id]: error ?? undefined },
        pairing:
          state.pairing?.deviceId === device.id
            ? error
              ? { ...state.pairing, stage: 'failed', error }
              : null
            : state.pairing,
        message: error ?? `${device.name} connected.`,
      }
    }
    case 'retry': {
      if (!state.enabled || !device) return state
      if (
        state.pairing?.deviceId === device.id &&
        state.pairing.stage === 'failed'
      ) {
        const paired = state.paired.includes(device.id)
        const next: BluetoothModel = {
          ...state,
          pairing: {
            ...state.pairing,
            stage: paired ? 'connecting' : device.pairingMethod,
            error: null,
          },
        }
        return paired ? connectDevice(next, device.id) : next
      }
      return connectDevice(state, device.id)
    }
    case 'scan':
      return !state.enabled || state.scanning !== null
        ? state
        : {
            ...state,
            scanning: state.nextToken,
            nextToken: state.nextToken + 1,
            message: 'Looking for nearby devices…',
          }
    case 'finish-scan': {
      if (!state.enabled || state.scanning !== action.token) return state
      const nearby = state.devices.filter((item) => item.available)
      return {
        ...state,
        scanning: null,
        discovered: [
          ...new Set([...state.discovered, ...nearby.map((item) => item.id)]),
        ],
        message: `${nearby.length} nearby devices found.`,
      }
    }
    case 'forget': {
      if (!device) return state
      return {
        ...state,
        paired: state.paired.filter((id) => id !== device.id),
        connected: state.connected.filter((id) => id !== device.id),
        connecting: state.connecting.filter(
          (item) => item.deviceId !== device.id,
        ),
        pairing: state.pairing?.deviceId === device.id ? null : state.pairing,
        devices: state.devices.map((item) =>
          item.id === device.id ? { ...item, autoConnect: false } : item,
        ),
        failures: { ...state.failures, [device.id]: undefined },
        message: `${device.name} forgotten. Pair again to reconnect.`,
      }
    }
    case 'availability': {
      if (!device) return state
      const wasConnected = state.connected.includes(device.id)
      return {
        ...state,
        devices: state.devices.map((item) =>
          item.id === device.id
            ? { ...item, available: action.available }
            : item,
        ),
        connected: action.available
          ? state.connected
          : state.connected.filter((id) => id !== device.id),
        message:
          !action.available && wasConnected
            ? `${device.name} disconnected because it moved out of range.`
            : state.message,
      }
    }
    case 'update-device': {
      const name = action.settings.name.trim().slice(0, 48)
      if (!device || !name) return state
      return {
        ...state,
        devices: state.devices.map((item) =>
          item.id === device.id
            ? {
                ...item,
                name,
                autoConnect:
                  state.paired.includes(item.id) && action.settings.autoConnect,
                audioProfile:
                  item.audioProfile === null
                    ? null
                    : (action.settings.audioProfile ?? item.audioProfile),
              }
            : item,
        ),
        message: `Settings for ${name} saved.`,
      }
    }
    case 'adapter': {
      const computerName = action.computerName.trim().slice(0, 48)
      if (!computerName) return state
      const cancelPairing =
        state.pairing &&
        state.pairing.stage !== 'connecting' &&
        !action.allowNewPairings
      return {
        ...state,
        computerName,
        discoverable: action.discoverable,
        allowNewPairings: action.allowNewPairings,
        pairing: cancelPairing ? null : state.pairing,
        message: cancelPairing
          ? 'Pairing canceled because new pairings are disabled.'
          : 'Bluetooth settings saved.',
      }
    }
  }
}
