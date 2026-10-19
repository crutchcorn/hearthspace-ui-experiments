import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  BellRing,
  CheckCheck,
  Folder,
  Globe,
  Plus,
  Settings2,
  StickyNote,
  X,
  type LucideIcon,
} from 'lucide-react'
import {
  INITIAL_NOTIFICATIONS,
  type Notification,
  type NotificationsState,
  type NotificationTarget,
} from '../useNotifications'
import AppIcon from './AppIcon'
import WidgetPopover from './WidgetPopover'
import popoverStyles from './WidgetPopover.module.css'
import shellStyles from './ShellControls.module.css'
import styles from './NotificationInbox.module.css'

export type { NotificationTarget } from '../useNotifications'

interface NotificationInboxProps {
  state: NotificationsState
  expanded?: boolean
  open: boolean
  previewVisible: boolean
  onToggle: () => void
  onClose: () => void
  onNavigate: (target: NotificationTarget) => void
}

const APPS: Record<
  NotificationTarget,
  { name: string; Icon: LucideIcon; action?: string }
> = {
  notes: { name: 'Notes', Icon: StickyNote },
  files: { name: 'Files', Icon: Folder },
  browser: { name: 'Browser', Icon: Globe },
  gestures: {
    name: 'Gesture settings',
    Icon: Settings2,
    action: 'Customize gestures',
  },
}

