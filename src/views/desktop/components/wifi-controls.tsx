import Checkbox from '../../../components/controls/checkbox'
import SelectControl from '../../../components/controls/select-control'
import ToggleSwitch from '../../../components/controls/toggle-switch'
import { useId, useRef, useState, type FormEvent } from 'react'
import {
  Check,
  ChevronRight,
  Eye,
  Lock,
  Plus,
  RotateCcw,
  User,
  Wifi,
  WifiOff,
} from '../../../components/icons'
import {
  type WifiEnterpriseCredentials,
  type WifiNetwork,
  type WifiNetworkSettings,
  type WifiSecurity,
  type WifiState,
} from '../types/wifi'
import { WIFI_IDENTITY, WIFI_PASSWORD } from '../constants/wifi'
import WirelessDialog from './wireless-dialog'
import dialogStyles from './wireless-dialog.module.css'
import styles from './wireless-controls.module.css'

interface WifiControlsProps {
  status: WifiState
  presentation?: 'popover' | 'settings'
}

type WifiDialog =
  | { kind: 'password' | 'details' | 'forget' | 'portal'; networkId: string }
  | { kind: 'hidden' }
  | null

export default function WifiControls({
  status,
  presentation = 'popover',
}: WifiControlsProps) {
  return (
    <div className={styles.controls} data-presentation={presentation}>
      <label className={styles.toggleRow}>
        <span className={styles.toggleCopy}>
          <strong>Wi-Fi</strong>
          {presentation === 'settings' && <span>{status.wifiLabel}</span>}
        </span>
        <ToggleSwitch
          role="checkbox"
          aria-label="Wi-Fi"
          checked={status.wifiEnabled}
          onChange={(event) => status.setWifiEnabled(event.target.checked)}
        />
      </label>
      {status.wifiEnabled ? (
        <WifiNetworks status={status} presentation={presentation} />
      ) : (
        <div className={styles.off}>
          <WifiOff size={28} />
          <strong>Wi-Fi is off</strong>
          <span>Turn on Wi-Fi to see available networks.</span>
        </div>
      )}
    </div>
  )
}

