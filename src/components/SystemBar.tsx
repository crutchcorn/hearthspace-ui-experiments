import { useEffect, useState } from 'react'
import {
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
  showBatteryPercentage: boolean
}

export default function SystemBar({
  openPanel,
  onPanelChange,
  showBatteryPercentage,
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
      data-battery-percentage={showBatteryPercentage}
    >
      <button
        type="button"
        className={`${styles.clockButton} ${openPanel === 'clock' ? styles.active : ''}`}
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
        {now.toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          hourCycle: 'h23',
        })}
      </button>

      <div className={styles.statusGroup}>
        <button
          type="button"
          className={`${styles.statusButton} ${openPanel === 'wifi' ? styles.active : ''}`}
          title={wifiEnabled ? 'Wi-Fi · Studio network' : 'Wi-Fi · Off'}
          aria-label="Wi-Fi settings"
          aria-expanded={openPanel === 'wifi'}
          onClick={() => togglePanel('wifi')}
        >
          {wifiEnabled ? <Wifi size={17} /> : <WifiOff size={17} />}
        </button>
        <button
          type="button"
          className={`${styles.statusButton} ${openPanel === 'volume' ? styles.active : ''}`}
          title={volume > 0 ? `Sound · ${volume}%` : 'Sound · Muted'}
          aria-label="Sound settings"
          aria-expanded={openPanel === 'volume'}
          onClick={() => togglePanel('volume')}
        >
          {volume > 0 ? <Volume2 size={17} /> : <VolumeX size={17} />}
        </button>
        <button
          type="button"
          className={`${styles.statusButton} ${showBatteryPercentage ? styles.batteryWithPercentage : ''} ${openPanel === 'battery' ? styles.active : ''}`}
          title="Battery · 87%"
          aria-label="Battery status, 87%"
          aria-expanded={openPanel === 'battery'}
          onClick={() => togglePanel('battery')}
        >
          <BatteryFull size={19} aria-hidden="true" />
          {showBatteryPercentage && (
            <span className={styles.batteryPercentage} aria-hidden="true">
              87%
            </span>
          )}
        </button>
      </div>

      {openPanel === 'wifi' && (
        <div className={`${styles.popover} ${styles.systemPopover}`}>
          <label className={styles.toggleRow}>
            <strong>Wi-Fi</strong>
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
            <label htmlFor="system-volume">Sound</label>
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
            <strong>Battery</strong>
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
          <p className={styles.calendarFooter}>Local date and time</p>
        </div>
      )}
    </header>
  )
}
