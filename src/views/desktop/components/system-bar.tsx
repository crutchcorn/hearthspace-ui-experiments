import BatteryStatus from '../../../components/system-status/battery-status'
import SoundControl from '../../../components/system-status/sound-control'
import { useEffect, useRef, useState } from 'react'
import {
  BatteryFull,
  Bluetooth,
  BluetoothOff,
  Clock,
  Lock,
  LogOut,
  Power,
  RotateCcw,
  Volume,
  VolumeMuted,
  Wifi,
  WifiOff,
} from '../../../components/icons'
import { type SystemStatus, type SystemPanel } from '../types/system-status'
import { formatClock, type ClockDateFormat } from '../utils/clock-format'
import WidgetPopover from './widget-popover'
import LayoutConfirm from './layout-confirm'
import popoverStyles from './widget-popover.module.css'
import styles from './system-bar.module.css'
import shellStyles from './shell-controls.module.css'
import WirelessControls from './wireless-controls'

const powerActions = {
  'Log off': 'Save your work before ending this session.',
  Reboot: 'Save your work before restarting your computer.',
  'Turn off': 'Save your work before turning off your computer.',
}

interface SystemBarProps {
  status: SystemStatus
  openPanel: SystemPanel
  onPanelChange: (panel: SystemPanel) => void
  id: Exclude<SystemPanel, null>
  expanded: boolean
  clockDateFormat: ClockDateFormat
  onLock: () => void
}