function WifiNetworks({ status, presentation }: WifiControlsProps) {
  const [dialog, setDialog] = useState<WifiDialog>(null)
  const Heading = presentation === 'settings' ? 'h3' : 'h2'
  const selected =
    dialog && dialog.kind !== 'hidden'
      ? status.wifiNetworks.find((network) => network.id === dialog.networkId)
      : undefined
  const connected = status.wifiNetwork
  const portalRequired =
    connected?.scenario === 'portal' && !connected.portalAccepted

  function connect(network: WifiNetwork) {
    if (status.wifiPendingNetwork) status.wifiCancelConnection()
    status.wifiClearFeedback()
    if (network.secured && !network.credentialsRemembered) {
      setDialog({ kind: 'password', networkId: network.id })
    } else {
      status.selectWifiNetwork(network.id)
      setDialog(null)
    }
  }

  function closeDialog() {
    setDialog(null)
  }

  return (
    <>
      <div className={styles.list}>
        <Heading className={styles.listHeading}>Networks</Heading>
        {status.wifiNetworks.map((network) => {
          const isConnected = connected?.id === network.id
          const isPending = status.wifiPendingNetwork?.id === network.id
          const action = isPending
            ? `Cancel connection to ${network.name}`
            : `${isConnected ? 'Disconnect from' : 'Connect to'} ${network.name}`
          const description = isPending
            ? 'Connecting…'
            : isConnected
              ? network.scenario === 'limited'
                ? 'Connected · No internet'
                : network.scenario === 'portal' && !network.portalAccepted
                  ? 'Connected · Sign-in required'
                  : 'Connected'
              : network.saved
                ? network.secured && !network.credentialsRemembered
                  ? 'Saved · Password required'
                  : 'Saved network'
                : network.security === 'WPA2 Enterprise'
                  ? 'Enterprise · Identity required'
                  : network.secured
                    ? 'Password required'
                    : 'Open network'
          const Mark = isConnected ? Check : network.secured ? Lock : null
          return (
            <div className={styles.row} key={network.id}>
              <button
                type="button"
                className={styles.item}
                data-connected={isConnected}
                aria-label={action}
                title={action}
                onClick={() => {
                  if (isPending) status.wifiCancelConnection()
                  else if (isConnected) status.selectWifiNetwork(null)
                  else connect(network)
                }}
              >
                <Wifi size={19} />
                <span className={styles.name}>
                  <strong>{network.name}</strong>
                  <span>
                    {description}
                    {network.settings.metered && ' · Metered'}
                    {network.hidden && ' · Hidden'}
                  </span>
                </span>
                {Mark && <Mark size={17} />}
              </button>
              <button
                type="button"
                className={styles.detailButton}
                aria-label={`${network.name} details`}
                title={`${network.name} details`}
                onClick={() =>
                  setDialog({ kind: 'details', networkId: network.id })
                }
              >
                <ChevronRight size={17} />
              </button>
            </div>
          )
        })}
      </div>
      <div className={styles.toolbar}>
        <button
          className={styles.smallButton}
          type="button"
          disabled={status.wifiScanning}
          onClick={status.wifiScan}
        >
          <RotateCcw
            size={15}
            className={status.wifiScanning ? styles.spinning : undefined}
          />
          {status.wifiScanning ? 'Scanning…' : 'Refresh networks'}
        </button>
        <button
          className={styles.smallButton}
          type="button"
          onClick={() => setDialog({ kind: 'hidden' })}
        >
          <Plus size={15} /> Join hidden network
        </button>
      </div>
      {(status.wifiScanning || status.wifiScanCount > 0) && (
        <p className={styles.feedback} role="status">
          {status.wifiScanning
            ? 'Looking for networks…'
            : `${status.wifiNetworks.length} networks found · Scan complete`}
        </p>
      )}
      {status.wifiPendingNetwork ? (
        <div className={styles.feedback} role="status">
          {status.wifiConnectionStatus}
          <button
            className={styles.smallButton}
            type="button"
            onClick={status.wifiCancelConnection}
          >
            Cancel connection
          </button>
        </div>
      ) : (
        <>
          {status.wifiFeedback && (
            <div
              className={styles.feedback}
              role={status.wifiFeedback.error ? 'alert' : 'status'}
            >
              {status.wifiFeedback.message}
              {status.wifiFeedback.error && status.wifiFeedback.networkId && (
                <button
                  className={styles.smallButton}
                  type="button"
                  onClick={() => {
                    const network = status.wifiNetworks.find(
                      (item) => item.id === status.wifiFeedback?.networkId,
                    )
                    if (network) connect(network)
                  }}
                >
                  Retry
                </button>
              )}
            </div>
          )}
          {portalRequired && (
            <button
              className={styles.smallButton}
              type="button"
              onClick={() =>
                setDialog({ kind: 'portal', networkId: connected.id })
              }
            >
              Sign in to {connected.name}
            </button>
          )}
          {connected?.scenario === 'limited' && (
            <button
              className={styles.smallButton}
              type="button"
              onClick={() => status.selectWifiNetwork(connected.id)}
            >
              Retry connection
            </button>
          )}
        </>
      )}
      {dialog?.kind === 'hidden' && (
        <HiddenNetworkDialog status={status} onClose={closeDialog} />
      )}
      {dialog?.kind === 'password' && selected && (
        <PasswordDialog
          key={selected.id}
          network={selected}
          status={status}
          onClose={closeDialog}
        />
      )}
      {dialog?.kind === 'details' && selected && (
        <NetworkDetailsDialog
          key={selected.id}
          network={selected}
          status={status}
          onClose={closeDialog}
          onConnect={() => connect(selected)}
          onForget={() => setDialog({ kind: 'forget', networkId: selected.id })}
          onPortal={() => setDialog({ kind: 'portal', networkId: selected.id })}
        />
      )}
      {dialog?.kind === 'forget' && selected && (
        <WirelessDialog
          title={`Forget ${selected.name}?`}
          description="This removes saved credentials and network settings. You’ll need to join again to reconnect."
          onClose={closeDialog}
          actions={
            <>
              <button
                type="button"
                onClick={() =>
                  setDialog({ kind: 'details', networkId: selected.id })
                }
              >
                Cancel
              </button>
              <button
                className={dialogStyles.danger}
                type="button"
                onClick={() => {
                  status.wifiForgetNetwork(selected.id)
                  closeDialog()
                }}
              >
                Forget
              </button>
            </>
          }
        >
          {connected?.id === selected.id && (
            <p className={dialogStyles.notice}>
              You will be disconnected from this network.
            </p>
          )}
          {selected.hidden && (
            <p className={dialogStyles.notice}>
              This hidden network will also be removed from the network list.
            </p>
          )}
        </WirelessDialog>
      )}
      {dialog?.kind === 'portal' && selected && (
        <PortalDialog
          network={selected}
          status={status}
          onClose={closeDialog}
        />
      )}
    </>
  )
}

