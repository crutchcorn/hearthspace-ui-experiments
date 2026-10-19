import { useEffect, useRef } from 'react'
import {
  BatteryFull,
  Check,
  Clock,
  Volume,
  VolumeMuted,
  Wifi,
  WifiOff,
} from '../icons'
import type { SystemStatus } from '../useSystemStatus'
import { formatClock, type ClockDateFormat } from '../clock-format'
import WidgetPopover from './WidgetPopover'
import popoverStyles from './WidgetPopover.module.css'
import styles from './SystemBar.module.css'
import shellStyles from './ShellControls.module.css'
import settingsStyles from './Settings.module.css'

export type SystemPanel = 'wifi' | 'volume' | 'battery' | 'clock' | null

interface SystemBarProps {
  status: SystemStatus
  openPanel: SystemPanel
  onPanelChange: (panel: SystemPanel) => void
  id: Exclude<SystemPanel, null>
  expanded: boolean
  clockDateFormat: ClockDateFormat
}

export default function SystemBar({
  status,
  openPanel,
  onPanelChange,
  id,
  expanded,
  clockDateFormat,
}: SystemBarProps) {
  const root = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const {
    wifiEnabled,
    setWifiEnabled,
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
      if (
        event.target instanceof Element &&
        !root.current?.contains(event.target) &&
        !panelRef.current?.contains(event.target)
      ) {
        onPanelChange(null)
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') onPanelChange(null)
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
          title={wifiEnabled ? 'Wi-Fi · Studio network' : 'Wi-Fi · Off'}
          aria-label="Wi-Fi settings"
          aria-expanded={openPanel === 'wifi'}
          onClick={() => togglePanel('wifi')}
        >
          {wifiEnabled ? <Wifi size={17} /> : <WifiOff size={17} />}
          {expanded && (
            <span className={styles.detail} aria-hidden="true">
              {wifiEnabled ? 'Studio network' : 'Wi-Fi off'}
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

      {openPanel === id && (
        <WidgetPopover>
          {id === 'wifi' && openPanel === id && (
            <div
              className={`${popoverStyles.panel} ${styles.popover} ${styles.systemPopover}`}
              ref={panelRef}
              data-system-panel
              tabIndex={-1}
            >
              <label className={styles.toggleRow}>
                <strong>Wi-Fi</strong>
                <input
                  className={`${settingsStyles.toggle} ${styles.toggle}`}
                  type="checkbox"
                  checked={wifiEnabled}
                  onChange={(event) => setWifiEnabled(event.target.checked)}
                />
              </label>
              <div className={styles.networkRow}>
                <div>
                  <strong>
                    {wifiEnabled ? 'Studio network' : 'Disconnected'}
                  </strong>
                  <span>
                    {wifiEnabled
                      ? 'Connected · Private network'
                      : 'Enable Wi-Fi to connect'}
                  </span>
                </div>
                {wifiEnabled && (
                  <Check size={18} className={styles.networkCheck} />
                )}
              </div>
            </div>
          )}

          {id === 'volume' && openPanel === id && (
            <div
              className={`${popoverStyles.panel} ${styles.popover} ${styles.systemPopover}`}
              ref={panelRef}
              data-system-panel
              tabIndex={-1}
            >
              <div className={styles.settingHeading}>
                <label htmlFor="system-volume">Sound</label>
                <span>
                  {volume}
                  <small>%</small>
                </span>
              </div>
              <div className={styles.volumeRow}>
                <VolumeMuted size={16} />
                <input
                  id="system-volume"
                  className={styles.volumeSlider}
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(event) => setVolume(Number(event.target.value))}
                />
                <Volume size={17} />
              </div>
            </div>
          )}

          {id === 'battery' && openPanel === id && (
            <div
              className={`${popoverStyles.panel} ${styles.popover} ${styles.systemPopover}`}
              ref={panelRef}
              data-system-panel
              tabIndex={-1}
            >
              <div className={styles.settingHeading}>
                <strong>Battery</strong>
                <span>
                  {batteryPercentage}
                  <small>%</small>
                </span>
              </div>
              <div className={styles.batteryMeter}>
                <span />
              </div>
              <p className={styles.batteryDescription}>On battery power</p>
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
    </header>
  )
}
