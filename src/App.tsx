import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  Compass,
  Expand,
  Flame,
  Hand,
  Map,
  Maximize2,
  MousePointer2,
  MoveUpRight,
  PanelsTopLeft,
  Plus,
  RotateCcw,
  Scan,
  StickyNote,
  X,
} from 'lucide-react'
import SystemBar from './components/SystemBar'
import Minimap from './components/Minimap'
import {
  clamp,
  createWorkspace,
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
  type: 'pan' | 'move' | 'resize'
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
  const [showHelp, setShowHelp] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const captureTarget = useRef<Element | null>(null)
  const latestPointer = useRef({ x: 0, y: 0 })
  const home = workspace.home

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
      if (event.key === 'Escape') {
        setShowHelp(false)
        setShowMap(false)
      }
      if (
        event.target instanceof HTMLElement &&
        event.target.closest('input, textarea, [contenteditable="true"]')
      )
        return
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
  }, [home.x, home.y])

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

  // Keep carrying a window when its pointer reaches the edge of the screen.
  useEffect(() => {
    if (!dragging) return
    let frame: number
    const tick = () => {
      const canvas = viewport.current
      const current = gesture.current
      if (canvas && current && current.type === 'move') {
        const { x, y } = latestPointer.current
        const speedX = x < 36 ? -12 : x > window.innerWidth - 36 ? 12 : 0
        const speedY = y < 76 ? -12 : y > window.innerHeight - 36 ? 12 : 0
        if (speedX || speedY) {
          canvas.scrollBy(speedX, speedY)
          applyGesture(x, y)
        }
      }
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
    if (item) focusWindow(item.id)
  }

  function endGesture(event: ReactPointerEvent) {
    if (gesture.current?.pointerId !== event.pointerId) return
    gesture.current = null
    setDragging(false)
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
          Math.max(MIN_HEIGHT, view.height - 160),
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
          y: clamp(canvas.scrollTop + 76, 0, current.height - height),
          width,
          height,
        }
      }),
    }))
    focusWindow(item.id)
  }

  function addWindow() {
    const canvas = viewport.current!
    const id = crypto.randomUUID()
    const offset = (workspace.windows.length % 5) * 24
    setWorkspace((current) => ({
      ...current,
      windows: [
        ...current.windows,
        {
          id,
          title: `Untitled window ${current.windows.filter((item) => item.kind === 'empty').length + 1}`,
          kind: 'empty',
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

  function goHome() {
    viewport.current?.scrollTo(home.x, home.y)
  }
  function reset() {
    setWorkspace((current) => ({ ...createWorkspace(), note: current.note }))
    setActiveId('welcome')
    setShowMap(false)
    goHome()
  }

  return (
    <main className={styles.desktop}>
      <SystemBar
        onReset={reset}
        onHome={goHome}
        onNewWindow={addWindow}
        windowCount={workspace.windows.length}
      />
      <div
        ref={viewport}
        className={`${styles.viewport} ${spaceHeld ? styles.panReady : ''} ${dragging ? styles.dragging : ''}`}
        data-canvas-viewport
        onScroll={(event) => {
          const { scrollLeft: x, scrollTop: y } = event.currentTarget
          setView((current) => ({ ...current, x, y }))
        }}
        onPointerDownCapture={(event) => {
          if (event.button === 1 || spaceHeld) startGesture(event, 'pan')
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
            const Icon =
              item.kind === 'welcome'
                ? Flame
                : item.kind === 'notes'
                  ? StickyNote
                  : PanelsTopLeft
            return (
              <section
                key={item.id}
                data-window-id={item.id}
                data-active={activeId === item.id}
                className={`${styles.window} ${styles[item.kind]}`}
                style={{
                  left: item.x,
                  top: item.y,
                  width: item.width,
                  height: item.height,
                  zIndex: index + 1,
                }}
                onPointerDown={() => focusWindow(item.id)}
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
                        <PanelsTopLeft size={29} strokeWidth={1.1} />
                      </div>
                      <h2>A little possibility.</h2>
                      <p>Anything could live here.</p>
                      <span className={styles.emptyCaption}>
                        MOVE ME. RESIZE ME. MAKE ROOM.
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
        </div>
      </div>
      <div className={styles.toolbar}>
        <button className={styles.newWindow} onClick={addWindow}>
          <Plus size={17} />
          <span>New window</span>
        </button>
        <span className={styles.toolbarDivider} />
        <button
          title="Space overview"
          aria-label="Toggle space overview"
          aria-pressed={showMap}
          onClick={() => {
            setShowMap(!showMap)
            setShowHelp(false)
          }}
        >
          <Map size={17} />
        </button>
        <button
          title="How to explore"
          aria-label="How to explore"
          aria-pressed={showHelp}
          onClick={() => {
            setShowHelp(!showHelp)
            setShowMap(false)
          }}
        >
          <Compass size={17} />
        </button>
      </div>
      {showHelp && (
        <aside className={styles.help}>
          <div className={styles.panelHeading}>
            <h2>Around your space</h2>
            <button aria-label="Close help" onClick={() => setShowHelp(false)}>
              <X size={15} />
            </button>
          </div>
          <p>
            <Hand size={17} />
            <span>
              <strong>Wander</strong>Drag the background or scroll in any
              direction.
            </span>
          </p>
          <p>
            <MousePointer2 size={17} />
            <span>
              <strong>Move a window</strong>Grab its title bar. Drag to the
              screen’s edge to keep going.
            </span>
          </p>
          <p>
            <Expand size={17} />
            <span>
              <strong>Make room</strong>Drag any edge or corner to resize.
            </span>
          </p>
          <p>
            <MoveUpRight size={17} />
            <span>
              <strong>Pan from anywhere</strong>Hold Space and drag, or use the
              middle mouse button.
            </span>
          </p>
          <div className={styles.helpFoot}>
            <kbd>Home</kbd> Back to where you started
          </div>
        </aside>
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
