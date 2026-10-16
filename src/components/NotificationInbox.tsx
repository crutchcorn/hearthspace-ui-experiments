import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Bell,
  BellRing,
  CheckCheck,
  Folder,
  Globe,
  Plus,
  StickyNote,
  X,
} from 'lucide-react'
import styles from './NotificationInbox.module.css'

export type NotificationTarget = 'notes' | 'files' | 'browser'

interface NotificationInboxProps {
  open: boolean
  previewVisible: boolean
  onToggle: () => void
  onClose: () => void
  onNavigate: (target: NotificationTarget) => void
}

interface Notification {
  id: string
  target: NotificationTarget
  title: string
  body: string
  time: string
  unread: boolean
}

const APPS = {
  notes: { name: 'Notes', Icon: StickyNote },
  files: { name: 'Files', Icon: Folder },
  browser: { name: 'Browser', Icon: Globe },
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notes-thought',
    target: 'notes',
    title: 'A thought worth returning to',
    body: 'Your scratchpad is right where you left it.',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 'files-download',
    target: 'files',
    title: 'Download complete',
    body: 'hearthspace-wallpaper.png is ready in Downloads.',
    time: '8 min ago',
    unread: true,
  },
  {
    id: 'browser-reading',
    target: 'browser',
    title: 'Saved for a quieter moment',
    body: 'A page in your reading list is waiting for you.',
    time: '12 min ago',
    unread: true,
  },
]

export default function NotificationInbox({
  open,
  previewVisible,
  onToggle,
  onClose,
  onNavigate,
}: NotificationInboxProps) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const [toast, setToast] = useState<Notification | null>(null)
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const previewCount = useRef(0)
  const unreadCount = notifications.filter((item) => item.unread).length

  useEffect(() => {
    if (open) trigger.current?.focus({ preventScroll: true })
  }, [open])

  useEffect(() => {
    if (!open && !toast) return

    function dismissOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !root.current?.contains(event.target)
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
      id: `preview-${index}`,
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
      <button
        ref={trigger}
        type="button"
        className={styles.trigger}
        title="Notifications (N)"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={open}
        aria-controls="notification-inbox"
        onClick={() => {
          setToast(null)
          onToggle()
        }}
      >
        <Bell size={17} strokeWidth={1.7} />
        <span className={styles.triggerLabel}>Notifications</span>
        <span className={styles.badge} data-unread={unreadCount > 0}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      </button>

      {open && (
        <section
          id="notification-inbox"
          className={styles.panel}
          aria-labelledby="notification-heading"
        >
          <header className={styles.heading}>
            <div>
              <h2 id="notification-heading">Notifications</h2>
              <span>
                {unreadCount ? `${unreadCount} unread` : 'You’re all caught up'}
              </span>
            </div>
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
                const { name, Icon } = APPS[item.target]
                return (
                  <article
                    key={item.id}
                    className={styles.notification}
                    data-unread={item.unread}
                  >
                    <div className={styles.itemIcon}>
                      <Icon size={17} strokeWidth={1.6} />
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
                        {item.target === 'notes'
                          ? 'Return to Notes'
                          : `Open ${name}`}
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
                <h3>All clear.</h3>
                <p>A little quiet for your corner of the world.</p>
              </div>
            )}
          </div>

          <footer className={styles.footer}>
            <span>Simulated notifications</span>
            <button
              type="button"
              className={styles.previewButton}
              onClick={previewNotification}
            >
              <Plus size={14} /> Preview notification
            </button>
          </footer>
        </section>
      )}

      {toast && !open && previewVisible && (
        <aside className={styles.toast} role="status" aria-live="polite">
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
            <span>{APPS[toast.target].name} · Simulated</span>
            <button
              type="button"
              className={styles.toastOpen}
              onClick={() => openNotification(toast)}
            >
              Open {APPS[toast.target].name} <ArrowUpRight size={14} />
            </button>
          </div>
        </aside>
      )}
    </div>
  )
}
