import { WIFI_IDENTITY } from '../constants/wifi'
import type {
  WifiEnterpriseCredentials,
  WifiNetwork,
  WifiNetworkSettings,
  WifiSecurity,
  WifiSession,
} from '../types/wifi'

export function makeNetwork(
  id: string,
  name: string,
  security: WifiSecurity,
  options: Partial<WifiNetwork> = {},
): WifiNetwork {
  const lease = {
    address: '192.168.1.24',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    dns: '192.168.1.1',
    ...options.lease,
  }
  return {
    id,
    name,
    security,
    secured: security !== 'Open',
    signal: -48,
    band: '5 GHz',
    linkSpeed: 866,
    channel: 36,
    hidden: false,
    saved: false,
    credentialsRemembered: false,
    portalAccepted: false,
    failedOnce: false,
    scenario: 'online',
    privateAddress: 'DA:72:40:9C:16:24',
    settings: {
      autoConnect: true,
      metered: false,
      privateMac: true,
      ipv4Mode: 'automatic',
      ...lease,
      dnsMode: 'automatic',
    },
    ...options,
    lease,
  }
}

const WIFI_NETWORKS: WifiNetwork[] = [
  makeNetwork('studio', 'Studio network', 'WPA3 Personal', {
    saved: true,
    credentialsRemembered: true,
    signal: -41,
    band: '6 GHz',
    linkSpeed: 1200,
    channel: 37,
  }),
  makeNetwork('guest', 'Hearthspace guest', 'Open', {
    scenario: 'portal',
    privateAddress: 'CA:40:82:6F:11:08',
    lease: {
      address: '10.20.0.42',
      subnetMask: '255.255.255.0',
      gateway: '10.20.0.1',
      dns: '10.20.0.1',
    },
  }),
  makeNetwork('hotspot', 'Phone hotspot', 'WPA2 Personal', {
    saved: true,
    credentialsRemembered: true,
    signal: -57,
    band: '2.4 GHz',
    linkSpeed: 144,
    channel: 6,
    privateAddress: 'EA:18:61:3B:44:09',
    lease: {
      address: '172.20.10.2',
      subnetMask: '255.255.255.240',
      gateway: '172.20.10.1',
      dns: '172.20.10.1',
    },
  }),
  makeNetwork('workshop', 'Workshop', 'WPA2 Personal', {
    signal: -63,
    privateAddress: 'D6:51:3A:20:86:17',
  }),
  makeNetwork('reading-room', 'Reading room', 'Open', {
    scenario: 'limited',
    signal: -68,
    band: '2.4 GHz',
    linkSpeed: 72,
    channel: 11,
    privateAddress: 'B2:80:67:14:9D:31',
  }),
  makeNetwork('garden', 'Garden relay', 'Open', {
    scenario: 'retry',
    signal: -79,
    band: '2.4 GHz',
    linkSpeed: 36,
    channel: 1,
    privateAddress: 'E6:20:38:4B:A1:06',
  }),
  makeNetwork('office', 'Hearthspace office', 'WPA2 Enterprise', {
    signal: -56,
    privateAddress: 'C2:08:75:AE:22:61',
  }),
]

type WifiAction =
  | { type: 'enabled'; enabled: boolean }
  | {
      type: 'connect'
      id: string
      remember: boolean
      enterpriseMethod?: WifiEnterpriseCredentials['method']
    }
  | { type: 'complete'; token: number }
  | { type: 'cancel' }
  | { type: 'disconnect' }
  | { type: 'scan' }
  | { type: 'scanned'; token: number }
  | { type: 'hidden'; network: WifiNetwork; remember: boolean }
  | { type: 'settings'; id: string; settings: WifiNetworkSettings }
  | { type: 'forget'; id: string }
  | { type: 'portal'; id: string }
  | { type: 'feedback'; feedback: WifiSession['feedback'] }

