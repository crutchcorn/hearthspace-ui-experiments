import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  createWifiSession,
  validateWifiSettings,
  wifiReducer,
} from '../src/views/desktop/utils/wifi.ts'

test('turning Wi-Fi off cancels connection and scan work, including stale completions after re-enabling', () => {
  let state = createWifiSession()
  state = wifiReducer(state, { type: 'connect', id: 'hotspot', remember: true })
  const oldConnection = state.pending!.token
  state = wifiReducer(state, { type: 'scan' })
  const oldScan = state.scanToken!
  state = wifiReducer(state, { type: 'enabled', enabled: false })
  assert.equal(state.connectedId, null)
  assert.equal(state.pending, null)
  assert.equal(state.scanToken, null)

  state = wifiReducer(state, { type: 'enabled', enabled: true })
  assert.equal(state.pending?.networkId, 'studio')
  const reconnect = state.pending!.token
  state = wifiReducer(state, { type: 'complete', token: oldConnection })
  state = wifiReducer(state, { type: 'scanned', token: oldScan })
  assert.equal(state.connectedId, null)
  assert.equal(state.pending?.token, reconnect)
  assert.equal(state.scanCount, 0)
  state = wifiReducer(state, { type: 'complete', token: reconnect })
  assert.equal(state.connectedId, 'studio')
})

test('explicit disconnect cancels in-flight switching and does not reconnect saved networks on a radio cycle', () => {
  let state = createWifiSession()
  state = wifiReducer(state, { type: 'connect', id: 'hotspot', remember: true })
  const switching = state.pending!.token
  state = wifiReducer(state, { type: 'disconnect' })
  state = wifiReducer(state, { type: 'complete', token: switching })
  state = wifiReducer(state, { type: 'enabled', enabled: false })
  state = wifiReducer(state, { type: 'enabled', enabled: true })
  assert.equal(state.connectedId, null)
  assert.equal(state.pending, null)
  assert.ok(state.networks.find((network) => network.id === 'studio')?.saved)
})

test('auto-connect disabled and credentials not remembered each prevent automatic reconnection', () => {
  let state = createWifiSession()
  state = wifiReducer(state, {
    type: 'settings',
    id: 'studio',
    settings: { ...state.networks[0].settings, autoConnect: false },
  })
  state = wifiReducer(state, { type: 'enabled', enabled: false })
  state = wifiReducer(state, { type: 'enabled', enabled: true })
  assert.equal(state.pending, null)

  state = wifiReducer(state, {
    type: 'connect',
    id: 'workshop',
    remember: false,
  })
  state = wifiReducer(state, { type: 'complete', token: state.pending!.token })
  assert.equal(state.connectedId, 'workshop')
  const workshop = state.networks.find((network) => network.id === 'workshop')!
  assert.equal(workshop.saved, true)
  assert.equal(workshop.credentialsRemembered, false)
  state = wifiReducer(state, { type: 'enabled', enabled: false })
  state = wifiReducer(state, { type: 'enabled', enabled: true })
  assert.equal(state.pending, null)
})

test('a canceled connection cannot replace the working network when its old timer finishes', () => {
  let state = createWifiSession()
  state = wifiReducer(state, { type: 'connect', id: 'hotspot', remember: true })
  const canceled = state.pending!.token
  state = wifiReducer(state, { type: 'cancel' })
  state = wifiReducer(state, { type: 'complete', token: canceled })
  assert.equal(state.connectedId, 'studio')
  assert.equal(state.pending, null)
})

test('failed network switching preserves the current connection and can succeed on retry', () => {
  let state = createWifiSession()
  state = wifiReducer(state, { type: 'connect', id: 'garden', remember: true })
  state = wifiReducer(state, { type: 'complete', token: state.pending!.token })
  assert.equal(state.connectedId, 'studio')
  assert.equal(state.feedback?.error, true)
  assert.equal(state.feedback?.networkId, 'garden')
  state = wifiReducer(state, { type: 'connect', id: 'garden', remember: true })
  state = wifiReducer(state, { type: 'complete', token: state.pending!.token })
  assert.equal(state.connectedId, 'garden')
  assert.ok(!state.feedback?.error)
})

