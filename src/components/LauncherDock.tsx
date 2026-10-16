import { LayoutGrid, PanelsTopLeft, Plus, X } from 'lucide-react'
import { useEffect, useId, useRef, type Ref } from 'react'
import type { DesktopWindow } from '../desktop'
import { APP_CATALOG, type LauncherApp } from './launcher-apps'
import styles from './LauncherDock.module.css'

const FAVORITE_IDS = ['browser', 'files', 'notes']
const WORKSPACE_APPS: LauncherApp[] = [
  {
    id: 'workspace-welcome',
    name: 'Workspace',
    description: 'Workspace overview',
    icon: PanelsTopLeft,
  },
  {
    id: 'workspace-windows',
    name: 'Windows',
    description: 'Other open windows',
    icon: PanelsTopLeft,
  },
]
const DOCK_APPS = [
  ...APP_CATALOG.filter((app) => FAVORITE_IDS.includes(app.id)),
  ...APP_CATALOG.filter((app) => !FAVORITE_IDS.includes(app.id)),
  ...WORKSPACE_APPS,
]

function windowAppId(item: DesktopWindow) {
  if (APP_CATALOG.some((app) => app.id === item.appId)) return item.appId
  if (!item.appId && item.kind === 'notes') return 'notes'
  if (!item.appId && item.kind === 'welcome') return 'workspace-welcome'
  return 'workspace-windows'
}

interface LauncherDockProps {
  open: boolean
  triggerRef: Ref<HTMLButtonElement>
  onToggle: () => void
  onLaunch: (app: LauncherApp) => void
  windows: DesktopWindow[]
  activeWindowId: string | null
  selectedAppId: string | null
  onSelectApp: (id: string | null) => void
  onFocusWindow: (id: string) => void
}

