export const WIFI_NETWORKS = [
  { id: 'studio', name: 'Studio network', secured: true },
  { id: 'guest', name: 'Hearthspace guest', secured: false },
  { id: 'hotspot', name: 'Phone hotspot', secured: true },
] as const

export const BLUETOOTH_DEVICES = [
  { id: 'headphones', name: 'Studio headphones', kind: 'headphones' },
  { id: 'keyboard', name: 'Mechanical keyboard', kind: 'keyboard' },
  { id: 'speaker', name: 'Pocket speaker', kind: 'speaker' },
] as const
