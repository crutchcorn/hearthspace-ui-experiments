export type NotificationTarget = 'notes' | 'files' | 'browser' | 'gestures'

export interface Notification {
  id: string
  target: NotificationTarget
  title: string
  body: string
  time: string
  unread: boolean
}

export interface NotificationsState {
  notifications: Notification[]
  unreadCount: number
  markRead: (id: string) => void
  markAllRead: () => void
  dismiss: (id: string) => void
  previewNotification: (index: number) => Notification
}