export function createWifiSession(): WifiSession {
  return {
    enabled: true,
    networks: WIFI_NETWORKS.map((network) => ({
      ...network,
      settings: {
        ...network.settings,
        metered: network.id === 'hotspot',
      },
    })),
    connectedId: 'studio',
    resumeId: 'studio',
    sequence: 0,
    pending: null,
    scanToken: null,
    scanCount: 0,
    feedback: null,
  }
}

function startConnection(
  state: WifiSession,
  id: string,
  remember: boolean,
): WifiSession {
  if (!state.enabled || !state.networks.some((network) => network.id === id))
    return state
  return {
    ...state,
    sequence: state.sequence + 1,
    pending: { networkId: id, token: state.sequence + 1, remember },
    feedback: null,
  }
}

export function wifiReducer(
  state: WifiSession,
  action: WifiAction,
): WifiSession {
  switch (action.type) {
    case 'enabled': {
      if (state.enabled === action.enabled) return state
      if (!action.enabled)
        return {
          ...state,
          enabled: false,
          connectedId: null,
          pending: null,
          scanToken: null,
          feedback: null,
        }
      const enabled = { ...state, enabled: true }
      const previous = state.networks.find(
        (network) => network.id === state.resumeId,
      )
      return previous?.saved &&
        previous.settings.autoConnect &&
        (!previous.secured || previous.credentialsRemembered)
        ? startConnection(enabled, previous.id, previous.credentialsRemembered)
        : enabled
    }
    case 'connect':
      return startConnection(
        action.enterpriseMethod
          ? {
              ...state,
              networks: state.networks.map((network) =>
                network.id === action.id
                  ? { ...network, enterpriseMethod: action.enterpriseMethod }
                  : network,
              ),
            }
          : state,
        action.id,
        action.remember,
      )
    case 'complete': {
      if (!state.enabled || state.pending?.token !== action.token) return state
      const pending = state.pending
      const network = state.networks.find(
        (item) => item.id === pending.networkId,
      )
      if (!network) return { ...state, pending: null }
      if (network.scenario === 'retry' && !network.failedOnce)
        return {
          ...state,
          pending: null,
          networks: state.networks.map((item) =>
            item.id === network.id ? { ...item, failedOnce: true } : item,
          ),
          feedback: {
            networkId: network.id,
            error: true,
            message: `${network.name} did not respond. Move closer and try again.`,
          },
        }
      return {
        ...state,
        connectedId: network.id,
        resumeId: network.id,
        pending: null,
        networks: state.networks.map((item) =>
          item.id === network.id
            ? {
                ...item,
                saved: true,
                credentialsRemembered: item.secured && pending.remember,
              }
            : item,
        ),
        feedback: {
          networkId: network.id,
          message:
            network.scenario === 'limited'
              ? `${network.name} has no internet access. Local devices may still be available.`
              : network.scenario === 'portal' && !network.portalAccepted
                ? `Sign in to ${network.name} to access the internet.`
                : `Connected to ${network.name}.`,
        },
      }
    }
    case 'cancel':
      return {
        ...state,
        pending: null,
        feedback: { message: 'Connection canceled.' },
      }
    case 'disconnect':
      return {
        ...state,
        connectedId: null,
        resumeId: null,
        pending: null,
        feedback: {
          message: 'Disconnected. Choose a network to connect again.',
        },
      }
    case 'scan':
      return state.enabled && state.scanToken === null
        ? {
            ...state,
            scanToken: state.sequence + 1,
            sequence: state.sequence + 1,
          }
        : state
    case 'scanned':
      return state.enabled && state.scanToken === action.token
        ? { ...state, scanToken: null, scanCount: state.scanCount + 1 }
        : state
    case 'hidden':
      return state.enabled
        ? startConnection(
            { ...state, networks: [...state.networks, action.network] },
            action.network.id,
            action.remember,
          )
        : state
    case 'settings': {
      if (validateWifiSettings(action.settings)) return state
      return {
        ...state,
        networks: state.networks.map((network) =>
          network.id === action.id
            ? { ...network, settings: action.settings }
            : network,
        ),
        feedback: { networkId: action.id, message: 'Network settings saved.' },
      }
    }
    case 'forget': {
      const network = state.networks.find((item) => item.id === action.id)
      if (!network) return state
      return {
        ...state,
        networks: state.networks.flatMap((item) =>
          item.id !== action.id
            ? [item]
            : item.hidden
              ? []
              : [
                  {
                    ...item,
                    saved: false,
                    credentialsRemembered: false,
                    portalAccepted: false,
                    enterpriseMethod: undefined,
                    settings: {
                      ...makeNetwork(item.id, item.name, item.security, {
                        lease: item.lease,
                      }).settings,
                    },
                  },
                ],
        ),
        connectedId: state.connectedId === action.id ? null : state.connectedId,
        resumeId: state.resumeId === action.id ? null : state.resumeId,
        pending: state.pending?.networkId === action.id ? null : state.pending,
        feedback: { message: `${network.name} forgotten.` },
      }
    }
    case 'portal':
      if (!state.enabled || state.connectedId !== action.id) return state
      return {
        ...state,
        networks: state.networks.map((network) =>
          network.id === action.id
            ? { ...network, portalAccepted: true }
            : network,
        ),
        feedback: {
          networkId: action.id,
          message: 'You’re online. Welcome to Hearthspace guest.',
        },
      }
    case 'feedback':
      return { ...state, feedback: action.feedback }
  }
}