function PasswordField({
  value,
  onChange,
  errorId,
}: {
  value: string
  onChange: (value: string) => void
  errorId?: string
}) {
  const id = useId()
  const input = useRef<HTMLInputElement>(null)
  return (
    <div className={dialogStyles.field}>
      <label htmlFor={id}>Password</label>
      <div className={dialogStyles.inline}>
        <input
          ref={input}
          id={id}
          type="password"
          aria-label="Password"
          aria-invalid={Boolean(errorId)}
          aria-describedby={errorId}
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        <button
          type="button"
          aria-label="Fill password"
          title="Fill password"
          onClick={() => {
            onChange(WIFI_PASSWORD)
            input.current?.focus()
          }}
        >
          <Eye size={18} />
        </button>
      </div>
    </div>
  )
}

function EnterpriseFields({
  value,
  onChange,
}: {
  value: WifiEnterpriseCredentials
  onChange: (value: WifiEnterpriseCredentials) => void
}) {
  const identityId = useId()
  const identityInput = useRef<HTMLInputElement>(null)
  return (
    <>
      <div className={dialogStyles.field}>
        <label htmlFor={identityId}>Identity</label>
        <div className={dialogStyles.inline}>
          <input
            ref={identityInput}
            id={identityId}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="name@organization"
            value={value.identity}
            onChange={(event) =>
              onChange({ ...value, identity: event.target.value })
            }
          />
          <button
            type="button"
            aria-label="Fill identity"
            title="Fill identity"
            onClick={() => {
              onChange({ ...value, identity: WIFI_IDENTITY })
              identityInput.current?.focus()
            }}
          >
            <User size={18} />
          </button>
        </div>
      </div>
      <div className={dialogStyles.fieldRow}>
        <label className={dialogStyles.field}>
          EAP method
          <SelectControl
            value={value.method}
            onChange={(event) =>
              onChange({
                ...value,
                method: event.target
                  .value as WifiEnterpriseCredentials['method'],
              })
            }
          >
            <option value="PEAP">PEAP</option>
            <option value="TTLS">TTLS</option>
          </SelectControl>
        </label>
        <label className={dialogStyles.field}>
          Certificate validation
          <SelectControl
            value={value.certificate}
            onChange={(event) =>
              onChange({
                ...value,
                certificate: event.target
                  .value as WifiEnterpriseCredentials['certificate'],
              })
            }
          >
            <option value="hearthspace">Hearthspace certificate</option>
            <option value="system">System certificates</option>
          </SelectControl>
        </label>
      </div>
      <p className={dialogStyles.notice}>
        Authentication server: radius.hearthspace.test
      </p>
    </>
  )
}

