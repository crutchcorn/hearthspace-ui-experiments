import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { SettingsDialogContext } from '../constants/settings-dialog-context'
import styles from './settings-dialog-boundary.module.css'
import settingsStyles from './settings.module.css'

export default function SettingsDialogBoundary({
  children,
}: {
  children: ReactNode
}) {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  const [dialogCount, setDialogCount] = useState(0)
  const content = useRef<HTMLDivElement>(null)
  const dialogs = useRef(new Set<HTMLDialogElement>())
  const returnFocus = useRef<{
    element: HTMLElement | null
    deviceId: string | null
  } | null>(null)
  const shouldRestoreFocus = useRef(false)
  const registerDialog = useCallback((dialog: HTMLDialogElement) => {
    if (!returnFocus.current) {
      const element =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      const deviceAction = element?.matches('[data-device-action]')
        ? element
        : element?.parentElement?.querySelector('[data-device-action]')
      returnFocus.current = {
        element,
        deviceId: deviceAction?.getAttribute('data-device-action') ?? null,
      }
    }
    dialogs.current.add(dialog)
    setDialogCount(dialogs.current.size)
    return () => {
      shouldRestoreFocus.current = dialog.contains(document.activeElement)
      dialogs.current.delete(dialog)
      setDialogCount(dialogs.current.size)
    }
  }, [])
  const scope = useMemo(
    () => ({ host, registerDialog }),
    [host, registerDialog],
  )

  useLayoutEffect(() => {
    if (dialogCount || dialogs.current.size || !returnFocus.current) return
    const { element, deviceId } = returnFocus.current
    returnFocus.current = null
    if (!shouldRestoreFocus.current) return
    const replacement = deviceId
      ? content.current?.querySelector<HTMLElement>(
          `[data-device-action="${CSS.escape(deviceId)}"]`,
        )
      : null
    const target = element?.isConnected ? element : replacement
    if (target && !target.closest('[inert]'))
      target.focus({ preventScroll: true })
  }, [dialogCount])

  return (
    <SettingsDialogContext value={scope}>
      <section
        className={`${settingsStyles.settings} ${styles.boundary}`}
        aria-label="Settings"
      >
        <div ref={content} className={styles.content} inert={dialogCount > 0}>
          {children}
        </div>
        <div ref={setHost} className={styles.host} />
      </section>
    </SettingsDialogContext>
  )
}