function ipv4Number(value: string): number | null {
  const parts = value.trim().split('.')
  if (
    parts.length !== 4 ||
    parts.some((part) => !/^(0|[1-9]\d{0,2})$/.test(part) || Number(part) > 255)
  )
    return null
  return parts.reduce((address, part) => address * 256 + Number(part), 0)
}

function isUnicast(address: number | null): address is number {
  if (address === null) return false
  const first = Math.floor(address / 16777216)
  return first > 0 && first < 224 && first !== 127
}

export function validateEnterpriseCredentials(
  credentials?: WifiEnterpriseCredentials,
): string | null {
  if (credentials?.identity.trim() !== WIFI_IDENTITY)
    return 'Identity was not recognized. Check your work account and try again.'
  if (credentials.certificate !== 'hearthspace')
    return 'The server certificate is not trusted by the system store. Choose the Hearthspace certificate.'
  return null
}

export function validateWifiSettings(
  settings: WifiNetworkSettings,
): string | null {
  if (settings.ipv4Mode === 'manual') {
    const address = ipv4Number(settings.address)
    const gateway = ipv4Number(settings.gateway)
    const mask = ipv4Number(settings.subnetMask)
    if (!isUnicast(address))
      return 'Enter a valid IPv4 address, such as 192.168.1.24.'
    if (!isUnicast(gateway))
      return 'Enter a valid gateway address, such as 192.168.1.1.'
    const inverse = mask === null ? 0 : ~mask >>> 0
    if (
      mask === null ||
      mask === 0 ||
      inverse < 3 ||
      (inverse & (inverse + 1)) !== 0
    )
      return 'Enter a contiguous subnet mask between /1 and /30, such as 255.255.255.0.'
    const host = address & inverse
    const gatewayHost = gateway & inverse
    if (
      host === 0 ||
      host === inverse ||
      gatewayHost === 0 ||
      gatewayHost === inverse
    )
      return 'IP address and gateway must be host addresses, not network or broadcast addresses.'
    if ((address & mask) !== (gateway & mask))
      return 'IP address and gateway must be on the same subnet.'
    if (address === gateway)
      return 'IP address must be different from the gateway.'
  }
  if (settings.dnsMode === 'manual') {
    const servers = settings.dns.trim().split(/[\s,]+/)
    if (
      servers.length > 3 ||
      servers.some((server) => !isUnicast(ipv4Number(server)))
    )
      return 'Enter one to three valid IPv4 DNS servers, separated by commas.'
  }
  return null
}
