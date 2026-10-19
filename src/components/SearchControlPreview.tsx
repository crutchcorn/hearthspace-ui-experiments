import type { ReactNode } from 'react'
import {
  BatteryFull,
  Bell,
  BellRing,
  Clock3,
  Grid2X2,
  Hand,
  MousePointer2,
  Pencil,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { CANVAS_TOOL_CATALOG } from '../canvas-tool-catalog'
import type { CanvasTool, WindowSelectionShape } from '../desktop'
import type { NotificationsState } from '../useNotifications'
import type { SystemStatus } from '../useSystemStatus'
import { formatClock, type ClockDateFormat } from '../clock-format'
import AppIcon from './AppIcon'
import { APP_CATALOG } from './launcher-apps'
import styles from './SearchControlPreview.module.css'

interface SearchControlPreviewProps {
  widgetId?: string
  toolId?: string
  status: SystemStatus
  clockDateFormat: ClockDateFormat
  notifications: NotificationsState
  tool: CanvasTool
  selectionShape: WindowSelectionShape
  favoriteAppIds?: string[]
}

export default function SearchControlPreview({
  widgetId,
  toolId,
  status,
  clockDateFormat,
  notifications,
  tool,
  selectionShape,
  favoriteAppIds = [],
}: SearchControlPreviewProps) {
  let title: string
  let icon: ReactNode
  let detail: ReactNode

  const canvasTool = CANVAS_TOOL_CATALOG.find((entry) => entry.id === toolId)
  if (canvasTool) {
    title = canvasTool.title
    icon = <canvasTool.Icon size={26} aria-hidden="true" />
    const selected =
      'mode' in canvasTool &&
      canvasTool.mode === tool &&
      (!('shape' in canvasTool) || canvasTool.shape === selectionShape)
    detail = selected ? 'Selected' : null
  } else {
    switch (widgetId) {
      case 'notifications': {
        title = 'Notifications'
        const Icon = notifications.unreadCount > 0 ? BellRing : Bell
        icon = <Icon size={26} aria-hidden="true" />
        detail = notifications.unreadCount
          ? `${notifications.unreadCount} unread`
          : 'All clear'
        break
      }
      case 'wifi': {
        title = 'Wi-Fi'
        const Icon = status.wifiEnabled ? Wifi : WifiOff
        icon = <Icon size={26} aria-hidden="true" />
        detail = status.wifiEnabled ? 'Studio network' : 'Off'
        break
      }
      case 'volume': {
        title = 'Sound'
        const Icon = status.volume > 0 ? Volume2 : VolumeX
        icon = <Icon size={26} aria-hidden="true" />
        detail = status.volume > 0 ? `${status.volume}%` : 'Muted'
        break
      }
      case 'battery':
        title = 'Battery'
        icon = <BatteryFull size={28} aria-hidden="true" />
        detail = `${status.batteryPercentage}%`
        break
      case 'clock':
        title = 'Clock'
        icon = <Clock3 size={26} aria-hidden="true" />
        detail = formatClock(status.now, clockDateFormat)
        break
      case 'apps': {
        title = 'Apps'
        icon = <Grid2X2 size={26} aria-hidden="true" />
        const apps = favoriteAppIds
          .map((id) => APP_CATALOG.find((app) => app.id === id))
          .filter((app) => app !== undefined)
          .slice(0, 4)
        detail = (
          <span className={styles.icons} aria-hidden="true">
            {(apps.length ? apps : APP_CATALOG.slice(0, 4)).map((app) => (
              <AppIcon key={app.id} appId={app.id} icon={app.icon} size={18} />
            ))}
          </span>
        )
        break
      }
      default:
        title = 'Canvas tools'
        icon = <MousePointer2 size={26} aria-hidden="true" />
        detail = (
          <span className={styles.icons} aria-hidden="true">
            <MousePointer2 size={16} data-active={tool === 'cursor'} />
            <Hand size={16} data-active={tool === 'pan'} />
            <Pencil size={16} data-active={tool === 'draw'} />
          </span>
        )
    }
  }

  return (
    <span className={styles.preview}>
      <span className={styles.icon}>{icon}</span>
      <span className={styles.content}>
        <span className={styles.title}>{title}</span>
        {detail && <span className={styles.detail}>{detail}</span>}
      </span>
    </span>
  )
}
