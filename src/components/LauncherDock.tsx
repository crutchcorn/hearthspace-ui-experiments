import { LayoutGrid } from 'lucide-react'
import type { Ref } from 'react'
import { APP_CATALOG, type LauncherApp } from './launcher-apps'
import styles from './LauncherDock.module.css'

const FAVORITE_APPS = APP_CATALOG.filter((app) =>
  ['browser', 'files', 'notes'].includes(app.id),
)

interface LauncherDockProps {
  open: boolean
  triggerRef: Ref<HTMLButtonElement>
  onToggle: () => void
  onLaunch: (app: LauncherApp) => void
}

export default function LauncherDock({
  open,
  triggerRef,
  onToggle,
  onLaunch,
}: LauncherDockProps) {
  return (
    <nav
      className={styles.dock}
      aria-label="Apps and favorites"
      data-launcher-trigger
    >
      <div className={styles.favorites} role="group" aria-label="Favorite apps">
        {FAVORITE_APPS.map((app) => {
          const Icon = app.icon

          return (
            <button
              key={app.id}
              type="button"
              className={styles.favorite}
              title={`Open ${app.name}`}
              aria-label={`Open ${app.name}`}
              onClick={() => onLaunch(app)}
            >
              <span
                className={styles.appIcon}
                style={{ color: app.color, backgroundColor: `${app.color}16` }}
              >
                <Icon size={20} aria-hidden="true" />
              </span>
            </button>
          )
        })}
      </div>
      <span className={styles.divider} aria-hidden="true" />
      <button
        ref={triggerRef}
        type="button"
        className={styles.launcher}
        aria-label="Open app launcher"
        aria-expanded={open}
        title="Open app launcher (⌘/Ctrl K)"
        onClick={onToggle}
      >
        <LayoutGrid size={18} aria-hidden="true" />
        <span>Apps</span>
      </button>
    </nav>
  )
}
