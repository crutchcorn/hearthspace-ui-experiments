import Checkbox from '../../../components/controls/checkbox'
import SelectControl from '../../../components/controls/select-control'
import ToggleSwitch from '../../../components/controls/toggle-switch'
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import {
  Bluetooth,
  BluetoothOff,
  Check,
  ChevronRight,
  Eye,
  Headphones,
  Hourglass,
  Keyboard,
  RotateCcw,
  Settings,
  Volume,
} from '../../../components/icons'
import type {
  BluetoothDevice,
  BluetoothDeviceId,
  BluetoothState,
} from '../types/bluetooth'
import styles from './wireless-controls.module.css'
import WirelessDialog from './wireless-dialog'
import dialogStyles from './wireless-dialog.module.css'

interface BluetoothControlsProps {
  status: BluetoothState
  presentation?: 'popover' | 'settings'
}

type BluetoothDialog =
  | { kind: 'details' | 'forget'; deviceId: BluetoothDeviceId }
  | { kind: 'pairing'; deviceId: BluetoothDeviceId; requestId: number }
  | { kind: 'adapter' }
  | null

function connectionDescription(
  status: BluetoothState,
  device: BluetoothDevice,
) {
  if (status.bluetoothPairing?.deviceId === device.id) {
    if (status.bluetoothPairing.stage === 'pairing') return 'Pairing…'
    if (status.bluetoothPairing.stage === 'connecting') return 'Connecting…'
    if (status.bluetoothPairing.stage === 'failed') return 'Could not connect'
    return 'Waiting for pairing confirmation'
  }
  if (status.bluetoothConnectingIds.includes(device.id)) return 'Connecting…'
  if (status.bluetoothConnectedIds.includes(device.id)) {
    return device.audioProfile
      ? `Connected · ${device.audioProfile === 'stereo' ? 'Stereo audio' : 'Hands-free audio'}`
      : 'Connected'
  }
  if (!status.bluetoothEnabled) return 'Bluetooth is off'
  if (status.bluetoothConnectionErrors[device.id])
    return 'Could not connect · Retry'
  if (!device.available) return 'Out of range'
  return status.bluetoothPairedIds.includes(device.id)
    ? 'Paired'
    : 'Available to pair'
}

