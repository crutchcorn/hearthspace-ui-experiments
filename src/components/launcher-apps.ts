import {
  CalendarDays,
  Folder,
  Globe,
  Image as ImageIcon,
  Music2,
  Settings2,
  SquareTerminal,
  StickyNote,
  type LucideIcon,
} from 'lucide-react'

export interface LauncherApp {
  id: string
  name: string
  description: string
  icon: LucideIcon
}

export const APP_CATALOG: LauncherApp[] = [
  {
    id: 'browser',
    name: 'Browser',
    description: 'Web pages and bookmarks',
    icon: Globe,
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
    icon: SquareTerminal,
  },
  {
    id: 'notes',
    name: 'Notes',
    description: 'Quick notes and ideas',
    icon: StickyNote,
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Albums and playlists',
    icon: Music2,
  },
  {
    id: 'photos',
    name: 'Photos',
    description: 'Images and collections',
    icon: ImageIcon,
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Events and schedules',
    icon: CalendarDays,
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Preferences and system',
    icon: Settings2,
  },
]
