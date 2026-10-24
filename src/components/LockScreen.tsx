import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  BatteryFull,
  Bluetooth,
  BluetoothOff,
  ChevronRight,
  Eye,
  Lock,
  User,
  Wifi,
  WifiOff,
} from '../icons'
import type { BackgroundPhoto } from '../useBackground'
import type { SystemStatus } from '../useSystemStatus'
import { CANVAS_GRID_SIZE } from '../desktop'
import styles from './LockScreen.module.css'

interface LockScreenProps {
  status: SystemStatus
  photo: BackgroundPhoto | null
  onUnlock: () => void
}

export default function LockScreen({
  status,
  photo,
  onUnlock,
}: LockScreenProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const passwordField = useRef<HTMLInputElement>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [capsLock, setCapsLock] = useState(false)

  useEffect(() => {
    const element = dialog.current!
    element.showModal()
    passwordField.current?.focus({ preventScroll: true })
    return () => element.close()
  }, [])

  function unlock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password === 'hearthspace') {
      setPassword('')
      dialog.current?.close()
      onUnlock()
    } else {
      setError(true)
      passwordField.current?.focus()
      passwordField.current?.select()
    }
  }

  return (
    <dialog
      ref={dialog}
      className={styles.screen}
      aria-label="Lock screen"
      onCancel={(event) => event.preventDefault()}
      onKeyDown={(event) => setCapsLock(event.getModifierState('CapsLock'))}
      onKeyUp={(event) => setCapsLock(event.getModifierState('CapsLock'))}
    >
      <div
        className={styles.wallpaper}
        data-photo={Boolean(photo)}
        aria-hidden="true"
        style={
          photo
            ? {
                backgroundImage: `url("${photo.url}")`,
                backgroundSize:
                  photo.fit === 'stretch'
                    ? '100% 100%'
                    : photo.fit === 'repeat'
                      ? 'auto'
                      : photo.fit,
                backgroundRepeat:
                  photo.fit === 'repeat' ? 'repeat' : 'no-repeat',
              }
            : { backgroundSize: `${CANVAS_GRID_SIZE}px ${CANVAS_GRID_SIZE}px` }
        }
      />
      <div className={styles.content}>
        <header className={styles.header}>
          <Lock className={styles.lockIcon} size={17} />
          <div className={styles.status} aria-label="System status">
            <span title={status.wifiLabel}>
              {status.wifiNetwork ? <Wifi size={18} /> : <WifiOff size={18} />}
            </span>
            <span title={`Bluetooth · ${status.bluetoothLabel}`}>
              {status.bluetoothEnabled ? (
                <Bluetooth size={18} />
              ) : (
                <BluetoothOff size={18} />
              )}
            </span>
            <span className={styles.battery}>
              <BatteryFull size={20} />
              {status.batteryPercentage}%
            </span>
          </div>
        </header>

        <div className={styles.center}>
          <div className={styles.clock}>
            <time className={styles.time} dateTime={status.now.toISOString()}>
              {status.now.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
                hour12: false,
              })}
            </time>
            <span className={styles.date}>
              {status.now.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>

          <form className={styles.signIn} onSubmit={unlock}>
            <div className={styles.avatar}>
              <User size={30} />
            </div>
            <h1>Guest</h1>
            <p className={styles.welcome}>Welcome back.</p>
            <div className={styles.passwordRow} data-invalid={error}>
              <input
                ref={passwordField}
                type="password"
                aria-label="Password"
                aria-describedby="lockscreen-feedback"
                aria-invalid={error}
                placeholder="Password"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value)
                  setError(false)
                }}
                onBlur={() => setCapsLock(false)}
              />
              <button
                className={styles.fillPassword}
                type="button"
                aria-label="Fill password"
                title="Fill password"
                onClick={() => {
                  setPassword('hearthspace')
                  setError(false)
                  passwordField.current?.focus()
                }}
              >
                <Eye size={18} />
              </button>
              <button
                className={styles.unlock}
                type="submit"
                aria-label="Unlock"
                title="Unlock"
                disabled={!password}
              >
                <ChevronRight size={20} />
              </button>
            </div>
            <p
              id="lockscreen-feedback"
              className={styles.feedback}
              role="status"
            >
              {error
                ? 'That password didn’t match. Try again.'
                : capsLock
                  ? 'Caps Lock is on.'
                  : '\u00a0'}
            </p>
          </form>
        </div>
      </div>
    </dialog>
  )
}