test('forgetting a saved network cancels its pending reconnect and resets its settings and credential metadata', () => {
  let state = createWifiSession()
  state = wifiReducer(state, {
    type: 'settings',
    id: 'studio',
    settings: {
      ...state.networks[0].settings,
      privateMac: false,
      metered: true,
    },
  })
  state = wifiReducer(state, { type: 'enabled', enabled: false })
  state = wifiReducer(state, { type: 'enabled', enabled: true })
  const reconnect = state.pending!.token
  state = wifiReducer(state, { type: 'forget', id: 'studio' })
  state = wifiReducer(state, { type: 'complete', token: reconnect })
  const studio = state.networks.find((network) => network.id === 'studio')!
  assert.equal(studio.saved, false)
  assert.equal(studio.credentialsRemembered, false)
  assert.equal(studio.settings.privateMac, true)
  assert.equal(studio.settings.metered, false)
  assert.equal(state.connectedId, null)
  assert.equal(state.pending, null)
  assert.equal(state.resumeId, null)
})

test('guest portal acceptance requires the current connection and is removed when that network is forgotten', () => {
  let state = createWifiSession()
  state = wifiReducer(state, { type: 'portal', id: 'guest' })
  assert.equal(
    state.networks.find((network) => network.id === 'guest')?.portalAccepted,
    false,
  )
  state = wifiReducer(state, { type: 'connect', id: 'guest', remember: true })
  state = wifiReducer(state, { type: 'complete', token: state.pending!.token })
  state = wifiReducer(state, { type: 'portal', id: 'guest' })
  assert.equal(
    state.networks.find((network) => network.id === 'guest')?.portalAccepted,
    true,
  )
  state = wifiReducer(state, { type: 'forget', id: 'guest' })
  assert.equal(
    state.networks.find((network) => network.id === 'guest')?.portalAccepted,
    false,
  )
  assert.equal(state.connectedId, null)
})

test('manual addresses reject noncontiguous masks, unusable hosts, and unreachable gateways without changing the saved profile', () => {
  const state = createWifiSession()
  const settings = {
    ...state.networks[0].settings,
    ipv4Mode: 'manual' as const,
  }
  assert.equal(validateWifiSettings(settings), null)
  assert.match(
    validateWifiSettings({ ...settings, subnetMask: '255.0.255.0' })!,
    /contiguous subnet mask/,
  )
  assert.match(
    validateWifiSettings({ ...settings, address: '192.168.1.255' })!,
    /broadcast addresses/,
  )
  assert.match(
    validateWifiSettings({ ...settings, gateway: '192.168.2.1' })!,
    /same subnet/,
  )
  assert.match(
    validateWifiSettings({ ...settings, address: settings.gateway })!,
    /different from the gateway/,
  )
  assert.match(
    validateWifiSettings({ ...settings, address: '999.1.1.1' })!,
    /valid IPv4 address/,
  )
  assert.strictEqual(
    wifiReducer(state, {
      type: 'settings',
      id: 'studio',
      settings: { ...settings, gateway: '192.168.2.1' },
    }),
    state,
  )
})

test('manual DNS validates independently of automatic IPv4 and automatic DNS ignores an unused manual value', () => {
  const settings = createWifiSession().networks[0].settings
  assert.equal(
    validateWifiSettings({
      ...settings,
      dnsMode: 'manual',
      dns: '1.1.1.1, 8.8.8.8',
    }),
    null,
  )
  assert.match(
    validateWifiSettings({
      ...settings,
      dnsMode: 'manual',
      dns: '1.1.1.1, invalid',
    })!,
    /valid IPv4 DNS/,
  )
  assert.match(
    validateWifiSettings({ ...settings, dnsMode: 'manual', dns: '' })!,
    /valid IPv4 DNS/,
  )
  assert.equal(
    validateWifiSettings({ ...settings, dnsMode: 'automatic', dns: 'unused' }),
    null,
  )
})
