import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  ArrowUpRight,
  CornerDownLeft,
  LayoutGrid,
  List,
  PenLine,
  Search,
  X,
} from 'lucide-react'
import GesturePad from './GesturePad'
import { APP_CATALOG, type LauncherApp } from './launcher-apps'
import styles from './AppLauncher.module.css'

interface AppLauncherProps {
  mode: 'apps' | 'gestures'
  onModeChange: (mode: 'apps' | 'gestures') => void
  onClose: () => void
  onLaunch: (app: LauncherApp) => void
}

export default function AppLauncher({
  mode,
  onModeChange,
  onClose,
  onLaunch,
}: AppLauncherProps) {
  const [query, setQuery] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const appRefs = useRef(new Map<string, HTMLButtonElement>())
  const normalizedQuery = query.trim().toLowerCase()
  const apps = APP_CATALOG.filter((app) =>
    `${app.name} ${app.description}`.toLowerCase().includes(normalizedQuery),
  )
  const showList = normalizedQuery.length > 0 || view === 'list'
  const selectedIndex = Math.max(
    0,
    apps.findIndex((app) => app.id === selectedId),
  )

  useEffect(() => {
    if (mode !== 'apps' || !window.matchMedia('(pointer: fine)').matches) return
    const frame = window.requestAnimationFrame(() => searchRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [mode])

  function handleNavigation(event: KeyboardEvent<HTMLDivElement>) {
    const focusedId =
      event.target instanceof HTMLButtonElement
        ? event.target.dataset.appId
        : undefined
    const fromApp = focusedId !== undefined
    if (!(event.target instanceof HTMLInputElement) && !fromApp) return
    if (apps.length === 0 || event.altKey || event.ctrlKey || event.metaKey)
      return
    const navigationIndex = fromApp
      ? Math.max(
          0,
          apps.findIndex((app) => app.id === focusedId),
        )
      : selectedIndex

    if (event.key === 'Enter') {
      event.preventDefault()
      if (!event.repeat) onLaunch(apps[navigationIndex])
      return
    }

    const steps: Record<string, number> = {
      ArrowDown: showList ? 1 : 4,
      ArrowUp: showList ? -1 : -4,
      ArrowRight: 1,
      ArrowLeft: -1,
    }
    const step = steps[event.key]
    if (step === undefined) return
    // Left/right keep their text-editing behavior inside the search field.
    if (!fromApp && (event.key === 'ArrowLeft' || event.key === 'ArrowRight'))
      return
    event.preventDefault()
    const nextIndex = (navigationIndex + step + apps.length) % apps.length
    const nextApp = apps[nextIndex]
    setSelectedId(nextApp.id)
    if (fromApp) appRefs.current.get(nextApp.id)?.focus()
    else appRefs.current.get(nextApp.id)?.scrollIntoView({ block: 'nearest' })
  }

  return (
    <section
      className={styles.launcher}
      aria-label="App launcher"
      data-launcher-root
    >
      <header className={styles.header}>
        <h2>Apps</h2>
        <div className={styles.tabs} aria-label="Launcher views">
          <button
            type="button"
            className={mode === 'apps' ? styles.activeTab : undefined}
            aria-pressed={mode === 'apps'}
            onClick={() => onModeChange('apps')}
          >
            <LayoutGrid size={14} />
            Apps
          </button>
          <button
            type="button"
            className={mode === 'gestures' ? styles.activeTab : undefined}
            aria-pressed={mode === 'gestures'}
            onClick={() => onModeChange('gestures')}
          >
            <PenLine size={14} />
            Draw
          </button>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close app launcher"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>

      {mode === 'apps' ? (
        <div className={styles.appsPanel} onKeyDown={handleNavigation}>
          <div className={styles.searchField}>
            <Search size={17} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSelectedId(null)
              }}
              placeholder="Search apps"
              aria-label="Search apps"
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setQuery('')
                  setSelectedId(null)
                  searchRef.current?.focus()
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className={styles.collectionHeading}>
            <span>
              {normalizedQuery ? `${apps.length} results` : 'All apps'}
            </span>
            {!normalizedQuery && (
              <div className={styles.viewToggle} aria-label="App layout">
                <button
                  type="button"
                  aria-label="Show app grid"
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                >
                  <LayoutGrid size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Show app list"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                >
                  <List size={16} />
                </button>
              </div>
            )}
          </div>

          <div className={showList ? styles.appList : styles.appGrid}>
            {apps.map((app, index) => {
              const Icon = app.icon
              return (
                <button
                  key={app.id}
                  ref={(element) => {
                    if (element) appRefs.current.set(app.id, element)
                    else appRefs.current.delete(app.id)
                  }}
                  type="button"
                  data-app-id={app.id}
                  data-selected={index === selectedIndex}
                  className={styles.appButton}
                  title={app.description}
                  onPointerEnter={() => setSelectedId(app.id)}
                  onFocus={() => setSelectedId(app.id)}
                  onClick={() => onLaunch(app)}
                >
                  <span
                    className={styles.appIcon}
                    style={{
                      color: app.color,
                      backgroundColor: `${app.color}16`,
                    }}
                  >
                    <Icon size={25} strokeWidth={1.5} />
                  </span>
                  <span className={styles.appCopy}>
                    <strong>{app.name}</strong>
                    {showList && <span>{app.description}</span>}
                  </span>
                  {showList && (
                    <ArrowUpRight size={14} className={styles.openIcon} />
                  )}
                </button>
              )
            })}
          </div>
          {apps.length === 0 && (
            <div className={styles.emptyResults}>
              <Search size={22} strokeWidth={1.5} />
              <p>No apps found</p>
              <span>Try a different name.</span>
            </div>
          )}

          <footer className={styles.footer}>
            <span>
              <CornerDownLeft size={12} /> Enter to open
            </span>
            <span>
              <kbd>Ctrl / ⌘ K</kbd> to search
            </span>
          </footer>
        </div>
      ) : (
        <div className={styles.gesturePanel}>
          <GesturePad onLaunch={onLaunch} />
        </div>
      )}
    </section>
  )
}
