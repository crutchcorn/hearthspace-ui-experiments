export interface LauncherApp {
  id: string
  name: string
  description: string
}

export const APP_CATALOG: LauncherApp[] = [
  {
    id: 'browser',
    name: 'Browser',
    description: 'Web pages and bookmarks',
  },
  {
    id: 'files',
    name: 'Files',
    description: 'Folders and documents',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Commands and workspaces',
  },
  {
    id: 'notes',
    name: 'Notes',
    description: 'Quick notes and ideas',
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Albums and playlists',
  },
  {
    id: 'photos',
    name: 'Photos',
    description: 'Images and collections',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Events and schedules',
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Preferences and system',
  },
]
