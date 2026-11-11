import type { Notification } from '../types/notifications'

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notes-updated',
    target: 'notes',
    title: 'Document updated',
    body: 'Workspace notes · Local copy saved.',
    time: '2 min ago',
    unread: true,
  },
  {
    id: 'files-download',
    target: 'files',
    title: 'Download complete',
    body: 'reference-board.png is ready in Downloads.',
    time: '8 min ago',
    unread: true,
  },
  {
    id: 'browser-reading',
    target: 'browser',
    title: 'Bookmark saved',
    body: 'Spatial interfaces was added to Bookmarks.',
    time: '12 min ago',
    unread: true,
  },
]
