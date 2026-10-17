import { GripVertical, LayoutGrid, PanelsTopLeft, Plus, X } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type Ref,
} from 'react'
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

function WindowInstanceList({
  windows,
  activeWindowId,
  firstInstance,
  onFocusWindow,
  onReorderWindows,
}: {
  windows: DesktopWindow[]
  activeWindowId: string | null
  firstInstance: Ref<HTMLButtonElement>
  onFocusWindow: (id: string) => void
  onReorderWindows: (ids: string[]) => void
}) {
  const list = useRef<HTMLDivElement>(null)
  const rows = useRef(new Map<string, HTMLDivElement>())
  const handles = useRef(new Map<string, HTMLButtonElement>())
  const focusHandle = useRef<{ id: string; reveal: boolean } | null>(null)
  const animation = useRef(0)
  const gesture = useRef<{
    id: string
    pointerId: number
    startY: number
    y: number
    moved: boolean
    ids: string[]
  } | null>(null)
  const [draftIds, setDraftIds] = useState<string[] | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const ordered = draftIds
    ? windows.toSorted(
        (a, b) => draftIds.indexOf(a.id) - draftIds.indexOf(b.id),
      )
    : windows

  useEffect(() => () => cancelAnimationFrame(animation.current), [])

  useLayoutEffect(() => {
    if (!focusHandle.current) return
    const { id, reveal } = focusHandle.current
    handles.current.get(id)?.focus({ preventScroll: true })
    if (reveal) {
      const row = rows.current.get(id)?.getBoundingClientRect()
      const panel = list.current?.closest('section')
      if (row && panel) {
        const bounds = panel.getBoundingClientRect()
        if (row.top < bounds.top) panel.scrollTop += row.top - bounds.top
        else if (row.bottom > bounds.bottom)
          panel.scrollTop += row.bottom - bounds.bottom
      }
    }
    focusHandle.current = null
  })

  function updateOrder() {
    const current = gesture.current
    if (!current?.moved) return
    const next = current.ids.filter((id) => id !== current.id)
    const index = next.filter((id) => {
      const rect = rows.current.get(id)?.getBoundingClientRect()
      return rect && current.y > rect.top + rect.height / 2
    }).length
    next.splice(index, 0, current.id)
    if (next.every((id, i) => id === current.ids[i])) return
    current.ids = next
    setDraftIds(next)
  }

  function scrollDuringDrag() {
    const current = gesture.current
    const panel = list.current?.closest('section')
    if (!current?.moved || !panel) return
    const bounds = panel.getBoundingClientRect()
    const edge = 40
    const scroll =
      current.y < bounds.top + edge
        ? -Math.min(12, (bounds.top + edge - current.y) / 3)
        : current.y > bounds.bottom - edge
          ? Math.min(12, (current.y - bounds.bottom + edge) / 3)
          : 0
    if (scroll) {
      panel.scrollTop += scroll
      updateOrder()
    }
    animation.current = requestAnimationFrame(scrollDuringDrag)
  }

  function finishDrag(event: PointerEvent<HTMLDivElement>, commit = false) {
    const current = gesture.current
    if (current?.pointerId !== event.pointerId) return
    gesture.current = null
    cancelAnimationFrame(animation.current)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    setDraggedId(null)
    setDraftIds(null)
    if (current.moved) {
      focusHandle.current = { id: current.id, reveal: false }
      if (commit) onReorderWindows(current.ids)
    } else handles.current.get(current.id)?.focus({ preventScroll: true })
  }

  return (
    <div
      ref={list}
      className={styles.windowList}
      onPointerMove={(event) => {
        const current = gesture.current
        if (current?.pointerId !== event.pointerId) return
        current.y = event.clientY
        if (!current.moved) {
          if (Math.abs(current.y - current.startY) < 4) return
          current.moved = true
          setDraggedId(current.id)
          animation.current = requestAnimationFrame(scrollDuringDrag)
        }
        updateOrder()
      }}
      onPointerUp={(event) => finishDrag(event, true)}
      onPointerCancel={finishDrag}
      onLostPointerCapture={finishDrag}
    >
      {ordered.map((item, index) => (
        <div
          key={item.id}
          ref={(element) => {
            if (element) rows.current.set(item.id, element)
            else rows.current.delete(item.id)
          }}
          className={styles.windowRow}
          data-active={item.id === activeWindowId}
          data-dragging={item.id === draggedId}
        >
          <button
            ref={index === 0 ? firstInstance : undefined}
            type="button"
            className={styles.windowButton}
            aria-label={`Show ${item.title}, window ${index + 1}${item.id === activeWindowId ? ', active' : ''}`}
            onClick={() => onFocusWindow(item.id)}
          >
            <span className={styles.windowPreview} aria-hidden="true">
              <span />
            </span>
            <span className={styles.windowCopy}>
              <strong>{item.title}</strong>
            </span>
          </button>
          <button
            ref={(element) => {
              if (element) handles.current.set(item.id, element)
              else handles.current.delete(item.id)
            }}
            type="button"
            className={styles.reorderHandle}
            aria-label={`Reorder ${item.title}, window ${index + 1}`}
            title="Drag to reorder · ↑/↓ to move"
            disabled={windows.length < 2}
            onPointerDown={(event) => {
              if (event.button !== 0 || gesture.current) return
              event.preventDefault()
              event.currentTarget.focus({ preventScroll: true })
              gesture.current = {
                id: item.id,
                pointerId: event.pointerId,
                startY: event.clientY,
                y: event.clientY,
                moved: false,
                ids: windows.map((entry) => entry.id),
              }
              // Capture on the stable list; rows move during the gesture.
              list.current?.setPointerCapture(event.pointerId)
            }}
            onKeyDown={(event) => {
              if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
              event.preventDefault()
              if (gesture.current) return
              const nextIndex = index + (event.key === 'ArrowUp' ? -1 : 1)
              if (nextIndex < 0 || nextIndex >= windows.length) return
              const ids = windows.map((entry) => entry.id)
              ids.splice(index, 1)
              ids.splice(nextIndex, 0, item.id)
              focusHandle.current = { id: item.id, reveal: true }
              onReorderWindows(ids)
            }}
          >
            <GripVertical size={18} aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  )
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
  onReorderWindows: (ids: string[]) => void
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
  onReorderWindows,
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
        (a, b) =>
          (a.dockOrder ?? Infinity) - (b.dockOrder ?? Infinity) ||
          a.title.localeCompare(b.title) ||
          a.id.localeCompare(b.id),
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

    function dismissOutside(event: globalThis.PointerEvent) {
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
      <div className={styles.bar}>
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
                {running && (
                  <span className={styles.runningDots} aria-hidden="true">
                    {instances.slice(0, 3).map((item) => (
                      <span key={item.id} />
                    ))}
                  </span>
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
        </button>
      </div>
      {selectedGroup && (
        <section
          id={panelId}
          className={styles.windowPopover}
          aria-labelledby={`${panelId}-heading`}
        >
          <header className={styles.popoverHeading}>
            <h2 id={`${panelId}-heading`}>{selectedGroup.app.name}</h2>
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
          <WindowInstanceList
            key={selectedGroup.app.id}
            windows={selectedGroup.windows}
            activeWindowId={activeWindowId}
            firstInstance={firstInstance}
            onFocusWindow={onFocusWindow}
            onReorderWindows={onReorderWindows}
          />
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
