import { useEffect, useState } from 'react'
import {
  ArrowDownRight,
  BatteryFull,
  Check,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react'
import styles from './SystemBar.module.css'

export type SystemPanel = 'wifi' | 'volume' | 'battery' | 'clock' | null

interface SystemBarProps {
  openPanel: SystemPanel
  onPanelChange: (panel: SystemPanel) => void
}

export default function SystemBar({
  openPanel,
  onPanelChange,
}: SystemBarProps) {
  const [wifiEnabled, setWifiEnabled] = useState(true)
  const [volume, setVolume] = useState(64)
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!openPanel) return

    function dismissOnPointer(event: PointerEvent) {
      if (
        event.target instanceof Element &&
        !event.target.closest('[data-system-popover-root]')
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
  }, [openPanel, onPanelChange])

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
      className={styles.bar}
      aria-label="Device status"
      data-system-popover-root
    >
      <button
        type="button"
        className={`${styles.clockButton} ${openPanel === 'clock' ? styles.active : ''}`}
        onClick={() => togglePanel('clock')}
        aria-label="Date and time"
        aria-expanded={openPanel === 'clock'}
      >
        <span className={styles.clockReadout}>
          {now.toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23',
          })}
        </span>
        <span className={styles.clockMeta}>
          <span className={styles.date}>
            {now.toLocaleDateString(undefined, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </span>
          <span className={styles.clockLabel}>
            Local time <ArrowDownRight size={14} aria-hidden="true" />
          </span>
        </span>
      </button>

      <div className={styles.statusGroup}>
        <button
          type="button"
          className={`${styles.statusButton} ${openPanel === 'wifi' ? styles.active : ''}`}
          title="Wi-Fi"
          aria-label="Wi-Fi settings"
          aria-expanded={openPanel === 'wifi'}
          onClick={() => togglePanel('wifi')}
        >
          {wifiEnabled ? <Wifi size={16} /> : <WifiOff size={16} />}
          <span>
            <span className={styles.statusLabel}>Network</span>
            <span className={styles.statusValue}>
              {wifiEnabled ? 'Online' : 'Offline'}
            </span>
          </span>
        </button>
        <button
          type="button"
          className={`${styles.statusButton} ${openPanel === 'volume' ? styles.active : ''}`}
          title="Sound"
          aria-label="Sound settings"
          aria-expanded={openPanel === 'volume'}
          onClick={() => togglePanel('volume')}
        >
          {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
          <span>
            <span className={styles.statusLabel}>Sound</span>
            <span className={styles.statusValue}>{volume}%</span>
          </span>
        </button>
        <button
          type="button"
          className={`${styles.statusButton} ${openPanel === 'battery' ? styles.active : ''}`}
          title="Battery"
          aria-label="Battery status"
          aria-expanded={openPanel === 'battery'}
          onClick={() => togglePanel('battery')}
        >
          <BatteryFull size={19} />
          <span>
            <span className={styles.statusLabel}>Power</span>
            <span className={styles.statusValue}>87%</span>
          </span>
        </button>
      </div>

      {openPanel === 'wifi' && (
        <div className={`${styles.popover} ${styles.systemPopover}`}>
          <label className={styles.toggleRow}>
            <strong>Network / Wi-Fi</strong>
            <input
              className={styles.toggle}
              type="checkbox"
              checked={wifiEnabled}
              onChange={(event) => setWifiEnabled(event.target.checked)}
            />
          </label>
          <div className={styles.networkRow}>
            <div>
              <strong>{wifiEnabled ? 'Studio network' : 'Disconnected'}</strong>
              <span>
                {wifiEnabled
                  ? 'Connected · Private network'
                  : 'Enable Wi-Fi to connect'}
              </span>
            </div>
            {wifiEnabled && <Check size={18} className={styles.networkCheck} />}
          </div>
          <p className={styles.previewNote}>Simulated connection</p>
        </div>
      )}

      {openPanel === 'volume' && (
        <div className={`${styles.popover} ${styles.systemPopover}`}>
          <div className={styles.settingHeading}>
            <label htmlFor="system-volume">Sound / Output</label>
            <span>
              {volume}
              <small>%</small>
            </span>
          </div>
          <div className={styles.volumeRow}>
            <VolumeX size={16} />
            <input
              id="system-volume"
              className={styles.volumeSlider}
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
            />
            <Volume2 size={17} />
          </div>
          <p className={styles.previewNote}>Built-in speakers · Simulated</p>
        </div>
      )}

      {openPanel === 'battery' && (
        <div className={`${styles.popover} ${styles.systemPopover}`}>
          <div className={styles.settingHeading}>
            <strong>Power / Battery</strong>
            <span>
              87<small>%</small>
            </span>
          </div>
          <div className={styles.batteryMeter}>
            <span />
          </div>
          <p className={styles.batteryDescription}>On battery power</p>
          <p className={styles.previewNote}>Simulated battery status</p>
        </div>
      )}

      {openPanel === 'clock' && (
        <div className={`${styles.popover} ${styles.calendarPopover}`}>
          <div className={styles.calendarHeading}>
            <span className={styles.calendarDay}>
              {String(now.getDate()).padStart(2, '0')}
            </span>
            <div>
              <span>
                {now.toLocaleDateString(undefined, { weekday: 'long' })}
              </span>
              <strong>
                {now.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </strong>
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
          <p className={styles.calendarFooter}>Local date and time</p>
        </div>
      )}
    </header>
  )
}