function PairingDialog({
  status,
  device,
  onClose,
}: {
  status: BluetoothState
  device: BluetoothDevice
  onClose: () => void
}) {
  const formId = useId()
  const errorId = useId()
  const [pin, setPin] = useState('')
  const cancelAction = useRef<HTMLButtonElement>(null)
  const pairing = status.bluetoothPairing!
  const busy = pairing.stage === 'pairing' || pairing.stage === 'connecting'
  const comparison = pairing.stage === 'comparison'
  useLayoutEffect(() => {
    const active = document.activeElement
    if (
      busy &&
      (active === document.body ||
        active === cancelAction.current?.closest('dialog'))
    ) {
      cancelAction.current?.focus({ preventScroll: true })
    }
  }, [busy])
  return (
    <WirelessDialog
      title={`Pair ${device.name}`}
      description={
        pairing.incoming
          ? `${device.name} wants to pair with ${status.bluetoothComputerName}.`
          : `Connect ${device.name} to ${status.bluetoothComputerName}.`
      }
      onClose={onClose}
      actions={
        <>
          <button ref={cancelAction} type="button" onClick={onClose}>
            {pairing.stage === 'connecting' ? 'Cancel connection' : 'Cancel'}
          </button>
          {pairing.stage === 'pin' && (
            <button
              className={dialogStyles.primary}
              type="submit"
              form={formId}
            >
              Pair
            </button>
          )}
          {comparison && (
            <>
              <button
                type="button"
                onClick={() =>
                  status.bluetoothConfirmPairing(pairing.requestId, false)
                }
              >
                Codes don’t match
              </button>
              <button
                className={dialogStyles.primary}
                type="button"
                onClick={() =>
                  status.bluetoothConfirmPairing(pairing.requestId, true)
                }
              >
                Codes match
              </button>
            </>
          )}
          {pairing.stage === 'passkey' && (
            <button
              className={dialogStyles.primary}
              type="button"
              onClick={() =>
                status.bluetoothConfirmPairing(pairing.requestId, true)
              }
            >
              Code entered
            </button>
          )}
          {pairing.stage === 'failed' && (
            <button
              className={dialogStyles.primary}
              type="button"
              onClick={() => status.bluetoothRetryConnection(device.id)}
            >
              Retry
            </button>
          )}
        </>
      }
    >
      {pairing.stage === 'pin' && (
        <form
          id={formId}
          className={dialogStyles.form}
          onSubmit={(event) => {
            event.preventDefault()
            status.bluetoothSubmitPin(pairing.requestId, pin)
          }}
        >
          <div className={dialogStyles.field}>
            <label htmlFor={`${formId}-pin`}>PIN</label>
            <span className={dialogStyles.inline}>
              <input
                id={`${formId}-pin`}
                aria-label="PIN"
                type="password"
                inputMode="numeric"
                autoComplete="off"
                value={pin}
                maxLength={16}
                aria-invalid={Boolean(pairing.error)}
                aria-describedby={pairing.error ? errorId : undefined}
                onChange={(event) => setPin(event.target.value)}
              />
              <button
                type="button"
                aria-label="Fill PIN"
                title="Fill PIN"
                onClick={() => setPin(device.pairingCode)}
              >
                <Eye size={18} />
              </button>
            </span>
          </div>
          <p className={dialogStyles.notice}>
            Enter the PIN supplied with this device.
          </p>
        </form>
      )}
      {comparison && (
        <>
          <p>Confirm that this code matches the code shown on {device.name}.</p>
          <output className={dialogStyles.code} aria-label="Pairing code">
            {device.pairingCode}
          </output>
        </>
      )}
      {pairing.stage === 'passkey' && (
        <>
          <p>
            Type this passkey on {device.name}, then press Enter on that
            keyboard.
          </p>
          <output className={dialogStyles.code} aria-label="Keyboard passkey">
            {device.pairingCode}
          </output>
        </>
      )}
      {busy && (
        <p className={dialogStyles.notice} role="status">
          {pairing.stage === 'pairing'
            ? 'Pairing device…'
            : 'Paired. Connecting device…'}
        </p>
      )}
      {pairing.error && (
        <p className={dialogStyles.error} id={errorId} role="alert">
          {pairing.error}
        </p>
      )}
      {pairing.stage === 'failed' && (
        <label className={dialogStyles.checkRow}>
          Device nearby
          <Checkbox
            checked={device.available}
            onChange={(event) =>
              status.bluetoothSetDeviceAvailable(
                device.id,
                event.target.checked,
              )
            }
          />
        </label>
      )}
    </WirelessDialog>
  )
}