function PasswordDialog({
  network,
  status,
  onClose,
}: {
  network: WifiNetwork
  status: WifiState
  onClose: () => void
}) {
  const formId = useId()
  const errorId = useId()
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enterprise, setEnterprise] = useState<WifiEnterpriseCredentials>({
    identity: '',
    method: 'PEAP',
    certificate: 'hearthspace',
  })
  const enterpriseRequired = network.security === 'WPA2 Enterprise'
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const problem = status.wifiConnect(
      network.id,
      password,
      remember,
      enterpriseRequired ? enterprise : undefined,
    )
    if (problem) setError(problem)
    else onClose()
  }
  return (
    <WirelessDialog
      title={`Connect to ${network.name}`}
      description={network.security}
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className={dialogStyles.primary} type="submit" form={formId}>
            Connect
          </button>
        </>
      }
    >
      <form id={formId} className={dialogStyles.form} onSubmit={submit}>
        {enterpriseRequired && (
          <EnterpriseFields
            value={enterprise}
            onChange={(value) => {
              setEnterprise(value)
              setError(null)
            }}
          />
        )}
        <PasswordField
          value={password}
          onChange={(value) => {
            setPassword(value)
            setError(null)
          }}
          errorId={error ? errorId : undefined}
        />
        <label className={dialogStyles.checkRow}>
          {enterpriseRequired ? 'Remember credentials' : 'Remember password'}
          <Checkbox
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />
        </label>
        {error && (
          <p className={dialogStyles.error} id={errorId} role="alert">
            {error}
          </p>
        )}
      </form>
    </WirelessDialog>
  )
}

function HiddenNetworkDialog({
  status,
  onClose,
}: {
  status: WifiState
  onClose: () => void
}) {
  const formId = useId()
  const errorId = useId()
  const [name, setName] = useState('')
  const [security, setSecurity] = useState<WifiSecurity>('WPA2 Personal')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [enterprise, setEnterprise] = useState<WifiEnterpriseCredentials>({
    identity: '',
    method: 'PEAP',
    certificate: 'hearthspace',
  })
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const problem = status.wifiJoinHiddenNetwork({
      name,
      security,
      password,
      remember,
      enterprise: security === 'WPA2 Enterprise' ? enterprise : undefined,
    })
    if (problem) setError(problem)
    else onClose()
  }
  return (
    <WirelessDialog
      title="Join hidden network"
      description="Enter the exact network name and its security type."
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className={dialogStyles.primary} type="submit" form={formId}>
            Connect
          </button>
        </>
      }
    >
      <form className={dialogStyles.form} id={formId} onSubmit={submit}>
        <label className={dialogStyles.field}>
          Network name
          <input
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
        </label>
        <label className={dialogStyles.field}>
          Security
          <SelectControl
            value={security}
            onChange={(event) => {
              setSecurity(event.target.value as WifiSecurity)
              setPassword('')
              setError(null)
            }}
          >
            <option>WPA2 Personal</option>
            <option>WPA3 Personal</option>
            <option>WPA2 Enterprise</option>
            <option>Open</option>
          </SelectControl>
        </label>
        {security === 'WPA2 Enterprise' && (
          <EnterpriseFields
            value={enterprise}
            onChange={(value) => {
              setEnterprise(value)
              setError(null)
            }}
          />
        )}
        {security !== 'Open' && (
          <>
            <PasswordField
              value={password}
              onChange={(value) => {
                setPassword(value)
                setError(null)
              }}
              errorId={error ? errorId : undefined}
            />
            <label className={dialogStyles.checkRow}>
              {security === 'WPA2 Enterprise'
                ? 'Remember credentials'
                : 'Remember password'}
              <Checkbox
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
            </label>
          </>
        )}
        {error && (
          <p className={dialogStyles.error} role="alert" id={errorId}>
            {error}
          </p>
        )}
      </form>
    </WirelessDialog>
  )
}

