import type { CSSProperties } from 'react'
import { FolderOpen, Settings, Terminal, type LucideIcon } from 'lucide-react'
import styles from './AppIcon.module.css'

interface AppIconProps {
  appId: string
  icon: LucideIcon
  size?: number
  strokeWidth?: number
}

const REALISTIC_GLYPHS: Record<string, LucideIcon> = {
  files: FolderOpen,
  settings: Settings,
  gestures: Settings,
  terminal: Terminal,
}

export default function AppIcon({
  appId,
  icon: Icon,
  size = 24,
  strokeWidth = 1.8,
}: AppIconProps) {
  const RealisticIcon = REALISTIC_GLYPHS[appId] ?? Icon

  return (
    <span
      className={styles.identity}
      data-app-icon={appId}
      style={{ '--app-icon-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <Icon className={styles.ideal} strokeWidth={strokeWidth} />
      <span className={styles.realistic}>
        <RealisticIcon strokeWidth={1.65} />
      </span>
    </span>
  )
}