function DeviceDetails({
  status,
  device,
  onClose,
  onPair,
  onForget,
}: {
  status: BluetoothState
  device: BluetoothDevice
  onClose: () => void
  onPair: () => void
  onForget: () => void
}) {
  const formId = useId()
  const [name, setName] = useState(device.name)
  const [autoConnect, setAutoConnect] = useState(device.autoConnect)
  const [audioProfile, setAudioProfile] = useState(device.audioProfile)
  const paired = status.bluetoothPairedIds.includes(device.id)
  const connected = status.bluetoothConnectedIds.includes(device.id)
  const connecting = status.bluetoothConnectingIds.includes(device.id)
  const error = status.bluetoothConnectionErrors[device.id]
  const pairingElsewhere = status.bluetoothPairing !== null
  const activeService =
    device.audioProfile === 'stereo'
      ? 'High quality playback (A2DP)'
      : 'Calls and microphone (HFP)'

  return (
    <WirelessDialog
      title={`${device.name} details`}
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose}>
            Close
          </button>
          {paired && (
            <button
              type="button"
              className={dialogStyles.danger}
              onClick={onForget}
            >
              Forget device…
            </button>
          )}
          <button
            type="submit"
            form={formId}
            className={dialogStyles.primary}
            disabled={!name.trim()}
          >
            Save changes
          </button>
        </>
      }
    >
      <section className={dialogStyles.section}>
        <dl className={dialogStyles.details}>
          <dt>Status</dt>
          <dd role="status">{connectionDescription(status, device)}</dd>
          <dt>Pairing</dt>
          <dd>{paired ? 'Paired' : 'Not paired'}</dd>
          <dt>Type</dt>
          <dd>
            {device.kind === 'headphones'
              ? 'Headphones'
              : device.kind === 'keyboard'
                ? 'Keyboard'
                : device.kind === 'speaker'
                  ? 'Speakerphone'
                  : 'Phone'}
          </dd>
          <dt>Battery</dt>
          <dd>
            {device.battery}%{connected ? '' : ' (last reported)'}
          </dd>
          <dt>Bluetooth address</dt>
          <dd>{device.address}</dd>
          <dt>Supported services</dt>
          <dd>{device.services.join(', ')}</dd>
          {device.audioProfile && (
            <>
              <dt>Audio service</dt>
              <dd>{connected ? activeService : 'Not active'}</dd>
            </>
          )}
        </dl>
        {error && (
          <p className={dialogStyles.error} role="alert">
            {error}
          </p>
        )}
        <div className={dialogStyles.actions}>
          <button
            type="button"
            disabled={
              !status.bluetoothEnabled ||
              (!paired &&
                (!status.bluetoothAllowNewPairings || pairingElsewhere))
            }
            onClick={() => {
              if (!paired) onPair()
              else if (error && !connecting)
                status.bluetoothRetryConnection(device.id)
              else status.toggleBluetoothDevice(device.id)
            }}
          >
            {connected
              ? 'Disconnect'
              : connecting
                ? 'Cancel connection'
                : !paired
                  ? 'Pair device'
                  : error
                    ? 'Retry connection'
                    : 'Connect'}
          </button>
        </div>
      </section>
      <section className={dialogStyles.section}>
        <form
          id={formId}
          className={dialogStyles.form}
          onSubmit={(event) => {
            event.preventDefault()
            if (!name.trim()) return
            status.bluetoothUpdateDevice(device.id, {
              name,
              autoConnect,
              audioProfile,
            })
            onClose()
          }}
        >
          <label className={dialogStyles.field}>
            Device name
            <input
              value={name}
              maxLength={48}
              required
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {paired && (
            <label className={dialogStyles.checkRow}>
              Automatically reconnect when Bluetooth turns on
              <Checkbox
                checked={autoConnect}
                onChange={(event) => setAutoConnect(event.target.checked)}
              />
            </label>
          )}
          {audioProfile && (
            <SelectControl
              label="Audio profile"
              value={audioProfile}
              onChange={setAudioProfile}
              options={[
                { id: 'stereo', label: 'High quality stereo (A2DP)' },
                { id: 'hands-free', label: 'Hands-free with microphone (HFP)' },
              ]}
            />
          )}
          {audioProfile && (
            <p className={dialogStyles.notice}>
              Stereo prioritizes music quality. Hands-free enables the
              microphone for calls. The active service is shown when connected.
            </p>
          )}
        </form>
      </section>
      <section className={dialogStyles.section}>
        <strong>Connection testing</strong>
        <label className={dialogStyles.checkRow}>
          Device nearby
          <Checkbox
            checked={device.available}
            onChange={(event) =>
              status.bluetoothSetDeviceAvailable(
                device.id,
                event.target.checked,
              )
            }
          />
        </label>
        <p className={dialogStyles.notice}>
          Turn this off to try an out-of-range connection failure. Turn it back
          on and retry to recover. This takes effect immediately.
        </p>
      </section>
    </WirelessDialog>
  )
}

function AdapterSettings({
  status,
  onClose,
  onIncoming,
}: {
  status: BluetoothState
  onClose: () => void
  onIncoming: () => void
}) {
  const formId = useId()
  const [computerName, setComputerName] = useState(status.bluetoothComputerName)
  const [discoverable, setDiscoverable] = useState(status.bluetoothDiscoverable)
  const [allowNewPairings, setAllowNewPairings] = useState(
    status.bluetoothAllowNewPairings,
  )
  const phonePaired = status.bluetoothPairedIds.includes('phone')
  const phone = status.bluetoothDevices.find((device) => device.id === 'phone')!

  function save() {
    status.bluetoothUpdateAdapter({
      computerName,
      discoverable,
      allowNewPairings,
    })
  }

  return (
    <WirelessDialog
      title="Bluetooth settings"
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            form={formId}
            className={dialogStyles.primary}
            disabled={!computerName.trim()}
          >
            Save settings
          </button>
        </>
      }
    >
      <section className={dialogStyles.section}>
        <form
          id={formId}
          className={dialogStyles.form}
          onSubmit={(event) => {
            event.preventDefault()
            if (!computerName.trim()) return
            save()
            onClose()
          }}
        >
          <label className={dialogStyles.field}>
            Computer name
            <input
              value={computerName}
              maxLength={48}
              required
              onChange={(event) => setComputerName(event.target.value)}
            />
          </label>
          <label className={dialogStyles.checkRow}>
            Discoverable to nearby devices
            <Checkbox
              checked={discoverable}
              onChange={(event) => setDiscoverable(event.target.checked)}
            />
          </label>
          <label className={dialogStyles.checkRow}>
            Allow new pairings
            <Checkbox
              checked={allowNewPairings}
              onChange={(event) => setAllowNewPairings(event.target.checked)}
            />
          </label>
          <p className={dialogStyles.notice}>
            Discoverability lets nearby devices find this computer and request
            pairing. Disabling new pairings blocks both incoming requests and
            pairing from the device list. Already paired devices can still
            connect.
          </p>
        </form>
      </section>
      <section className={dialogStyles.section}>
        <button
          type="button"
          disabled={
            !status.bluetoothEnabled ||
            !discoverable ||
            !allowNewPairings ||
            !computerName.trim() ||
            phonePaired ||
            Boolean(status.bluetoothPairing)
          }
          onClick={() => {
            save()
            onIncoming()
          }}
        >
          Simulate incoming pairing
        </button>
        <p className={dialogStyles.notice}>
          {phonePaired
            ? `Forget ${phone.name} to try another incoming request.`
            : `Save the settings above and send a pairing request from ${phone.name}. Bluetooth, discoverability, and new pairings must be enabled.`}
        </p>
      </section>
    </WirelessDialog>
  )
}

