import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  bluetoothReducer,
  createBluetoothModel,
} from '../src/views/desktop/utils/bluetooth.ts'
import { BLUETOOTH_DEVICES } from '../src/views/desktop/constants/bluetooth.ts'

test('a wrong PIN does not pair and a canceled correct PIN cannot finish later', () => {
  let state = bluetoothReducer(createBluetoothModel(), {
    type: 'start-pairing',
    deviceId: 'speaker',
    requestId: 1,
    incoming: false,
  })
  state = bluetoothReducer(state, { type: 'pin', requestId: 1, pin: '1234' })
  assert.equal(state.pairing?.error, 'Incorrect PIN. Try again.')
  assert.equal(state.pairing?.stage, 'pin')
  assert.ok(!state.paired.includes('speaker'))
  const speaker = BLUETOOTH_DEVICES.find((device) => device.id === 'speaker')!
  state = bluetoothReducer(state, {
    type: 'pin',
    requestId: 1,
    pin: speaker.pairingCode,
  })
  state = bluetoothReducer(state, { type: 'cancel-pairing', requestId: 1 })
  state = bluetoothReducer(state, { type: 'finish-pairing', requestId: 1 })
  assert.ok(!state.paired.includes('speaker'))
  assert.ok(!state.connected.includes('speaker'))
  assert.equal(state.pairing, null)
})

test('canceling after pairing retains the pairing but rejects a late connection', () => {
  let state = bluetoothReducer(createBluetoothModel(), {
    type: 'start-pairing',
    deviceId: 'speaker',
    requestId: 1,
    incoming: false,
  })
  state = bluetoothReducer(state, { type: 'pin', requestId: 1, pin: '0000' })
  state = bluetoothReducer(state, { type: 'finish-pairing', requestId: 1 })
  const connection = state.connecting[0]
  assert.equal(state.pairing?.stage, 'connecting')
  state = bluetoothReducer(state, { type: 'cancel-pairing', requestId: 1 })
  state = bluetoothReducer(state, { type: 'finish-connection', ...connection })
  assert.ok(state.paired.includes('speaker'))
  assert.ok(!state.connected.includes('speaker'))
  assert.equal(state.message, 'Connection canceled. The device remains paired.')
})

test('radio off cancels pairing, scanning and connection without erasing saved devices', () => {
  let state = bluetoothReducer(createBluetoothModel(), {
    type: 'toggle',
    deviceId: 'keyboard',
  })
  const connection = state.connecting[0]
  state = bluetoothReducer(state, { type: 'scan' })
  const scanToken = state.scanning!
  state = bluetoothReducer(state, {
    type: 'start-pairing',
    deviceId: 'speaker',
    requestId: 1,
    incoming: false,
  })
  state = bluetoothReducer(state, { type: 'pin', requestId: 1, pin: '0000' })
  state = bluetoothReducer(state, { type: 'radio', enabled: false })
  state = bluetoothReducer(state, { type: 'radio', enabled: true })
  state = bluetoothReducer(state, { type: 'finish-pairing', requestId: 1 })
  state = bluetoothReducer(state, { type: 'finish-connection', ...connection })
  state = bluetoothReducer(state, { type: 'finish-scan', token: scanToken })
  assert.deepEqual(state.paired, ['headphones', 'keyboard'])
  assert.deepEqual(state.connected, [])
  assert.deepEqual(state.connecting, [])
  assert.equal(state.scanning, null)
  assert.equal(state.pairing, null)
  assert.ok(!state.discovered.includes('phone'))
})

test('only an opted-in paired device reconnects when the radio returns', () => {
  let state = bluetoothReducer(createBluetoothModel(), {
    type: 'update-device',
    deviceId: 'headphones',
    settings: {
      name: 'Travel headphones',
      autoConnect: true,
      audioProfile: 'hands-free',
    },
  })
  state = bluetoothReducer(state, { type: 'radio', enabled: false })
  state = bluetoothReducer(state, { type: 'radio', enabled: true })
  assert.deepEqual(
    state.connecting.map((item) => item.deviceId),
    ['headphones'],
  )
  state = bluetoothReducer(state, {
    type: 'finish-connection',
    ...state.connecting[0],
  })
  assert.deepEqual(state.connected, ['headphones'])
  assert.equal(state.devices[0].name, 'Travel headphones')
  assert.equal(state.devices[0].audioProfile, 'hands-free')
})

