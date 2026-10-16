import { useEffect, useState } from 'react'
import {
  ArrowUpRight,
  BatteryFull,
  Check,
  ChevronDown,
  Plus,
  RotateCcw,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react'
import styles from './SystemBar.module.css'

interface SystemBarProps {
  onReset: () => void
  onHome: () => void
  onNewWindow: () => void
  windowCount: number
}

type OpenPanel = 'workspace' | 'wifi' | 'volume' | 'battery' | 'clock' | null

export default function SystemBar({
  onReset,
  onHome,
  onNewWindow,
  windowCount,
}: SystemBarProps) {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
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
        setOpenPanel(null)
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpenPanel(null)
    }

    document.addEventListener('pointerdown', dismissOnPointer, true)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOnPointer, true)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [openPanel])

  function togglePanel(panel: Exclude<OpenPanel, null>) {
    setOpenPanel((current) => (current === panel ? null : panel))
  }

  function runAction(action: () => void) {
    setOpenPanel(null)
    action()
  }

  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getDay()
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
  ).getDate()

  return (
    <header className={styles.bar}>
      <div className={styles.leftGroup}>
        <div className={styles.anchor} data-system-popover-root>
          <button
            type="button"
            className={`${styles.workspaceButton} ${openPanel === 'workspace' ? styles.active : ''}`}
            onClick={() => togglePanel('workspace')}
            aria-label="Personal space menu"
            aria-expanded={openPanel === 'workspace'}
          >
            <span>Personal space</span>
            <ChevronDown size={12} />
          </button>
          {openPanel === 'workspace' && (
            <div className={`${styles.popover} ${styles.workspacePopover}`}>
              <div className={styles.panelHeading}>
                <strong>Personal space</strong>
                <span>{windowCount} open windows</span>
              </div>
              <div className={styles.menuItems}>
                <button type="button" onClick={() => runAction(onNewWindow)}>
                  <Plus size={16} />
                  <span>Add a window</span>
                  <ArrowUpRight size={12} className={styles.menuEndIcon} />
                </button>
                <button
                  type="button"
                  className={styles.textOnlyAction}
                  onClick={() => runAction(onHome)}
                >
                  <span>Return home</span>
                </button>
                <button type="button" onClick={() => runAction(onReset)}>
                  <RotateCcw size={15} />
                  <span>Reset layout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={styles.rightGroup}>
        <div className={styles.anchor} data-system-popover-root>
          <button
            type="button"
            className={`${styles.iconButton} ${openPanel === 'wifi' ? styles.active : ''}`}
            title="Wi-Fi"
            aria-label="Wi-Fi settings"
            aria-expanded={openPanel === 'wifi'}
            onClick={() => togglePanel('wifi')}
          >
            {wifiEnabled ? <Wifi size={16} /> : <WifiOff size={16} />}
          </button>
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
                {wifiEnabled ? <Wifi size={18} /> : <WifiOff size={18} />}
                <div>
                  <strong>
                    {wifiEnabled ? 'Hearth & home' : 'Wi-Fi is off'}
                  </strong>
                  <span>
                    {wifiEnabled
                      ? 'Connected · Private network'
                      : 'Your space is still here.'}
                  </span>
                </div>
                {wifiEnabled && (
                  <Check size={14} className={styles.networkCheck} />
                )}
              </div>
              <p className={styles.previewNote}>Preview connection</p>
            </div>
          )}
        </div>

        <div className={styles.anchor} data-system-popover-root>
          <button
            type="button"
            className={`${styles.iconButton} ${openPanel === 'volume' ? styles.active : ''}`}
            title="Sound"
            aria-label="Sound settings"
            aria-expanded={openPanel === 'volume'}
            onClick={() => togglePanel('volume')}
          >
            {volume > 0 ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          {openPanel === 'volume' && (
            <div className={`${styles.popover} ${styles.systemPopover}`}>
              <div className={styles.settingHeading}>
                <label htmlFor="system-volume">Sound</label>
                <span>{volume}%</span>
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
              <p className={styles.previewNote}>Built-in speakers · Preview</p>
            </div>
          )}
        </div>

        <div className={styles.anchor} data-system-popover-root>
          <button
            type="button"
            className={`${styles.iconButton} ${openPanel === 'battery' ? styles.active : ''}`}
            title="Battery"
            aria-label="Battery status"
            aria-expanded={openPanel === 'battery'}
            onClick={() => togglePanel('battery')}
          >
            <BatteryFull size={19} />
          </button>
          {openPanel === 'battery' && (
            <div className={`${styles.popover} ${styles.systemPopover}`}>
              <div className={styles.settingHeading}>
                <strong>Battery</strong>
                <span>87%</span>
              </div>
              <div className={styles.batteryMeter}>
                <span />
              </div>
              <p className={styles.batteryDescription}>
                A little room to roam.
              </p>
              <p className={styles.previewNote}>Simulated battery status</p>
            </div>
          )}
        </div>

        <span className={styles.divider} />

        <div className={styles.anchor} data-system-popover-root>
          <button
            type="button"
            className={`${styles.clockButton} ${openPanel === 'clock' ? styles.active : ''}`}
            onClick={() => togglePanel('clock')}
            aria-label="Date and time"
            aria-expanded={openPanel === 'clock'}
          >
            <span className={styles.date}>
              {now.toLocaleDateString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </span>
            <span>
              {now.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
            <ChevronDown size={11} />
          </button>
          {openPanel === 'clock' && (
            <div className={`${styles.popover} ${styles.calendarPopover}`}>
              <div className={styles.calendarHeading}>
                <strong>
                  {now.toLocaleDateString(undefined, {
                    month: 'long',
                    year: 'numeric',
                  })}
                </strong>
                <span>
                  {now.toLocaleDateString(undefined, { weekday: 'long' })}
                </span>
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
              <p className={styles.calendarFooter}>
                Make a little space for today.
              </p>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