function NetworkDetailsDialog({
  network,
  status,
  onClose,
  onConnect,
  onForget,
  onPortal,
}: {
  network: WifiNetwork
  status: WifiState
  onClose: () => void
  onConnect: () => void
  onForget: () => void
  onPortal: () => void
}) {
  const formId = useId()
  const [draft, setDraft] = useState<WifiNetworkSettings>({
    ...network.settings,
  })
  const [error, setError] = useState<string | null>(null)
  const connected = status.wifiNetwork?.id === network.id
  const pending = status.wifiPendingNetwork?.id === network.id
  const settings = network.settings
  const address =
    settings.ipv4Mode === 'manual' ? settings.address : network.lease.address
  const gateway =
    settings.ipv4Mode === 'manual' ? settings.gateway : network.lease.gateway
  const dns = settings.dnsMode === 'manual' ? settings.dns : network.lease.dns

  function update<K extends keyof WifiNetworkSettings>(
    key: K,
    value: WifiNetworkSettings[K],
  ) {
    setDraft({ ...draft, [key]: value })
    setError(null)
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const problem = status.wifiSaveSettings(network.id, draft)
    if (problem) setError(problem)
    else onClose()
  }

  return (
    <WirelessDialog
      title={`${network.name} details`}
      description={
        pending
          ? 'Connecting…'
          : connected
            ? status.wifiConnectionStatus
            : network.saved
              ? 'Saved network'
              : 'Available network'
      }
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className={dialogStyles.primary} type="submit" form={formId}>
            Save
          </button>
        </>
      }
    >
      <div className={dialogStyles.section}>
        <dl className={dialogStyles.details}>
          <dt>Signal</dt>
          <dd>
            {network.signal > -55
              ? 'Excellent'
              : network.signal > -67
                ? 'Good'
                : network.signal > -75
                  ? 'Fair'
                  : 'Weak'}{' '}
            ({network.signal} dBm)
          </dd>
          <dt>Security</dt>
          <dd>{network.security}</dd>
          <dt>Band / channel</dt>
          <dd>
            {network.band} / {network.channel}
          </dd>
          <dt>Link speed</dt>
          <dd>{connected ? `${network.linkSpeed} Mbps` : 'Not connected'}</dd>
          <dt>IP address</dt>
          <dd>{connected ? address : 'Not assigned'}</dd>
          <dt>Gateway</dt>
          <dd>{connected ? gateway : 'Not assigned'}</dd>
          <dt>DNS servers</dt>
          <dd>{connected ? dns : 'Not assigned'}</dd>
          <dt>MAC address</dt>
          <dd>
            {settings.privateMac ? network.privateAddress : '70:85:C2:31:08:42'}
          </dd>
          <dt>Address type</dt>
          <dd>
            {settings.privateMac
              ? 'Private for this network'
              : 'Device address'}
          </dd>
          {network.enterpriseMethod && (
            <>
              <dt>EAP method</dt>
              <dd>{network.enterpriseMethod}</dd>
              <dt>Certificate</dt>
              <dd>Hearthspace certificate</dd>
            </>
          )}
          {network.hidden && (
            <>
              <dt>Visibility</dt>
              <dd>Hidden network</dd>
            </>
          )}
        </dl>
        <div className={dialogStyles.actions}>
          {network.saved || network.hidden ? (
            <button type="button" onClick={onForget}>
              Forget network
            </button>
          ) : null}
          {pending ? (
            <button
              type="button"
              onClick={() => {
                status.wifiCancelConnection()
                onClose()
              }}
            >
              Cancel connection
            </button>
          ) : connected ? (
            <button
              type="button"
              onClick={() => {
                status.selectWifiNetwork(null)
                onClose()
              }}
            >
              Disconnect
            </button>
          ) : (
            <button type="button" onClick={onConnect}>
              Connect
            </button>
          )}
          {connected &&
            network.scenario === 'portal' &&
            !network.portalAccepted && (
              <button type="button" onClick={onPortal}>
                Sign in
              </button>
            )}
        </div>
      </div>
      <form className={dialogStyles.section} id={formId} onSubmit={submit}>
        <label className={dialogStyles.checkRow}>
          Auto-connect
          <Checkbox
            checked={draft.autoConnect}
            onChange={(event) => update('autoConnect', event.target.checked)}
          />
        </label>
        <label className={dialogStyles.checkRow}>
          Metered connection
          <Checkbox
            checked={draft.metered}
            onChange={(event) => update('metered', event.target.checked)}
          />
        </label>
        <label className={dialogStyles.checkRow}>
          Private MAC address
          <Checkbox
            checked={draft.privateMac}
            onChange={(event) => update('privateMac', event.target.checked)}
          />
        </label>
        {draft.metered && (
          <p className={dialogStyles.notice}>
            Treat this connection as a limited data plan.
          </p>
        )}
        <label className={dialogStyles.field}>
          IPv4 configuration
          <SelectControl
            value={draft.ipv4Mode}
            onChange={(event) =>
              update(
                'ipv4Mode',
                event.target.value as WifiNetworkSettings['ipv4Mode'],
              )
            }
          >
            <option value="automatic">Automatic (DHCP)</option>
            <option value="manual">Manual</option>
          </SelectControl>
        </label>
        {draft.ipv4Mode === 'manual' && (
          <>
            <div className={dialogStyles.fieldRow}>
              <label className={dialogStyles.field}>
                IP address
                <input
                  value={draft.address}
                  onChange={(event) => update('address', event.target.value)}
                  inputMode="decimal"
                  placeholder="192.168.1.24"
                />
              </label>
              <label className={dialogStyles.field}>
                Subnet mask
                <input
                  value={draft.subnetMask}
                  onChange={(event) => update('subnetMask', event.target.value)}
                  inputMode="decimal"
                  placeholder="255.255.255.0"
                />
              </label>
            </div>
            <label className={dialogStyles.field}>
              Gateway
              <input
                value={draft.gateway}
                onChange={(event) => update('gateway', event.target.value)}
                inputMode="decimal"
                placeholder="192.168.1.1"
              />
            </label>
          </>
        )}
        <label className={dialogStyles.field}>
          DNS configuration
          <SelectControl
            value={draft.dnsMode}
            onChange={(event) =>
              update(
                'dnsMode',
                event.target.value as WifiNetworkSettings['dnsMode'],
              )
            }
          >
            <option value="automatic">Automatic</option>
            <option value="manual">Manual</option>
          </SelectControl>
        </label>
        {draft.dnsMode === 'manual' && (
          <label className={dialogStyles.field}>
            DNS servers
            <input
              value={draft.dns}
              onChange={(event) => update('dns', event.target.value)}
              placeholder="1.1.1.1, 8.8.8.8"
            />
            <span>Separate addresses with commas.</span>
          </label>
        )}
        {error && (
          <p className={dialogStyles.error} role="alert">
            {error}
          </p>
        )}
      </form>
    </WirelessDialog>
  )
}