export default function NotificationInbox({
  state,
  expanded = true,
  open,
  previewVisible,
  onToggle,
  onClose,
  onNavigate,
}: NotificationInboxProps) {
  const { notifications, setNotifications, unreadCount } = state
  const [toast, setToast] = useState<Notification | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLElement>(null)
  const toastElement = useRef<HTMLElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const previewCount = useRef(0)

  useEffect(() => {
    if (open) trigger.current?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (!open && !toast) return

    function dismissOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target) &&
        !panel.current?.contains(event.target) &&
        !toastElement.current?.contains(event.target)
      ) {
        if (open) onClose()
        setToast(null)
      }
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      if (open) {
        onClose()
        trigger.current?.focus()
      }
      setToast(null)
    }

    document.addEventListener('pointerdown', dismissOutside, true)
    document.addEventListener('keydown', dismissOnEscape)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside, true)
      document.removeEventListener('keydown', dismissOnEscape)
    }
  }, [open, toast, onClose])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 6000)
    return () => window.clearTimeout(timer)
  }, [toast])

  function openNotification(item: Notification) {
    setNotifications((current) =>
      current.map((entry) =>
        entry.id === item.id ? { ...entry, unread: false } : entry,
      ),
    )
    setToast(null)
    onClose()
    onNavigate(item.target)
  }

  function dismissNotification(id: string) {
    setNotifications((current) => current.filter((item) => item.id !== id))
    if (toast?.id === id) setToast(null)
  }

  function previewNotification() {
    const index = previewCount.current++
    const item: Notification = {
      ...INITIAL_NOTIFICATIONS[index % INITIAL_NOTIFICATIONS.length],
      id: `preview-${crypto.randomUUID()}`,
      time: 'Just now',
      unread: true,
    }
    setNotifications((current) => [item, ...current])
    setToast(item)
    onClose()
    trigger.current?.focus({ preventScroll: true })
  }

  return (
    <div
      ref={root}
      className={styles.corner}
      data-notifications-root
      onPointerDown={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className={`${shellStyles.surface} ${styles.bar}`}>
        <button
          ref={trigger}
          type="button"
          className={`${shellStyles.control} ${styles.trigger}`}
          title={`Notifications (N) · ${unreadCount ? `${unreadCount} new` : 'All clear'}`}
          aria-label={`Notifications, ${unreadCount ? `${unreadCount} new` : 'all clear'}`}
          aria-expanded={open}
          aria-controls="notification-inbox"
          data-unread={unreadCount > 0}
          data-display-expanded={expanded}
          onClick={() => {
            setToast(null)
            onToggle()
          }}
        >
          {unreadCount ? (
            <BellRing size={18} aria-hidden="true" />
          ) : (
            <Bell size={18} aria-hidden="true" />
          )}
          {expanded ? (
            <span className={styles.triggerText} aria-hidden="true">
              {unreadCount ? `${unreadCount} new` : 'All clear'}
            </span>
          ) : unreadCount ? (
            <span className={styles.triggerDot} aria-hidden="true" />
          ) : null}
        </button>
      </div>

      {open && (
        <WidgetPopover>
          <section
            ref={panel}
            id="notification-inbox"
            className={`${popoverStyles.panel} ${styles.panel}`}
            aria-labelledby="notification-heading"
          >
            <header className={styles.heading}>
              <h2 id="notification-heading">Notifications</h2>
              <button
                type="button"
                className={styles.markRead}
                disabled={unreadCount === 0}
                onClick={() =>
                  setNotifications((current) =>
                    current.map((item) => ({ ...item, unread: false })),
                  )
                }
              >
                <CheckCheck size={15} /> Mark all read
              </button>
            </header>

            <div className={styles.list}>
              {notifications.length ? (
                notifications.map((item) => {
                  const { name, Icon, action } = APPS[item.target]
                  return (
                    <article
                      key={item.id}
                      className={styles.notification}
                      data-unread={item.unread}
                    >
                      <div className={styles.itemIcon}>
                        <AppIcon
                          appId={item.target}
                          icon={Icon}
                          size={17}
                          strokeWidth={1.6}
                        />
                      </div>
                      <div className={styles.itemContent}>
                        <div className={styles.itemMeta}>
                          <span>{name}</span>
                          <span>{item.time}</span>
                          {item.unread && (
                            <span
                              className={styles.unreadDot}
                              aria-label="Unread"
                            />
                          )}
                        </div>
                        <h3>{item.title}</h3>
                        <p>{item.body}</p>
                        <button
                          type="button"
                          className={styles.openButton}
                          onClick={() => openNotification(item)}
                        >
                          {action ?? `Open ${name}`}
                          <ArrowUpRight size={13} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className={styles.dismissButton}
                        aria-label={`Dismiss ${item.title}`}
                        onClick={() => dismissNotification(item.id)}
                      >
                        <X size={13} />
                      </button>
                    </article>
                  )
                })
              ) : (
                <div className={styles.empty}>
                  <span>
                    <Bell size={23} strokeWidth={1.3} />
                  </span>
                  <h3>No notifications</h3>
                  <p>New activity will appear here.</p>
                </div>
              )}
            </div>

            {/* Prototype-only control; remove this footer for the OS shell. */}
            <footer className={styles.previewTools}>
              <button
                type="button"
                className={styles.previewButton}
                onClick={previewNotification}
              >
                <Plus size={14} /> Preview notification
              </button>
            </footer>
          </section>
        </WidgetPopover>
      )}

      {toast && !open && previewVisible && (
        <WidgetPopover>
          <aside
            ref={toastElement}
            className={`${popoverStyles.panel} ${styles.toast}`}
            role="status"
            aria-live="polite"
          >
            <div className={styles.toastTop}>
              <span>
                <BellRing size={13} /> Notification preview
              </span>
              <button
                type="button"
                className={styles.toastDismiss}
                aria-label="Dismiss notification preview"
                onClick={() => setToast(null)}
              >
                <X size={14} />
              </button>
            </div>
            <h3>{toast.title}</h3>
            <p>{toast.body}</p>
            <div className={styles.toastFooter}>
              <span>
                <AppIcon
                  appId={toast.target}
                  icon={APPS[toast.target].Icon}
                  size={16}
                />
                {APPS[toast.target].name} · Simulated
              </span>
              <button
                type="button"
                className={styles.toastOpen}
                onClick={() => openNotification(toast)}
              >
                {APPS[toast.target].action ?? `Open ${APPS[toast.target].name}`}{' '}
                <ArrowUpRight size={14} />
              </button>
            </div>
          </aside>
        </WidgetPopover>
      )}
    </div>
  )
}