export default function SystemBar({
  status,
  openPanel,
  onPanelChange,
  id,
  expanded,
  clockDateFormat,
  onLock,
}: SystemBarProps) {
  const root = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [powerAction, setPowerAction] = useState<
    keyof typeof powerActions | null
  >(null)
  const {
    wifiNetwork,
    wifiLabel,
    bluetoothEnabled,
    bluetoothLabel,
    volume,
    setVolume,
    now,
    batteryPercentage,
  } = status

  useEffect(() => {
    if (openPanel !== id) return
    const panel = panelRef.current
    const control = panel?.querySelector<HTMLElement>(
      'button:not(:disabled), input:not(:disabled), select:not(:disabled)',
    )
    ;(control ?? panel)?.focus({ preventScroll: true })
  }, [id, openPanel])

  useEffect(() => {
    if (openPanel !== id) return

    function dismissOnPointer(event: PointerEvent) {
      if (document.querySelector(':modal')) return
      if (
        event.target instanceof Element &&
        !root.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      ) {
        onPanelChange(null)
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (document.querySelector(':modal')) return
      if (event.key === 'Escape') {
        onPanelChange(null)
        root.current?.querySelector('button')?.focus({ preventScroll: true })
      }
    }

    document.addEventListener('pointerdown', dismissOnPointer, true)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOnPointer, true)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [id, openPanel, onPanelChange])

  function togglePanel(panel: Exclude<SystemPanel, null>) {
    onPanelChange(openPanel === panel ? null : panel)
  }

  function confirmPowerAction(action: keyof typeof powerActions) {
    root.current?.querySelector('button')?.focus({ preventScroll: true })
    onPanelChange(null)
    setPowerAction(action)
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate()

  return (
    <header
      ref={root}
      className={`${styles.bar} ${shellStyles.surface}`}
      aria-label={id === 'clock' ? 'Date and time' : `${id} status`}
      data-status-item={id}
      data-system-popover-root
    >
      {id === 'clock' && (
        <button
          type="button"
          className={`${expanded ? styles.clockButton : styles.statusButton} ${shellStyles.control}`}
          onClick={() => togglePanel('clock')}
          title={now.toLocaleDateString(undefined, {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
          aria-label="Date and time"
          aria-expanded={openPanel === 'clock'}
        >
          {expanded ? (
            <span className={styles.clockLabel}>
              {formatClock(now, clockDateFormat)}
            </span>
          ) : (
            <Clock size={18} aria-hidden="true" />
          )}
        </button>
      )}
      {id === 'wifi' && (
        <button
          type="button"
          className={`${styles.statusButton} ${expanded ? styles.withDetail : ''} ${shellStyles.control}`}
          title={`Wi-Fi · ${wifiLabel}`}
          aria-label="Wi-Fi settings"
          aria-expanded={openPanel === 'wifi'}
          onClick={() => togglePanel('wifi')}
        >
          {wifiNetwork ? <Wifi size={17} /> : <WifiOff size={17} />}
          {expanded && (
            <span className={styles.detail} aria-hidden="true">
              {wifiLabel}
            </span>
          )}
        </button>
      )}
      {id === 'bluetooth' && (
        <button
          type="button"
          className={`${styles.statusButton} ${expanded ? styles.withDetail : ''} ${shellStyles.control}`}
          title={`Bluetooth · ${bluetoothLabel}`}
          aria-label="Bluetooth settings"
          aria-expanded={openPanel === 'bluetooth'}
          onClick={() => togglePanel('bluetooth')}
        >
          {bluetoothEnabled ? (
            <Bluetooth size={17} />
          ) : (
            <BluetoothOff size={17} />
          )}
          {expanded && (
            <span className={styles.detail} aria-hidden="true">
              {bluetoothLabel}
            </span>
          )}
        </button>
      )}
      {id === 'volume' && (
        <button
          type="button"
          className={`${styles.statusButton} ${expanded ? styles.withDetail : ''} ${shellStyles.control}`}
          title={volume > 0 ? `Sound · ${volume}%` : 'Sound · Muted'}
          aria-label="Sound settings"
          aria-expanded={openPanel === 'volume'}
          onClick={() => togglePanel('volume')}
        >
          {volume > 0 ? <Volume size={17} /> : <VolumeMuted size={17} />}
          {expanded && (
            <span className={styles.detail} aria-hidden="true">
              {volume}%
            </span>
          )}
        </button>
      )}
      {id === 'battery' && (
        <button
          type="button"
          className={`${styles.statusButton} ${expanded ? styles.withDetail : ''} ${shellStyles.control}`}
          title={`Battery · ${batteryPercentage}%`}
          aria-label={`Battery status, ${batteryPercentage}%`}
          aria-expanded={openPanel === 'battery'}
          onClick={() => togglePanel('battery')}
        >
          <BatteryFull size={19} aria-hidden="true" />
          {expanded && (
            <span className={styles.detail} aria-hidden="true">
              {batteryPercentage}%
            </span>
          )}
        </button>
      )}

      {id === 'power' && (
        <button
          type="button"
          className={`${styles.statusButton} ${shellStyles.control}`}
          title="Power"
          aria-label="Power"
          aria-haspopup="menu"
          aria-expanded={openPanel === 'power'}
          onClick={() => togglePanel('power')}
        >
          <Power size={18} />
        </button>
      )}

      {openPanel === id && (
        <WidgetPopover>
          {id === 'power' && (
            <div
              className={`${popoverStyles.panel} ${styles.popover} ${styles.powerMenu}`}
              ref={panelRef}
              role="menu"
              aria-label="Power"
              data-system-panel
              onKeyDown={(event) => {
                const buttons = Array.from(
                  event.currentTarget.querySelectorAll('button'),
                )
                const index = buttons.indexOf(
                  document.activeElement as HTMLButtonElement,
                )
                let next: number
                if (event.key === 'ArrowDown')
                  next = (index + 1) % buttons.length
                else if (event.key === 'ArrowUp')
                  next = (index - 1 + buttons.length) % buttons.length
                else if (event.key === 'Home') next = 0
                else if (event.key === 'End') next = buttons.length - 1
                else return
                event.preventDefault()
                event.stopPropagation()
                buttons[next]?.focus()
              }}
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  root.current
                    ?.querySelector('button')
                    ?.focus({ preventScroll: true })
                  onLock()
                }}
              >
                <Lock size={18} />
                Lock screen
              </button>
              <div className={styles.menuDivider} role="separator" />
              <button
                type="button"
                role="menuitem"
                onClick={() => confirmPowerAction('Log off')}
              >
                <LogOut size={18} />
                Log off
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => confirmPowerAction('Reboot')}
              >
                <RotateCcw size={18} />
                Reboot
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => confirmPowerAction('Turn off')}
              >
                <Power size={18} />
                Turn off
              </button>
            </div>
          )}
          {(id === 'wifi' || id === 'bluetooth') && (
            <div
              className={`${popoverStyles.panel} ${styles.popover} ${styles.systemPopover}`}
              ref={panelRef}
              role="region"
              aria-label={id === 'wifi' ? 'Wi-Fi' : 'Bluetooth'}
              data-system-panel
              tabIndex={-1}
            >
              <WirelessControls kind={id} status={status} />
            </div>
          )}

          {id === 'volume' && openPanel === id && (
            <div
              className={`${popoverStyles.panel} ${styles.popover} ${styles.systemPopover}`}
              ref={panelRef}
              data-system-panel
              tabIndex={-1}
            >
              <SoundControl value={volume} onChange={setVolume} />
            </div>
          )}

          {id === 'battery' && openPanel === id && (
            <div
              className={`${popoverStyles.panel} ${styles.popover} ${styles.systemPopover}`}
              ref={panelRef}
              data-system-panel
              tabIndex={-1}
            >
              <BatteryStatus
                percentage={batteryPercentage}
                powerSource="On battery power"
              />
            </div>
          )}

          {id === 'clock' && openPanel === id && (
            <div
              className={`${popoverStyles.panel} ${styles.popover} ${styles.calendarPopover}`}
              ref={panelRef}
              data-system-panel
              tabIndex={-1}
            >
              <div className={styles.calendarHeading}>
                <div>
                  <strong>
                    {now.toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric',
                    })}
                  </strong>
                  <span>
                    {now.toLocaleDateString(undefined, {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
              </div>
              <div className={styles.calendar} aria-label="Current month">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                  <span key={`weekday-${index}`} className={styles.weekday}>
                    {day}
                  </span>
                ))}
                {Array.from({ length: monthStart }, (_, index) => (
                  <span key={`blank-${index}`} />
                ))}
                {Array.from({ length: daysInMonth }, (_, index) => (
                  <span
                    key={index + 1}
                    className={
                      index + 1 === now.getDate() ? styles.today : undefined
                    }
                  >
                    {index + 1}
                  </span>
                ))}
              </div>
            </div>
          )}
        </WidgetPopover>
      )}
      {powerAction && (
        <LayoutConfirm
          title={`${powerAction}?`}
          confirmLabel={powerAction}
          destructive
          onCancel={() => setPowerAction(null)}
          onConfirm={() => setPowerAction(null)}
        >
          {powerActions[powerAction]}
        </LayoutConfirm>
      )}
    </header>
  )
}
