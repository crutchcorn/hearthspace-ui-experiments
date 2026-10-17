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
import type { GestureShortcut } from '../gestures'
import AppIcon from './AppIcon'
import { APP_CATALOG, type LauncherApp } from './launcher-apps'
import styles from './AppLauncher.module.css'

interface AppLauncherProps {
  mode: 'apps' | 'gestures'
  onModeChange: (mode: 'apps' | 'gestures') => void
  onClose: () => void
  onLaunch: (app: LauncherApp) => void
  onCustomizeGestures: () => void
  onSaveGestureShortcut: (shortcut: GestureShortcut) => void
  editingGestures?: boolean
}

export default function AppLauncher({
  mode,
  onModeChange,
  onClose,
  onLaunch,
  onCustomizeGestures,
  onSaveGestureShortcut,
  editingGestures = false,
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
    if (mode !== 'apps') return
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
      data-shell-controls
      onKeyDown={handleNavigation}
    >
      <header className={styles.commandBar}>
        {mode === 'apps' ? (
          <div className={styles.searchField}>
            <Search size={22} strokeWidth={1.6} />
            <input
              ref={searchRef}
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setSelectedId(null)
              }}
              placeholder="Find an application"
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
                <X size={17} />
              </button>
            )}
          </div>
        ) : (
          <div className={styles.gestureHeading}>
            <PenLine size={23} strokeWidth={1.6} />
            <strong>Draw to open</strong>
          </div>
        )}
        <div className={styles.modeSwitch} aria-label="Launcher views">
          <button
            type="button"
            className={mode === 'apps' ? styles.activeTab : undefined}
            aria-pressed={mode === 'apps'}
            onClick={() => onModeChange('apps')}
          >
            <LayoutGrid size={17} /> Apps
          </button>
          <button
            type="button"
            className={mode === 'gestures' ? styles.activeTab : undefined}
            aria-pressed={mode === 'gestures'}
            onClick={() => onModeChange('gestures')}
          >
            <PenLine size={17} /> Draw
          </button>
        </div>
        <button
          type="button"
          className={styles.closeButton}
          aria-label="Close app launcher"
          onClick={onClose}
        >
          <X size={19} />
        </button>
      </header>
      {mode === 'apps' ? (
        <div className={styles.appsPanel}>
          <div className={styles.collectionHeading}>
            <div>
              <h2>{normalizedQuery ? 'Search results' : 'Applications'}</h2>
              {normalizedQuery && <span>{apps.length} found</span>}
            </div>
            {!normalizedQuery && (
              <div className={styles.viewToggle} aria-label="App layout">
                <button
                  type="button"
                  aria-label="Show app grid"
                  aria-pressed={view === 'grid'}
                  onClick={() => setView('grid')}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  type="button"
                  aria-label="Show app list"
                  aria-pressed={view === 'list'}
                  onClick={() => setView('list')}
                >
                  <List size={18} />
                </button>
              </div>
            )}
          </div>
          <div className={showList ? styles.appList : styles.appGrid}>
            {apps.map((app, index) => {
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
                  aria-label={app.name}
                  title={app.description}
                  onPointerEnter={() => setSelectedId(app.id)}
                  onFocus={() => setSelectedId(app.id)}
                  onClick={() => onLaunch(app)}
                >
                  <span className={styles.appIcon}>
                    <AppIcon
                      appId={app.id}
                      icon={app.icon}
                      size={showList ? 25 : 30}
                      strokeWidth={1.5}
                    />
                  </span>
                  <span className={styles.appCopy}>
                    <strong>{app.name}</strong>
                    {showList && <span>{app.description}</span>}
                  </span>
                  {showList && (
                    <ArrowUpRight
                      size={18}
                      className={styles.openIcon}
                      aria-hidden="true"
                    />
                  )}
                </button>
              )
            })}
          </div>
          {apps.length === 0 && (
            <div className={styles.emptyResults}>
              <Search size={30} strokeWidth={1.3} />
              <p>No applications found</p>
              <span>Search by name or function.</span>
            </div>
          )}
          <footer className={styles.footer}>
            <span>
              <CornerDownLeft size={14} /> Enter to open
            </span>
            <kbd>Ctrl / ⌘ K</kbd>
          </footer>
        </div>
      ) : (
        <div className={styles.gesturePanel}>
          <GesturePad
            mode="launcher"
            onSaveShortcut={onSaveGestureShortcut}
            onLaunch={onLaunch}
            onCustomizeGestures={onCustomizeGestures}
            initialEditing={editingGestures}
          />
        </div>
      )}
    </section>
  )
}
