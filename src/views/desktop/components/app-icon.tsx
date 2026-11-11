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
import {
  AppSettings,
  Calendar,
  Compass,
  Folder,
  Music,
  Note,
  Photo,
  Terminal as TerminalGlyph,
  FrameLayout,
  type IconComponent,
  type IconVariant,
} from '../../../components/icons'
import styles from './app-icon.module.css'

interface AppIconProps {
  appId: string
  icon?: IconComponent | LucideIcon
  fallback?: IconComponent
  size?: number
  strokeWidth?: number
  variant?: IconVariant
}

const APP_GLYPHS: Partial<Record<string, IconComponent>> = {
  browser: Compass,
  files: Folder,
  terminal: TerminalGlyph,
  notes: Note,
  music: Music,
  photos: Photo,
  calendar: Calendar,
  settings: AppSettings,
}

export function AppGlyph({
  appId,
  icon,
  fallback = FrameLayout,
  ...props
}: AppIconProps & { className?: string }) {
  const Icon = icon ?? APP_GLYPHS[appId] ?? fallback
  return <Icon {...props} />
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
  icon,
  fallback,
  size = 24,
  strokeWidth,
  variant = 'outline',
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
      <AppGlyph
        appId={appId}
        icon={icon}
        fallback={fallback}
        className={styles.ideal}
        size={size}
        strokeWidth={strokeWidth}
        variant={variant}
      />
      {ThirdPartyIcon && (
        <span className={styles.realistic}>
          <ThirdPartyIcon strokeWidth={1.65} />
        </span>
      )}
    </span>
  )
}
