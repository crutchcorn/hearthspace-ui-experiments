import {
  BluetoothOff,
  Check,
  ChevronRight,
  Headphones,
  Keyboard,
  Lock,
  Volume,
  Wifi,
  WifiOff,
} from '../../../components/icons'
import { BLUETOOTH_DEVICES, WIFI_NETWORKS } from '../constants/system-status'
import type { SystemStatus } from '../types/system-status'
import settingsStyles from './settings.module.css'
import styles from './wireless-controls.module.css'

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
  const wifi = kind === 'wifi'
  const name = wifi ? 'Wi-Fi' : 'Bluetooth'
  const enabled = wifi ? status.wifiEnabled : status.bluetoothEnabled
  const detail = wifi ? status.wifiLabel : status.bluetoothLabel
  const setEnabled = wifi ? status.setWifiEnabled : status.setBluetoothEnabled
  const OffIcon = wifi ? WifiOff : BluetoothOff
  const Heading = presentation === 'settings' ? 'h3' : 'h2'
  const rows = wifi
    ? WIFI_NETWORKS.map((network) => {
        const connected = status.wifiNetwork?.id === network.id
        return {
          id: network.id,
          name: network.name,
          connected,
          description: connected
            ? 'Connected'
            : network.secured
              ? 'Saved network'
              : 'Open network',
          action: `${connected ? 'Disconnect from' : 'Connect to'} ${network.name}`,
          Icon: Wifi,
          Mark: connected ? Check : network.secured ? Lock : ChevronRight,
          onSelect: () =>
            status.selectWifiNetwork(connected ? null : network.id),
        }
      })
    : BLUETOOTH_DEVICES.map((device) => {
        const connected = status.bluetoothConnectedIds.includes(device.id)
        const paired = status.bluetoothPairedIds.includes(device.id)
        return {
          id: device.id,
          name: device.name,
          connected,
          description: connected
            ? 'Connected'
            : paired
              ? 'Paired'
              : 'Available to pair',
          action: `${connected ? 'Disconnect' : paired ? 'Connect' : 'Pair'} ${device.name}`,
          Icon:
            device.kind === 'headphones'
              ? Headphones
              : device.kind === 'keyboard'
                ? Keyboard
                : Volume,
          Mark: connected ? Check : ChevronRight,
          onSelect: () => status.toggleBluetoothDevice(device.id),
        }
      })

  return (
    <div className={styles.controls} data-presentation={presentation}>
      <label className={styles.toggleRow}>
        <span className={styles.toggleCopy}>
          <strong>{name}</strong>
          {presentation === 'settings' && <span>{detail}</span>}
        </span>
        <input
          className={`${settingsStyles.toggle} ${styles.toggle}`}
          type="checkbox"
          aria-label={name}
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
        />
      </label>
      {enabled ? (
        <div className={styles.list}>
          <Heading className={styles.listHeading}>
            {wifi ? 'Networks' : 'Devices'}
          </Heading>
          {rows.map(
            ({
              id,
              name,
              connected,
              description,
              action,
              Icon,
              Mark,
              onSelect,
            }) => (
              <button
                key={id}
                type="button"
                className={styles.item}
                data-connected={connected}
                aria-label={action}
                title={action}
                onClick={onSelect}
              >
                <Icon size={19} />
                <span className={styles.name}>
                  <strong>{name}</strong>
                  <span>{description}</span>
                </span>
                <Mark size={17} />
              </button>
            ),
          )}
        </div>
      ) : (
        <div className={styles.off}>
          <OffIcon size={28} />
          <strong>{name} is off</strong>
          <span>
            {wifi
              ? 'Turn on Wi-Fi to see available networks.'
              : 'Turn on Bluetooth to connect your devices.'}
          </span>
        </div>
      )}
    </div>
  )
}
