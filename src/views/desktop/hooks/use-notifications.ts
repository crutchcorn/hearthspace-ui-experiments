import { useState } from 'react'
import { INITIAL_NOTIFICATIONS } from '../constants/notifications'
import type { Notification, NotificationsState } from '../types/notifications'

export function useNotifications(): NotificationsState {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const unreadCount = notifications.filter((item) => item.unread).length

  return {
    notifications,
    unreadCount,
    markRead(id) {
      setNotifications((current) =>
        current.map((entry) =>
          entry.id === id ? { ...entry, unread: false } : entry,
        ),
      )
    },
    markAllRead() {
      setNotifications((current) =>
        current.map((entry) => ({ ...entry, unread: false })),
      )
    },
    previewNotification(index) {
      const item: Notification = {
        ...INITIAL_NOTIFICATIONS[index % INITIAL_NOTIFICATIONS.length],
        id: `preview-${crypto.randomUUID()}`,
        time: 'Just now',
        unread: true,
      }
      setNotifications((current) => [item, ...current])
      return item
    },
    dismiss(id) {
      setNotifications((current) => current.filter((entry) => entry.id !== id))
    },
  }
}
