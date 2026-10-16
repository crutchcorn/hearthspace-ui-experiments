import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Flame,
  Hand,
  LayoutGrid,
  Maximize2,
  PanelsTopLeft,
  RotateCcw,
  Scan,
  StickyNote,
  Spline,
  X,
} from 'lucide-react'
import SystemBar, { type SystemPanel } from './components/SystemBar'
import NotificationInbox, {
  type NotificationTarget,
} from './components/NotificationInbox'
import Minimap from './components/Minimap'
import CanvasTools from './components/CanvasTools'
import AppLauncher from './components/AppLauncher'
import { APP_CATALOG, type LauncherApp } from './components/launcher-apps'
import {
  arrangeWindows,
  clamp,
  loadWorkspace,
  MIN_HEIGHT,
  MIN_WIDTH,
  resizeBounds,
  STORAGE_KEY,
  type Bounds,
  type DesktopWindow,
} from './desktop'
import styles from './App.module.css'

type Gesture = {
  pointerId: number
  type: 'pan' | 'move' | 'resize' | 'lasso'
  startX: number
  startY: number
  scrollX: number
  scrollY: number
  id?: string
  bounds?: Bounds
  edge?: string
}

const edges = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw']

function App() {
  const [workspace, setWorkspace] = useState(loadWorkspace)
  const [view, setView] = useState(() => ({
    ...workspace.home,
    width: window.innerWidth,
    height: window.innerHeight,
  }))
  const [activeId, setActiveId] = useState<string | null>(
    workspace.windows.at(-1)?.id ?? null,
  )
  const [dragging, setDragging] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [systemPanel, setSystemPanel] = useState<SystemPanel>(null)
  const [tool, setTool] = useState<'pan' | 'lasso'>('pan')
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selection, setSelection] = useState<Bounds | null>(null)
  const [launcher, setLauncher] = useState<'apps' | 'gestures' | null>(null)
  const launcherTrigger = useRef<HTMLButtonElement>(null)
  const viewport = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const captureTarget = useRef<Element | null>(null)
  const latestPointer = useRef({ x: 0, y: 0 })
  const home = workspace.home

  const closeTopPanels = useCallback(() => {
    setNotificationsOpen(false)
    setSystemPanel(null)
  }, [])

  const arrangeAllWindows = useCallback(() => {
    const canvas = viewport.current
    if (!canvas) return
    const origin = { x: canvas.scrollLeft, y: canvas.scrollTop }
    canvas.scrollTo({ left: origin.x, top: origin.y, behavior: 'instant' })
    const pointerId = gesture.current?.pointerId
    gesture.current = null
    if (
      pointerId !== undefined &&
      captureTarget.current?.hasPointerCapture(pointerId)
    )
      captureTarget.current.releasePointerCapture(pointerId)
    captureTarget.current = null
    setDragging(false)
    setSpaceHeld(false)
    setSelection(null)
    setSelectedIds([])
    setTool('pan')
    setShowMap(false)
    setLauncher(null)
    closeTopPanels()
    setWorkspace((current) => arrangeWindows(current, origin))
  }, [closeTopPanels])

  useLayoutEffect(() => {
    viewport.current?.scrollTo(home.x, home.y)
  }, [home.x, home.y])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace))
      } catch {
        /* Keep the playground usable when storage is unavailable. */
      }
    }, 200)
    return () => window.clearTimeout(timer)
  }, [workspace])

  useEffect(() => {
    const resize = () =>
      setView((current) => ({
        ...current,
        width: window.innerWidth,
        height: window.innerHeight,
      }))
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setLauncher(launcher === 'apps' ? null : 'apps')
        if (launcher === 'apps')
          launcherTrigger.current?.focus({ preventScroll: true })
        setShowMap(false)
        closeTopPanels()
        return
      }
      if (event.key === 'Escape') {
        setShowMap(false)
        setLauncher(null)
        closeTopPanels()
        setTool('pan')
        setSelectedIds([])
        setSelection(null)
        if (gesture.current?.type === 'lasso') {
          gesture.current = null
          setDragging(false)
        }
        if (launcher) launcherTrigger.current?.focus({ preventScroll: true })
      }
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, [contenteditable="true"]')
      )
        return
      if (launcher || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() === 'a') {
        event.preventDefault()
        if (!event.repeat) arrangeAllWindows()
        return
      }
      if (event.key.toLowerCase() === 'h') {
        closeTopPanels()
        setTool('pan')
        setSelectedIds([])
      }
      if (event.key.toLowerCase() === 'l') {
        closeTopPanels()
        setTool('lasso')
        setShowMap(false)
      }
      if (event.key.toLowerCase() === 'm') {
        closeTopPanels()
        setShowMap((current) => !current)
      }
      if (event.key.toLowerCase() === 'g') {
        closeTopPanels()
        setLauncher('gestures')
        setShowMap(false)
      }
      if (event.key.toLowerCase() === 'n') {
        setNotificationsOpen((current) => !current)
        setSystemPanel(null)
        setShowMap(false)
        setSpaceHeld(false)
      }
      if (event.code === 'Space') {
        if (event.target instanceof Element && event.target.closest('button'))
          return
        event.preventDefault()
        setSpaceHeld(true)
      }
      if (event.code === 'Home') {
        event.preventDefault()
        viewport.current?.scrollTo(home.x, home.y)
      }
    }
    const release = () => {
      setSpaceHeld(false)
      setDragging(false)
      gesture.current = null
      setSelection(null)
    }
    const keyup = (event: KeyboardEvent) => {
      if (event.code === 'Space') setSpaceHeld(false)
    }
    window.addEventListener('resize', resize)
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', release)
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', release)
    }
  }, [home.x, home.y, launcher, closeTopPanels, arrangeAllWindows])

  useEffect(() => {
    if (!launcher) return
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest('[data-launcher-root], [data-launcher-trigger]')
      )
        setLauncher(null)
    }
    document.addEventListener('pointerdown', dismiss, true)
    return () => document.removeEventListener('pointerdown', dismiss, true)
  }, [launcher])

  function focusWindow(id: string) {
    setActiveId(id)
    setWorkspace((current) => {
      const item = current.windows.find((entry) => entry.id === id)
      if (!item || current.windows.at(-1)?.id === id) return current
      return {
        ...current,
        windows: [...current.windows.filter((entry) => entry.id !== id), item],
      }
    })
  }

  function applyGesture(clientX: number, clientY: number) {
    const current = gesture.current
    const canvas = viewport.current
    if (!current || !canvas) return
    if (current.type === 'pan') {
      canvas.scrollTo(
        current.scrollX - clientX + current.startX,
        current.scrollY - clientY + current.startY,
      )
      return
    }
    if (current.type === 'lasso') {
      const startX = current.startX + current.scrollX
      const startY = current.startY + current.scrollY
      const x = clamp(clientX + canvas.scrollLeft, 0, workspace.width)
      const y = clamp(clientY + canvas.scrollTop, 0, workspace.height)
      const area = {
        x: Math.min(startX, x),
        y: Math.min(startY, y),
        width: Math.abs(x - startX),
        height: Math.abs(y - startY),
      }
      setSelection(area)
      setSelectedIds(
        workspace.windows
          .filter(
            (item) =>
              item.x < area.x + area.width &&
              item.x + item.width > area.x &&
              item.y < area.y + area.height &&
              item.y + item.height > area.y,
          )
          .map((item) => item.id),
      )
      return
    }
    const bounds = current.bounds!
    const dx = clientX - current.startX + canvas.scrollLeft - current.scrollX
    const dy = clientY - current.startY + canvas.scrollTop - current.scrollY
    setWorkspace((previous) => ({
      ...previous,
      windows: previous.windows.map((item) =>
        item.id !== current.id
          ? item
          : {
              ...item,
              ...(current.type === 'move'
                ? {
                    x: clamp(bounds.x + dx, 0, previous.width - bounds.width),
                    y: clamp(bounds.y + dy, 0, previous.height - bounds.height),
                  }
                : resizeBounds(bounds, current.edge!, dx, dy, previous)),
            },
      ),
    }))
  }

  const panAtEdge = useEffectEvent(() => {
    const canvas = viewport.current
    if (canvas && gesture.current?.type === 'move') {
      const { x, y } = latestPointer.current
      const speedX = x < 36 ? -12 : x > window.innerWidth - 36 ? 12 : 0
      const speedY = y < 76 ? -12 : y > window.innerHeight - 36 ? 12 : 0
      if (speedX || speedY) {
        canvas.scrollBy(speedX, speedY)
        applyGesture(x, y)
      }
    }
  })

  // Keep carrying a window when its pointer reaches the edge of the screen.
  useEffect(() => {
    if (!dragging) return
    let frame: number
    const tick = () => {
      panAtEdge()
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [dragging])

  function startGesture(
    event: ReactPointerEvent,
    type: Gesture['type'],
    item?: DesktopWindow,
    edge?: string,
  ) {
    if (
      (event.button !== 0 && event.button !== 1) ||
      (item?.restore && type !== 'pan')
    )
      return
    const canvas = viewport.current!
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    captureTarget.current = event.currentTarget
    latestPointer.current = { x: event.clientX, y: event.clientY }
    gesture.current = {
      pointerId: event.pointerId,
      type,
      startX: event.clientX,
      startY: event.clientY,
      scrollX: canvas.scrollLeft,
      scrollY: canvas.scrollTop,
      id: item?.id,
      bounds: item,
      edge,
    }
    setDragging(true)
    if (type === 'lasso') {
      setSelectedIds([])
      setSelection({
        x: canvas.scrollLeft + event.clientX,
        y: canvas.scrollTop + event.clientY,
        width: 0,
        height: 0,
      })
    }
    if (item) focusWindow(item.id)
  }

  function endGesture(event: ReactPointerEvent) {
    if (gesture.current?.pointerId !== event.pointerId) return
    gesture.current = null
    setDragging(false)
    setSelection(null)
    if (captureTarget.current?.hasPointerCapture(event.pointerId))
      captureTarget.current.releasePointerCapture(event.pointerId)
    captureTarget.current = null
  }

  function maximize(item: DesktopWindow) {
    const canvas = viewport.current!
    setWorkspace((current) => ({
      ...current,
      windows: current.windows.map((entry) => {
        if (entry.id !== item.id) return entry
        if (entry.restore) {
          const { restore, ...rest } = entry
          return { ...rest, ...restore }
        }
        const width = Math.min(
          current.width,
          Math.max(MIN_WIDTH, view.width - 48),
        )
        const height = Math.min(
          current.height,
          Math.max(MIN_HEIGHT, view.height - 200),
        )
        return {
          ...entry,
          restore: {
            x: entry.x,
            y: entry.y,
            width: entry.width,
            height: entry.height,
          },
          x: clamp(canvas.scrollLeft + 24, 0, current.width - width),
          y: clamp(canvas.scrollTop + 96, 0, current.height - height),
          width,
          height,
        }
      }),
    }))
    focusWindow(item.id)
  }

  function addWindow(app?: LauncherApp) {
    const canvas = viewport.current!
    const id = crypto.randomUUID()
    const offset = (workspace.windows.length % 5) * 24
    setWorkspace((current) => ({
      ...current,
      windows: [
        ...current.windows,
        {
          id,
          title:
            app?.name ??
            `Untitled window ${current.windows.filter((item) => item.kind === 'empty').length + 1}`,
          kind: 'empty',
          appId: app?.id,
          x: clamp(
            canvas.scrollLeft + Math.max(20, (view.width - 360) / 2) + offset,
            0,
            current.width - 360,
          ),
          y: clamp(
            canvas.scrollTop + Math.max(80, (view.height - 260) / 2) + offset,
            0,
            current.height - 260,
          ),
          width: 360,
          height: 260,
        },
      ],
    }))
    setActiveId(id)
  }

  function openLauncher(mode: 'apps' | 'gestures') {
    closeTopPanels()
    setLauncher((current) => (current === mode ? null : mode))
    setShowMap(false)
    setSpaceHeld(false)
  }

  function closeLauncher() {
    setLauncher(null)
    launcherTrigger.current?.focus({ preventScroll: true })
  }

  function launchApp(app: LauncherApp) {
    addWindow(app)
    closeLauncher()
    setTool('pan')
    setSelectedIds([])
  }

  function openNotificationTarget(target: NotificationTarget) {
    closeTopPanels()
    setLauncher(null)
    setShowMap(false)
    setTool('pan')
    setSelectedIds([])
    const item = workspace.windows.find(
      (entry) =>
        entry.appId === target ||
        (target === 'notes' && entry.kind === 'notes'),
    )
    if (!item) {
      addWindow(APP_CATALOG.find((app) => app.id === target))
      return
    }
    focusWindow(item.id)
    viewport.current?.scrollTo({
      left: clamp(
        item.x - Math.max(12, (view.width - item.width) / 2),
        0,
        Math.max(0, workspace.width - view.width),
      ),
      top: clamp(
        item.y - Math.max(96, (view.height - item.height) / 2),
        0,
        Math.max(0, workspace.height - view.height),
      ),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  }

  function goHome() {
    viewport.current?.scrollTo(home.x, home.y)
  }

  return (
    <main className={styles.desktop}>
      <SystemBar
        openPanel={systemPanel}
        onPanelChange={(panel) => {
          setSystemPanel(panel)
          if (panel) {
            setNotificationsOpen(false)
            setLauncher(null)
            setShowMap(false)
          }
        }}
      />
      <NotificationInbox
        open={notificationsOpen}
        previewVisible={!systemPanel && !launcher && !showMap}
        onToggle={() => {
          setNotificationsOpen(!notificationsOpen)
          setSystemPanel(null)
          setLauncher(null)
          setShowMap(false)
          setSpaceHeld(false)
        }}
        onClose={() => setNotificationsOpen(false)}
        onNavigate={openNotificationTarget}
      />
      <div
        ref={viewport}
        className={`${styles.viewport} ${spaceHeld ? styles.panReady : ''} ${dragging ? styles.dragging : ''} ${tool === 'lasso' && !spaceHeld ? styles.selecting : ''}`}
        data-canvas-viewport
        onScroll={(event) => {
          const { scrollLeft: x, scrollTop: y } = event.currentTarget
          setView((current) => ({ ...current, x, y }))
        }}
        onPointerDownCapture={(event) => {
          if (event.button === 1 || spaceHeld) startGesture(event, 'pan')
          else if (tool === 'lasso') startGesture(event, 'lasso')
        }}
        onPointerDown={(event) => {
          if (!(event.target as HTMLElement).closest('[data-window-id]'))
            startGesture(event, 'pan')
        }}
        onPointerMove={(event) => {
          if (gesture.current?.pointerId !== event.pointerId) return
          latestPointer.current = { x: event.clientX, y: event.clientY }
          applyGesture(event.clientX, event.clientY)
        }}
        onPointerUp={endGesture}
        onPointerCancel={endGesture}
        onLostPointerCapture={endGesture}
        onAuxClick={(event) => event.preventDefault()}
      >
        <div
          className={styles.world}
          style={{ width: workspace.width, height: workspace.height }}
        >
          {workspace.windows.map((item, index) => {
            const app = APP_CATALOG.find((entry) => entry.id === item.appId)
            const Icon =
              app?.icon ??
              (item.kind === 'welcome'
                ? Flame
                : item.kind === 'notes'
                  ? StickyNote
                  : PanelsTopLeft)
            return (
              <section
                key={item.id}
                data-window-id={item.id}
                data-active={activeId === item.id}
                data-selected={selectedIds.includes(item.id)}
                className={`${styles.window} ${styles[item.kind]}`}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  zIndex: index + 1,
                }}
                onPointerDown={(event) => {
                  if (!(event.target as Element).closest('button'))
                    focusWindow(item.id)
                }}
              >
                <header
                  className={styles.titlebar}
                  onPointerDown={(event) => {
                    if (!(event.target as HTMLElement).closest('button'))
                      startGesture(event, 'move', item)
                  }}
                  onDoubleClick={(event) => {
                    if (!(event.target as HTMLElement).closest('button'))
                      maximize(item)
                  }}
                >
                  <span className={styles.windowTitle}>
                    <Icon size={15} strokeWidth={1.7} />
                    <span>{item.title}</span>
                  </span>
                  <div className={styles.windowActions}>
                    <button
                      title={
                        item.restore ? 'Restore window' : 'Maximize window'
                      }
                      aria-label={`${item.restore ? 'Restore' : 'Maximize'} ${item.title}`}
                      onClick={() => maximize(item)}
                    >
                      <Maximize2 size={12} />
                    </button>
                    <button
                      title="Close window"
                      aria-label={`Close ${item.title}`}
                      onClick={() =>
                        setWorkspace((current) => ({
                          ...current,
                          windows: current.windows.filter(
                            (entry) => entry.id !== item.id,
                          ),
                        }))
                      }
                    >
                      <X size={15} />
                    </button>
                  </div>
                </header>
                <div className={styles.windowBody}>
                  {item.kind === 'welcome' ? (
                    <div className={styles.welcomeContent}>
                      <div className={styles.welcomeMark}>
                        <Flame size={25} strokeWidth={1.4} />
                      </div>
                      <span className={styles.smallLabel}>
                        A DIFFERENT KIND OF DESKTOP
                      </span>
                      <h2>Make yourself at home.</h2>
                      <p>
                        Your ideas don’t have to fit in one screen.
                        <br />
                        There’s a whole space to explore.
                      </p>
                      <div className={styles.welcomeFooter}>
                        <span>
                          <Hand size={14} /> Drag the background to wander
                        </span>
                        <ArrowUpRight size={17} />
                      </div>
                    </div>
                  ) : item.kind === 'notes' ? (
                    <div className={styles.noteContent}>
                      <span className={styles.smallLabel}>
                        A WORK IN PROGRESS
                      </span>
                      <textarea
                        aria-label="Your thoughts"
                        spellCheck={false}
                        value={workspace.note}
                        onChange={(event) => {
                          const note = event.target.value
                          setWorkspace((current) => ({ ...current, note }))
                        }}
                      />
                      <span className={styles.noteFooter}>
                        <span /> Just for you. Saved on this device.
                      </span>
                    </div>
                  ) : (
                    <div className={styles.emptyContent}>
                      <div className={styles.emptyMark}>
                        <Icon size={29} strokeWidth={1.1} />
                      </div>
                      <h2>{app?.name ?? 'A little possibility.'}</h2>
                      <p>
                        {app ? app.description : 'Anything could live here.'}
                      </p>
                      <span className={styles.emptyCaption}>
                        {app ? 'APP PREVIEW' : 'MOVE ME. RESIZE ME. MAKE ROOM.'}
                      </span>
                    </div>
                  )}
                </div>
                {!item.restore &&
                  edges.map((edge) => (
                    <div
                      key={edge}
                      data-resize={edge}
                      className={`${styles.resizeHandle} ${styles[`resize${edge}`]}`}
                      onPointerDown={(event) =>
                        startGesture(event, 'resize', item, edge)
                      }
                    />
                  ))}
                {!item.restore && (
                  <ArrowDownRight className={styles.resizeHint} size={12} />
                )}
              </section>
            )
          })}
          {selection && (
            <div
              className={styles.selection}
              style={{
                left: selection.x,
                top: selection.y,
                width: selection.width,
                height: selection.height,
                zIndex: workspace.windows.length + 1,
              }}
            />
          )}
        </div>
      </div>
      <div className={styles.docks}>
        <CanvasTools
          mode={tool}
          showHint={!showMap && !launcher && !notificationsOpen && !systemPanel}
          onModeChange={(mode) => {
            closeTopPanels()
            setTool(mode)
            if (mode === 'pan') setSelectedIds([])
            setShowMap(false)
            setLauncher(null)
          }}
          mapOpen={showMap}
          onToggleMap={() => {
            closeTopPanels()
            setShowMap(!showMap)
            setLauncher(null)
          }}
          onArrange={arrangeAllWindows}
          windowCount={workspace.windows.length}
          selectedCount={selectedIds.length}
        />
        <nav
          className={styles.launchDock}
          aria-label="App launcher"
          data-launcher-trigger
        >
          <button
            ref={launcherTrigger}
            title="Browse and search apps (Ctrl / ⌘ K)"
            aria-label="Open app launcher"
            aria-expanded={launcher === 'apps'}
            onClick={() => openLauncher('apps')}
          >
            <LayoutGrid size={19} />
            <span>Apps</span>
          </button>
          <span className={styles.dockDivider} />
          <button
            title="Draw to launch (G)"
            aria-label="Open gesture launcher"
            aria-expanded={launcher === 'gestures'}
            onClick={() => openLauncher('gestures')}
          >
            <Spline size={19} />
            <span>Draw</span>
          </button>
        </nav>
      </div>
      {launcher && (
        <AppLauncher
          mode={launcher}
          onModeChange={setLauncher}
          onClose={closeLauncher}
          onLaunch={launchApp}
        />
      )}
      {showMap && (
        <aside className={styles.mapPanel}>
          <div className={styles.panelHeading}>
            <h2>
              <Scan size={14} /> Your space
            </h2>
            <span>{workspace.windows.length} windows</span>
          </div>
          <Minimap
            workspace={workspace}
            view={view}
            onNavigate={(x, y) => viewport.current?.scrollTo(x, y)}
          />
          <div className={styles.mapFooter}>
            <span>Drag the map to explore</span>
            <button onClick={goHome}>
              <RotateCcw size={12} /> Home
            </button>
          </div>
        </aside>
      )}
    </main>
  )
}

export default App