test('connection failure recovers after availability returns and retry preserves other connections', () => {
  let state = bluetoothReducer(createBluetoothModel(), {
    type: 'availability',
    deviceId: 'keyboard',
    available: false,
  })
  state = bluetoothReducer(state, { type: 'toggle', deviceId: 'keyboard' })
  state = bluetoothReducer(state, {
    type: 'finish-connection',
    ...state.connecting[0],
  })
  assert.match(state.failures.keyboard!, /out of range/)
  assert.deepEqual(state.connected, ['headphones'])
  state = bluetoothReducer(state, {
    type: 'availability',
    deviceId: 'keyboard',
    available: true,
  })
  state = bluetoothReducer(state, { type: 'retry', deviceId: 'keyboard' })
  state = bluetoothReducer(state, {
    type: 'finish-connection',
    ...state.connecting[0],
  })
  assert.deepEqual(state.connected, ['headphones', 'keyboard'])
  assert.equal(state.failures.keyboard, undefined)
})

test('forgetting a keyboard cancels pending work and requires passkey confirmation to pair again', () => {
  let state = bluetoothReducer(createBluetoothModel(), {
    type: 'toggle',
    deviceId: 'keyboard',
  })
  const connection = state.connecting[0]
  state = bluetoothReducer(state, { type: 'forget', deviceId: 'keyboard' })
  state = bluetoothReducer(state, { type: 'finish-connection', ...connection })
  assert.ok(!state.paired.includes('keyboard'))
  state = bluetoothReducer(state, {
    type: 'start-pairing',
    deviceId: 'keyboard',
    requestId: 1,
    incoming: false,
  })
  assert.equal(state.pairing?.stage, 'passkey')
  state = bluetoothReducer(state, { type: 'finish-pairing', requestId: 1 })
  assert.ok(!state.paired.includes('keyboard'))
  state = bluetoothReducer(state, {
    type: 'confirm',
    requestId: 1,
    matches: true,
  })
  state = bluetoothReducer(state, { type: 'finish-pairing', requestId: 1 })
  assert.ok(state.paired.includes('keyboard'))
})

test('rescan discovers the phone and declining its comparison code leaves it unpaired', () => {
  let state = bluetoothReducer(createBluetoothModel(), { type: 'scan' })
  state = bluetoothReducer(state, {
    type: 'finish-scan',
    token: state.scanning!,
  })
  assert.ok(state.discovered.includes('phone'))
  state = bluetoothReducer(state, {
    type: 'start-pairing',
    deviceId: 'phone',
    requestId: 1,
    incoming: false,
  })
  assert.equal(state.pairing?.stage, 'comparison')
  state = bluetoothReducer(state, {
    type: 'confirm',
    requestId: 1,
    matches: false,
  })
  assert.equal(state.pairing, null)
  assert.ok(!state.paired.includes('phone'))
})

test('incoming pairing requires discoverability and new pairings while saved devices remain usable', () => {
  const request = {
    type: 'start-pairing' as const,
    deviceId: 'phone' as const,
    requestId: 1,
    incoming: true,
  }
  let state = bluetoothReducer(createBluetoothModel(), request)
  assert.equal(state.pairing, null)
  state = bluetoothReducer(state, {
    type: 'adapter',
    computerName: 'Studio desktop',
    discoverable: true,
    allowNewPairings: true,
  })
  state = bluetoothReducer(state, request)
  assert.equal(state.pairing?.incoming, true)
  state = bluetoothReducer(state, {
    type: 'adapter',
    computerName: 'Studio desktop',
    discoverable: true,
    allowNewPairings: false,
  })
  assert.equal(state.pairing, null)
  state = bluetoothReducer(state, request)
  assert.equal(state.pairing, null)
  state = bluetoothReducer(state, { type: 'toggle', deviceId: 'keyboard' })
  state = bluetoothReducer(state, {
    type: 'finish-connection',
    ...state.connecting[0],
  })
  assert.ok(state.connected.includes('keyboard'))
})

test('cleanup from an old pairing owner cannot cancel a newer pairing request', () => {
  let state = bluetoothReducer(createBluetoothModel(), {
    type: 'start-pairing',
    deviceId: 'speaker',
    requestId: 1,
    incoming: false,
  })
  state = bluetoothReducer(state, { type: 'cancel-pairing', requestId: 1 })
  state = bluetoothReducer(state, {
    type: 'start-pairing',
    deviceId: 'phone',
    requestId: 2,
    incoming: false,
  })
  state = bluetoothReducer(state, { type: 'cancel-pairing', requestId: 1 })
  state = bluetoothReducer(state, { type: 'finish-pairing', requestId: 1 })
  assert.equal(state.pairing?.deviceId, 'phone')
  assert.equal(state.pairing?.stage, 'comparison')
})
