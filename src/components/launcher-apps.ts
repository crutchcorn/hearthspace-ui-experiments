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
  color: string
}

export const APP_CATALOG: LauncherApp[] = [
  {
    id: 'browser',
    name: 'Browser',
    description: 'Web pages and bookmarks',
    icon: Globe,
    color: '#6d8778',
  },
  {
    id: 'files',
    name: 'Files',
    description: 'Folders and documents',
    icon: Folder,
    color: '#ad8958',
  },
  {
    id: 'terminal',
    name: 'Terminal',
    description: 'Commands and workspaces',
    icon: SquareTerminal,
    color: '#69755f',
  },
  {
    id: 'notes',
    name: 'Notes',
    description: 'Quick notes and ideas',
    icon: StickyNote,
    color: '#a48c4f',
  },
  {
    id: 'music',
    name: 'Music',
    description: 'Albums and playlists',
    icon: Music2,
    color: '#a77565',
  },
  {
    id: 'photos',
    name: 'Photos',
    description: 'Images and collections',
    icon: ImageIcon,
    color: '#7e8f67',
  },
  {
    id: 'calendar',
    name: 'Calendar',
    description: 'Events and schedules',
    icon: CalendarDays,
    color: '#a47362',
  },
  {
    id: 'settings',
    name: 'Settings',
    description: 'Preferences and system',
    icon: Settings2,
    color: '#7e8377',
  },
]
