import type { CSSProperties } from 'react'
import {
  CalendarDays,
  FolderOpen,
  Globe,
  Image,
  Music2,
  StickyNote,
  Terminal,
  type LucideIcon,
} from 'lucide-react'
import type { IconComponent } from '../icons'
import styles from './AppIcon.module.css'

interface AppIconProps {
  appId: string
  icon: IconComponent | LucideIcon
  size?: number
  strokeWidth?: number
}

// Only simulated third-party apps retain their own artwork.
const THIRD_PARTY_GLYPHS: Partial<Record<string, LucideIcon>> = {
  browser: Globe,
  files: FolderOpen,
  terminal: Terminal,
  notes: StickyNote,
  music: Music2,
  photos: Image,
  calendar: CalendarDays,
}

export default function AppIcon({
  appId,
  icon: Icon,
  size = 24,
  strokeWidth,
}: AppIconProps) {
  const ThirdPartyIcon = THIRD_PARTY_GLYPHS[appId]

  return (
    <span
      className={styles.identity}
      data-app-icon={appId}
      data-app-artwork={ThirdPartyIcon ? 'simulated' : undefined}
      style={{ '--app-icon-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <Icon className={styles.ideal} size={size} strokeWidth={strokeWidth} />
      {ThirdPartyIcon && (
        <span className={styles.realistic}>
          <ThirdPartyIcon strokeWidth={1.65} />
        </span>
      )}
    </span>
  )
}