function PortalDialog({
  network,
  status,
  onClose,
}: {
  network: WifiNetwork
  status: WifiState
  onClose: () => void
}) {
  const formId = useId()
  const [accepted, setAccepted] = useState(false)
  const connected = status.wifiNetwork?.id === network.id
  return (
    <WirelessDialog
      title={`Sign in to ${network.name}`}
      description="Welcome to Hearthspace."
      onClose={onClose}
      actions={
        <>
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button
            className={dialogStyles.primary}
            type="submit"
            form={formId}
            disabled={!accepted || !connected}
          >
            Connect to internet
          </button>
        </>
      }
    >
      <form
        id={formId}
        className={dialogStyles.form}
        onSubmit={(event) => {
          event.preventDefault()
          if (!accepted || !connected) return
          status.wifiAcceptPortal(network.id)
          onClose()
        }}
      >
        <p>
          Guest access is available for your visit. Please use the shared
          connection respectfully and keep your device secure.
        </p>
        <label className={dialogStyles.checkRow}>
          I agree to the guest network terms
          <Checkbox
            checked={accepted}
            onChange={(event) => setAccepted(event.target.checked)}
          />
        </label>
        {!connected && (
          <p className={dialogStyles.error} role="alert">
            This network is disconnected. Close this window and reconnect to
            sign in.
          </p>
        )}
      </form>
    </WirelessDialog>
  )
}
