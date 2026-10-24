export type WifiSecurity =
  'Open' | 'WPA2 Personal' | 'WPA3 Personal' | 'WPA2 Enterprise'

export interface WifiEnterpriseCredentials {
  identity: string
  method: 'PEAP' | 'TTLS'
  certificate: 'system' | 'hearthspace'
}

export interface WifiNetworkSettings {
  autoConnect: boolean
  metered: boolean
  privateMac: boolean
  ipv4Mode: 'automatic' | 'manual'
  address: string
  subnetMask: string
  gateway: string
  dnsMode: 'automatic' | 'manual'
  dns: string
}

export interface WifiNetwork {
  id: string
  name: string
  security: WifiSecurity
  secured: boolean
  signal: number
  band: string
  linkSpeed: number
  channel: number
  hidden: boolean
  saved: boolean
  credentialsRemembered: boolean
  portalAccepted: boolean
  failedOnce: boolean
  scenario: 'online' | 'portal' | 'limited' | 'retry'
  privateAddress: string
  lease: { address: string; subnetMask: string; gateway: string; dns: string }
  settings: WifiNetworkSettings
  enterpriseMethod?: WifiEnterpriseCredentials['method']
}

interface WifiFeedback {
  message: string
  networkId?: string
  error?: boolean
}

export interface WifiSession {
  enabled: boolean
  networks: WifiNetwork[]
  connectedId: string | null
  resumeId: string | null
  sequence: number
  pending: { networkId: string; token: number; remember: boolean } | null
  scanToken: number | null
  scanCount: number
  feedback: WifiFeedback | null
}

export interface WifiHiddenNetworkInput {
  name: string
  security: WifiSecurity
  password: string
  remember: boolean
  enterprise?: WifiEnterpriseCredentials
}

export interface WifiState {
  wifiEnabled: boolean
  setWifiEnabled: (enabled: boolean) => void
  wifiNetwork: WifiNetwork | null
  wifiLabel: string
  selectWifiNetwork: (id: string | null) => void
  wifiNetworks: WifiNetwork[]
  wifiConnectionStatus: string
  wifiPendingNetwork: WifiNetwork | null
  wifiScanning: boolean
  wifiScanCount: number
  wifiFeedback: WifiFeedback | null
  wifiConnect: (
    id: string,
    password?: string,
    remember?: boolean,
    enterprise?: WifiEnterpriseCredentials,
  ) => string | null
  wifiJoinHiddenNetwork: (input: WifiHiddenNetworkInput) => string | null
  wifiSaveSettings: (id: string, settings: WifiNetworkSettings) => string | null
  wifiScan: () => void
  wifiCancelConnection: () => void
  wifiForgetNetwork: (id: string) => void
  wifiAcceptPortal: (id: string) => void
  wifiClearFeedback: () => void
}
