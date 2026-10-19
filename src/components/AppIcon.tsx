import type { CSSProperties } from 'react'
import type { IconComponent } from '../icons'
import styles from './AppIcon.module.css'

interface AppIconProps {
  appId: string
  icon: IconComponent
  size?: number
}

export default function AppIcon({
  appId,
  icon: Icon,
  size = 24,
}: AppIconProps) {
  return (
    <span
      className={styles.identity}
      data-app-icon={appId}
      style={{ '--app-icon-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      <Icon size={size} />
    </span>
  )
}
