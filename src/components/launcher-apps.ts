import {
  Calendar,
  Folder,
  Compass,
  Photo,
  Music,
  AppSettings,
  Terminal,
  Note,
  type IconComponent,
} from '../icons'

export interface LauncherApp {
  id: string
  name: string
  description: string
  icon: IconComponent
}

export const APP_CATALOG: LauncherApp[] = [
  {
    id: 'browser',
    name: 'Browser',
    description: 'Web pages and bookmarks',
    icon: Compass,
  },
  {
    id: 'files',
    name: 'Files',
    description: 'Folders and documents',
    icon: Folder,
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Commands and workspaces',
    icon: Terminal,
  },
  {
    id: 'notes',
    name: 'Notes',
    description: 'Quick notes and ideas',
    icon: Note,
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Albums and playlists',
    icon: Music,
  },
  {
    id: 'photos',
    name: 'Photos',
    description: 'Images and collections',
    icon: Photo,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Events and schedules',
    icon: Calendar,
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Preferences and system',
    icon: AppSettings,
  },
]