export default function LauncherDock({
  open,
  triggerRef,
  onToggle,
  onLaunch,
  windows,
  activeWindowId,
  selectedAppId,
  onSelectApp,
  onFocusWindow,
}: LauncherDockProps) {
  const panelId = useId()
  const dockRef = useRef<HTMLElement>(null)
  const appTriggers = useRef(new Map<string, HTMLButtonElement>())
  const firstInstance = useRef<HTMLButtonElement>(null)
  const focusOnOpen = useRef<string | null>(null)
  const groups = DOCK_APPS.map((app) => ({
    app,
    windows: windows
      .filter((item) => windowAppId(item) === app.id)
      .toSorted(
        (a, b) => a.title.localeCompare(b.title) || a.id.localeCompare(b.id),
      ),
  })).filter(
    ({ app, windows: instances }) =>
      FAVORITE_IDS.includes(app.id) || instances.length > 0,
  )
  const selectedGroup = groups.find(
    ({ app, windows: instances }) =>
      app.id === selectedAppId && instances.length > 0,
  )
  const selectedCatalogApp = APP_CATALOG.find(
    (app) => app.id === selectedGroup?.app.id,
  )

  useEffect(() => {
    if (!selectedAppId) return

    function dismissOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !dockRef.current?.contains(event.target)
      )
        onSelectApp(null)
    }

    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      onSelectApp(null)
      appTriggers.current.get(selectedAppId!)?.focus({ preventScroll: true })
    }

    document.addEventListener('pointerdown', dismissOutside, true)
    document.addEventListener('keydown', dismissOnEscape, true)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside, true)
      document.removeEventListener('keydown', dismissOnEscape, true)
    }
  }, [selectedAppId, onSelectApp])

  useEffect(() => {
    if (!selectedAppId || focusOnOpen.current !== selectedAppId) return
    focusOnOpen.current = null
    firstInstance.current?.focus({ preventScroll: true })
  }, [selectedAppId])

  return (
    <nav
      ref={dockRef}
      className={styles.dock}
      aria-label="Apps, favorites, and running windows"
      data-launcher-trigger
    >
      <div
        className={styles.appStrip}
        role="group"
        aria-label="Favorite and running apps"
      >
        {groups.map(({ app, windows: instances }) => {
          const Icon = app.icon
          const running = instances.length > 0
          const active = instances.some((item) => item.id === activeWindowId)
          const label = running
            ? `${app.name}, ${instances.length} ${instances.length === 1 ? 'window' : 'windows'}${active ? ', active' : ''}`
            : `Open ${app.name}`

          return (
            <button
              key={app.id}
              ref={(element) => {
                if (element) appTriggers.current.set(app.id, element)
                else appTriggers.current.delete(app.id)
              }}
              type="button"
              className={styles.appButton}
              title={label}
              aria-label={label}
              aria-expanded={running ? selectedAppId === app.id : undefined}
              aria-controls={
                running && selectedAppId === app.id ? panelId : undefined
              }
              data-active={active}
              data-running={running}
              onClick={() => {
                if (running)
                  onSelectApp(selectedAppId === app.id ? null : app.id)
                else onLaunch(app)
              }}
              onKeyDown={(event) => {
                if (!running || event.key !== 'ArrowDown') return
                event.preventDefault()
                if (selectedAppId === app.id) firstInstance.current?.focus()
                else {
                  focusOnOpen.current = app.id
                  onSelectApp(app.id)
                }
              }}
            >
              <span className={styles.appIcon}>
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className={styles.appName} aria-hidden="true">
                {app.name}
              </span>
              {running && (
                <>
                  <span className={styles.count} aria-hidden="true">
                    {instances.length > 99 ? '99+' : instances.length}
                  </span>
                  <span className={styles.runningMark} aria-hidden="true" />
                </>
              )}
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
        <LayoutGrid size={22} aria-hidden="true" />
        <span>Apps</span>
      </button>
      {selectedGroup && (
        <section
          id={panelId}
          className={styles.windowPopover}
          aria-labelledby={`${panelId}-heading`}
        >
          <header className={styles.popoverHeading}>
            <div>
              <p>Window index</p>
              <h2 id={`${panelId}-heading`}>{selectedGroup.app.name}</h2>
              <span>
                {selectedGroup.windows.length}{' '}
                {selectedGroup.windows.length === 1 ? 'window' : 'windows'}
              </span>
            </div>
            <button
              type="button"
              className={styles.closeButton}
              aria-label="Close window list"
              onClick={() => {
                onSelectApp(null)
                appTriggers.current.get(selectedGroup.app.id)?.focus()
              }}
            >
              <X size={17} aria-hidden="true" />
            </button>
          </header>
          <div className={styles.windowList}>
            {selectedGroup.windows.map((item, index) => (
              <button
                key={item.id}
                ref={index === 0 ? firstInstance : undefined}
                type="button"
                className={styles.windowButton}
                aria-label={`Show ${item.title}, window ${index + 1}${item.id === activeWindowId ? ', active' : ''}`}
                data-active={item.id === activeWindowId}
                onClick={() => onFocusWindow(item.id)}
              >
                <span className={styles.windowNumber} aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className={styles.windowCopy}>
                  <strong>{item.title}</strong>
                  <span>
                    {Math.round(item.width)} × {Math.round(item.height)} ·{' '}
                    {item.id === activeWindowId ? 'In focus' : 'On canvas'}
                  </span>
                </span>
                <span className={styles.windowPreview} aria-hidden="true">
                  <span />
                </span>
                {item.id === activeWindowId && (
                  <span className={styles.activeLabel} aria-hidden="true">
                    Active
                  </span>
                )}
              </button>
            ))}
          </div>
          {selectedCatalogApp && (
            <footer className={styles.popoverFooter}>
              <button
                type="button"
                className={styles.newWindow}
                onClick={() => onLaunch(selectedCatalogApp)}
              >
                <Plus size={16} aria-hidden="true" />
                New window
              </button>
            </footer>
          )}
        </section>
      )}
    </nav>
  )
}