export default function BluetoothControls({
  status,
  presentation = 'popover',
}: BluetoothControlsProps) {
  const [dialog, setDialog] = useState<BluetoothDialog>(null)
  const controls = useRef<HTMLDivElement>(null)
  const returnFocusDevice = useRef<BluetoothDeviceId | null>(null)
  const pairingRequestId = dialog?.kind === 'pairing' ? dialog.requestId : null
  const cancelPairing = status.bluetoothCancelPairing
  useEffect(
    () => () => {
      if (pairingRequestId !== null) cancelPairing(pairingRequestId)
    },
    [pairingRequestId, cancelPairing],
  )
  const Heading = presentation === 'settings' ? 'h3' : 'h2'
  const device =
    dialog && 'deviceId' in dialog
      ? status.bluetoothDevices.find((item) => item.id === dialog.deviceId)
      : null
  const pairing = status.bluetoothPairing
  const ownsPairing =
    dialog?.kind === 'pairing' && pairing?.requestId === dialog.requestId

  useLayoutEffect(() => {
    if (ownsPairing || !returnFocusDevice.current) return
    // Pairing and forgetting move a row between lists, replacing the button
    // that the native dialog would ordinarily restore focus to.
    const target =
      controls.current?.querySelector<HTMLInputElement | HTMLButtonElement>(
        `[data-device-action="${returnFocusDevice.current}"]`,
      ) ??
      controls.current?.querySelector<HTMLInputElement>(
        'input[type="checkbox"]',
      )
    target?.focus({ preventScroll: true })
    returnFocusDevice.current = null
  }, [dialog, ownsPairing])

  function pair(deviceId: BluetoothDeviceId, incoming = false) {
    const requestId = status.bluetoothStartPairing(deviceId, incoming)
    returnFocusDevice.current = deviceId
    setDialog({ kind: 'pairing', deviceId, requestId })
  }

  function closePairing() {
    if (dialog?.kind === 'pairing')
      status.bluetoothCancelPairing(dialog.requestId)
    setDialog(null)
  }

  function renderDevice(item: BluetoothDevice) {
    const connected = status.bluetoothConnectedIds.includes(item.id)
    const paired = status.bluetoothPairedIds.includes(item.id)
    const connecting = status.bluetoothConnectingIds.includes(item.id)
    const isPairing = pairing?.deviceId === item.id
    const error = status.bluetoothConnectionErrors[item.id]
    const action = `${connected ? 'Disconnect' : connecting ? 'Cancel connection to' : paired ? (error ? 'Retry connection to' : 'Connect') : 'Pair'} ${item.name}`
    const Icon =
      item.kind === 'headphones'
        ? Headphones
        : item.kind === 'keyboard'
          ? Keyboard
          : item.kind === 'speaker'
            ? Volume
            : Bluetooth
    const Mark =
      isPairing || connecting ? Hourglass : connected ? Check : ChevronRight
    return (
      <div key={item.id} className={styles.row}>
        <button
          type="button"
          className={styles.item}
          data-connected={connected}
          data-device-action={item.id}
          aria-label={action}
          title={action}
          disabled={
            isPairing ||
            (!paired && (!status.bluetoothAllowNewPairings || Boolean(pairing)))
          }
          onClick={() => {
            if (!paired) pair(item.id)
            else if (error && !connecting)
              status.bluetoothRetryConnection(item.id)
            else status.toggleBluetoothDevice(item.id)
          }}
        >
          <Icon size={19} />
          <span className={styles.name}>
            <strong>{item.name}</strong>
            <span>{connectionDescription(status, item)}</span>
          </span>
          <Mark size={17} />
        </button>
        <button
          type="button"
          className={styles.detailButton}
          aria-label={`${item.name} details`}
          title={`${item.name} details`}
          onClick={() => setDialog({ kind: 'details', deviceId: item.id })}
        >
          <Settings size={17} />
        </button>
      </div>
    )
  }

  return (
    <div
      ref={controls}
      className={styles.controls}
      data-presentation={presentation}
    >
      <label className={styles.toggleRow}>
        <span className={styles.toggleCopy}>
          <strong>Bluetooth</strong>
          {presentation === 'settings' && <span>{status.bluetoothLabel}</span>}
        </span>
        <ToggleSwitch
          role="checkbox"
          aria-label="Bluetooth"
          checked={status.bluetoothEnabled}
          onChange={(event) => status.setBluetoothEnabled(event.target.checked)}
        />
      </label>
      {status.bluetoothEnabled ? (
        <>
          <div className={styles.list}>
            <Heading className={styles.listHeading}>My devices</Heading>
            {status.bluetoothDevices
              .filter((item) => status.bluetoothPairedIds.includes(item.id))
              .map(renderDevice)}
            {!status.bluetoothPairedIds.length && (
              <p className={styles.feedback}>No paired devices.</p>
            )}
            <div className={styles.group}>
              <Heading className={styles.listHeading}>Nearby devices</Heading>
              {status.bluetoothDevices
                .filter(
                  (item) =>
                    !status.bluetoothPairedIds.includes(item.id) &&
                    status.bluetoothDiscoveredIds.includes(item.id),
                )
                .map(renderDevice)}
            </div>
          </div>
          {!status.bluetoothAllowNewPairings && (
            <p className={styles.feedback}>
              New pairings are disabled in Bluetooth settings.
            </p>
          )}
          {status.bluetoothDiscoverable && (
            <p className={styles.feedback}>
              Visible as {status.bluetoothComputerName}
            </p>
          )}
        </>
      ) : (
        <div className={styles.off}>
          <BluetoothOff size={28} />
          <strong>Bluetooth is off</strong>
          <span>Turn on Bluetooth to connect your devices.</span>
        </div>
      )}
      <div className={styles.toolbar}>
        <button
          type="button"
          className={styles.smallButton}
          disabled={!status.bluetoothEnabled || status.bluetoothScanning}
          onClick={status.bluetoothRescan}
        >
          <RotateCcw
            size={15}
            className={status.bluetoothScanning ? styles.spinning : undefined}
          />
          {status.bluetoothScanning ? 'Scanning…' : 'Scan for devices'}
        </button>
        <button
          type="button"
          className={styles.smallButton}
          onClick={() => setDialog({ kind: 'adapter' })}
        >
          <Settings size={15} />
          Adapter settings
        </button>
      </div>
      {status.bluetoothMessage && (
        <p className={styles.feedback} role="status">
          {status.bluetoothMessage}
        </p>
      )}
      {ownsPairing && device && (
        <PairingDialog
          key={pairing.requestId}
          status={status}
          device={device}
          onClose={closePairing}
        />
      )}
      {dialog?.kind === 'details' && device && (
        <DeviceDetails
          key={device.id}
          status={status}
          device={device}
          onClose={() => setDialog(null)}
          onPair={() => pair(device.id)}
          onForget={() => setDialog({ kind: 'forget', deviceId: device.id })}
        />
      )}
      {dialog?.kind === 'forget' && device && (
        <WirelessDialog
          title={`Forget ${device.name}?`}
          description="This disconnects the device and removes its pairing and automatic reconnection preference. You’ll need to pair it again before connecting."
          onClose={() => setDialog({ kind: 'details', deviceId: device.id })}
          actions={
            <>
              <button
                type="button"
                onClick={() =>
                  setDialog({ kind: 'details', deviceId: device.id })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className={dialogStyles.danger}
                onClick={() => {
                  returnFocusDevice.current = device.id
                  status.bluetoothForgetDevice(device.id)
                  setDialog(null)
                }}
              >
                Forget device
              </button>
            </>
          }
        >
          <p>
            The device will remain in the nearby list so you can pair it again.
          </p>
        </WirelessDialog>
      )}
      {dialog?.kind === 'adapter' && (
        <AdapterSettings
          status={status}
          onClose={() => setDialog(null)}
          onIncoming={() => pair('phone', true)}
        />
      )}
    </div>
  )
}
