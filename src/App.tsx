import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import {
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  PanelsTopLeft,
  RotateCcw,
  StickyNote,
  X,
} from 'lucide-react'
import SystemBar, { type SystemPanel } from './components/SystemBar'
import NotificationInbox, {
  type NotificationInboxHandle,
  type NotificationTarget,
} from './components/NotificationInbox'
import Minimap from './components/Minimap'
import CanvasTools from './components/CanvasTools'
import DesktopItems from './components/DesktopItems'
import AppLauncher from './components/AppLauncher'
import LauncherDock from './components/LauncherDock'
import AppIcon from './components/AppIcon'
import WindowContent from './components/WindowContent'
import { APP_CATALOG, type LauncherApp } from './components/launcher-apps'
import {
  arrangeWindows,
  CANVAS_TOOL_STORAGE_KEY,
  clamp,
  loadCanvasTool,
  loadWorkspace,
  MIN_HEIGHT,
  MIN_WIDTH,
  resizeBounds,
  STORAGE_KEY,
  type Bounds,
  type DesktopWindow,
  type DesktopItem,
} from './desktop'
import styles from './App.module.css'
import {
  ACCENT_THEMES,
  loadAccentTheme,
  loadAppPresentation,
  saveAccentTheme,
  saveAppPresentation,
  type AccentThemeId,
  type AppPresentation,
} from './theme'

type Gesture = {
  pointerId: number
  type: 'pan' | 'move' | 'resize' | 'lasso' | 'item-select' | 'item-move'
  startX: number
  startY: number
  scrollX: number
  scrollY: number
  id?: string
  bounds?: Bounds
  edge?: string
  items?: DesktopItem[]
  selectedItemIds?: string[]
  moved?: boolean
}

const edges = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw']

function App() {
  const [accentTheme, setAccentTheme] = useState(loadAccentTheme)
  const [appPresentation, setAppPresentation] = useState(loadAppPresentation)
  const accent =
    ACCENT_THEMES.find((theme) => theme.id === accentTheme) ?? ACCENT_THEMES[0]
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
  const [tool, setTool] = useState(loadCanvasTool)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [selection, setSelection] = useState<
    (Bounds & { target: 'windows' | 'items' }) | null
  >(null)
  const [launcher, setLauncher] = useState<'apps' | 'gestures' | null>(null)
  const [editingGestures, setEditingGestures] = useState(false)
  const [dockAppId, setDockAppId] = useState<string | null>(null)
  const [revealRequest, setRevealRequest] = useState<{
    id: string
    left: number
    top: number
  } | null>(null)
  const launcherTrigger = useRef<HTMLButtonElement>(null)
  const notificationInbox = useRef<NotificationInboxHandle>(null)
  const windowElements = useRef(new Map<string, HTMLElement>())
  const viewport = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const captureTarget = useRef<Element | null>(null)
  const latestPointer = useRef({ x: 0, y: 0 })
  const home = workspace.home
  const windowClearance =
    view.width <= 760
      ? { side: 12, top: 84, bottom: 142 }
      : { side: 24, top: 96, bottom: 96 }
  const focusedWindowId = workspace.windows.some((item) => item.id === activeId)
    ? activeId
    : (workspace.windows.at(-1)?.id ?? null)

  const closePopovers = useCallback(() => {
    setNotificationsOpen(false)
    setSystemPanel(null)
    setDockAppId(null)
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
    setSelectedItemIds([])
    setShowMap(false)
    setLauncher(null)
    closePopovers()
    setWorkspace((current) => arrangeWindows(current, origin))
  }, [closePopovers])

  useLayoutEffect(() => {
    viewport.current?.scrollTo(home.x, home.y)
  }, [home.x, home.y])

  useLayoutEffect(() => {
    if (!revealRequest) return
    // Focus after restacking so React's focus restoration cannot cancel the pan.
    windowElements.current.get(revealRequest.id)?.focus({ preventScroll: true })
    viewport.current?.scrollTo({
      left: revealRequest.left,
      top: revealRequest.top,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
  }, [revealRequest])

  useEffect(() => {
    try {
      localStorage.setItem(CANVAS_TOOL_STORAGE_KEY, tool)
    } catch {
      /* Keep the selected tool usable when storage is unavailable. */
    }
  }, [tool])

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
        setEditingGestures(false)
        if (launcher === 'apps')
          launcherTrigger.current?.focus({ preventScroll: true })
        setShowMap(false)
        closePopovers()
        return
      }
      if (event.key === 'Escape') {
        setShowMap(false)
        setLauncher(null)
        closePopovers()
        setSelectedIds([])
        setSelectedItemIds([])
        setSelection(null)
        if (
          gesture.current?.type === 'lasso' ||
          gesture.current?.type === 'item-select'
        ) {
          const pointerId = gesture.current.pointerId
          gesture.current = null
          if (captureTarget.current?.hasPointerCapture(pointerId))
            captureTarget.current.releasePointerCapture(pointerId)
          captureTarget.current = null
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
        closePopovers()
        setTool('pan')
        setSelectedIds([])
        setSelectedItemIds([])
      }
      if (event.key.toLowerCase() === 'v') {
        closePopovers()
        setTool('cursor')
        setSelectedIds([])
        setShowMap(false)
      }
      if (event.key.toLowerCase() === 'l') {
        closePopovers()
        setTool('lasso')
        setSelectedItemIds([])
        setShowMap(false)
      }
      if (event.key.toLowerCase() === 'm') {
        closePopovers()
        setShowMap((current) => !current)
      }
      if (event.key.toLowerCase() === 'g') {
        closePopovers()
        setEditingGestures(false)
        setLauncher('gestures')
        setShowMap(false)
      }
      if (event.key.toLowerCase() === 'n') {
        setDockAppId(null)
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
  }, [home.x, home.y, launcher, closePopovers, arrangeAllWindows])

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
    if (current.type === 'lasso' || current.type === 'item-select') {
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
      const isDesktopSelection = current.type === 'item-select'
      setSelection({
        ...area,
        target: isDesktopSelection ? 'items' : 'windows',
      })
      const ids = (isDesktopSelection ? workspace.items : workspace.windows)
        .filter(
          (item) =>
            item.x < area.x + area.width &&
            item.x + item.width > area.x &&
            item.y < area.y + area.height &&
            item.y + item.height > area.y,
        )
        .map((item) => item.id)
      if (isDesktopSelection)
        setSelectedItemIds([...new Set([...current.selectedItemIds!, ...ids])])
      else setSelectedIds(ids)
      return
    }
    const dx = clientX - current.startX + canvas.scrollLeft - current.scrollX
    const dy = clientY - current.startY + canvas.scrollTop - current.scrollY
    if (current.type === 'item-move') {
      // Move the whole selection by one bounded delta, preserving its spacing.
      if (!current.moved && Math.hypot(dx, dy) < 4) return
      current.moved = true
      const items = current.items!
      const moveX = clamp(
        dx,
        -Math.min(...items.map((item) => item.x)),
        workspace.width - Math.max(...items.map((item) => item.x + item.width)),
      )
      const moveY = clamp(
        dy,
        -Math.min(...items.map((item) => item.y)),
        workspace.height -
          Math.max(...items.map((item) => item.y + item.height)),
      )
      const origins = new Map(items.map((item) => [item.id, item]))
      setWorkspace((previous) => ({
        ...previous,
        items: previous.items.map((item) => {
          const origin = origins.get(item.id)
          return origin
            ? { ...item, x: origin.x + moveX, y: origin.y + moveY }
            : item
        }),
      }))
      return
    }
    const bounds = current.bounds!
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
    if (
      canvas &&
      (gesture.current?.type === 'move' ||
        (gesture.current?.type === 'item-move' && gesture.current.moved))
    ) {
      const { x, y } = latestPointer.current
      const speedX = x < 36 ? -12 : x > window.innerWidth - 36 ? 12 : 0
      const speedY = y < 76 ? -12 : y > window.innerHeight - 36 ? 12 : 0
      if (speedX || speedY) {
        canvas.scrollBy(speedX, speedY)
        applyGesture(x, y)
      }
    }
  })

  // Keep carrying windows or desktop items when the pointer reaches an edge.
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
      gesture.current ||
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
      selectedItemIds:
        type === 'item-select' &&
        (event.shiftKey || event.metaKey || event.ctrlKey)
          ? selectedItemIds
          : [],
    }
    setDragging(type !== 'lasso' && type !== 'item-select')
    if (type === 'lasso' || type === 'item-select') {
      if (type === 'lasso') setSelectedIds([])
      else {
        setSelectedIds([])
        setSelectedItemIds(gesture.current.selectedItemIds!)
      }
      setSelection({
        target: type === 'lasso' ? 'windows' : 'items',
        x: canvas.scrollLeft + event.clientX,
        y: canvas.scrollTop + event.clientY,
        width: 0,
        height: 0,
      })
    }
    if (item) focusWindow(item.id)
  }

  function selectDesktopItem(item: DesktopItem, additive: boolean) {
    setSelectedIds([])
    setSelectedItemIds((current) =>
      additive
        ? current.includes(item.id)
          ? current.filter((id) => id !== item.id)
          : [...current, item.id]
        : [item.id],
    )
  }

  function startItemGesture(
    event: ReactPointerEvent<HTMLButtonElement>,
    item: DesktopItem,
  ) {
    if (event.button !== 0 || gesture.current) return
    if (tool === 'pan') {
      startGesture(event, 'pan')
      return
    }
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    const selected = selectedItemIds.includes(item.id)
    const ids = additive
      ? selected
        ? selectedItemIds.filter((id) => id !== item.id)
        : [...selectedItemIds, item.id]
      : selected
        ? selectedItemIds
        : [item.id]
    setSelectedIds([])
    setSelectedItemIds(ids)
    event.currentTarget.focus({ preventScroll: true })
    if (!ids.includes(item.id)) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    startGesture(event, 'item-move')
    gesture.current!.items = workspace.items.filter((entry) =>
      ids.includes(entry.id),
    )
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
    const { side, top, bottom } = windowClearance
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
          Math.max(MIN_WIDTH, view.width - side * 2),
        )
        const height = Math.min(
          current.height,
          Math.max(MIN_HEIGHT, view.height - top - bottom),
        )
        return {
          ...entry,
          restore: {
            x: entry.x,
            y: entry.y,
            width: entry.width,
            height: entry.height,
          },
          x: clamp(canvas.scrollLeft + side, 0, current.width - width),
          y: clamp(canvas.scrollTop + top, 0, current.height - height),
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
    const width = app?.id === 'settings' ? 420 : 360
    const height = app?.id === 'settings' ? 500 : 260
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
            canvas.scrollLeft + Math.max(20, (view.width - width) / 2) + offset,
            0,
            current.width - width,
          ),
          y: clamp(
            canvas.scrollTop +
              Math.max(80, (view.height - height) / 2) +
              offset,
            0,
            current.height - height,
          ),
          width,
          height,
        },
      ],
    }))
    setActiveId(id)
  }

  function toggleLauncher() {
    closePopovers()
    setEditingGestures(false)
    setLauncher((current) => (current ? null : 'apps'))
    setShowMap(false)
    setSpaceHeld(false)
  }

  function closeLauncher() {
    setEditingGestures(false)
    setLauncher(null)
    launcherTrigger.current?.focus({ preventScroll: true })
  }

  function launchApp(app: LauncherApp) {
    addWindow(app)
    closeLauncher()
    closePopovers()
    setShowMap(false)
    setSpaceHeld(false)
    setSelectedIds([])
    setSelectedItemIds([])
  }

  function revealWindow(id: string) {
    const item = workspace.windows.find((entry) => entry.id === id)
    if (!item) return
    const top = item.restore
      ? windowClearance.top
      : Math.max(windowClearance.top, (view.height - item.height) / 2)
    const left = item.restore
      ? windowClearance.side
      : Math.max(windowClearance.side, (view.width - item.width) / 2)
    closePopovers()
    setLauncher(null)
    setShowMap(false)
    setSelectedIds([])
    setSelectedItemIds([])
    setSpaceHeld(false)
    focusWindow(item.id)
    setRevealRequest({
      id: item.id,
      left: clamp(item.x - left, 0, Math.max(0, workspace.width - view.width)),
      top: clamp(item.y - top, 0, Math.max(0, workspace.height - view.height)),
    })
  }

  function openNotificationTarget(target: NotificationTarget) {
    if (target === 'gestures') {
      closePopovers()
      setShowMap(false)
      setSpaceHeld(false)
      setEditingGestures(true)
      setLauncher('gestures')
      return
    }
    const item = workspace.windows.find(
      (entry) =>
        entry.appId === target ||
        (target === 'notes' && entry.kind === 'notes'),
    )
    if (item) revealWindow(item.id)
    else {
      const app = APP_CATALOG.find((entry) => entry.id === target)
      if (app) launchApp(app)
    }
  }

  function goHome() {
    viewport.current?.scrollTo(home.x, home.y)
  }

  function changeAccentTheme(theme: AccentThemeId) {
    setAccentTheme(theme)
    saveAccentTheme(theme)
  }

  function changeAppPresentation(mode: AppPresentation) {
    setAppPresentation(mode)
    saveAppPresentation(mode)
  }

  return (
    <main
      className={styles.desktop}
      data-accent={accentTheme}
      data-presentation={appPresentation}
      style={{ '--accent': accent.color } as CSSProperties}
    >
      <SystemBar
        openPanel={systemPanel}
        onPanelChange={(panel) => {
          setSystemPanel(panel)
          if (panel) {
            setDockAppId(null)
            setNotificationsOpen(false)
            setLauncher(null)
            setShowMap(false)
          }
        }}
      />
      <NotificationInbox
        ref={notificationInbox}
        open={notificationsOpen}
        previewVisible={!systemPanel && !launcher && !showMap && !dockAppId}
        onToggle={() => {
          setNotificationsOpen(!notificationsOpen)
          setDockAppId(null)
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
        className={`${styles.viewport} ${tool === 'cursor' ? styles.cursorReady : ''} ${spaceHeld ? styles.panReady : ''} ${dragging ? styles.dragging : ''} ${tool === 'lasso' && !spaceHeld ? styles.selecting : ''}`}
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
          if (
            !(event.target as HTMLElement).closest(
              '[data-window-id], [data-desktop-item-id]',
            )
          ) {
            closePopovers()
            startGesture(event, tool === 'cursor' ? 'item-select' : 'pan')
          }
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
          <DesktopItems
            items={workspace.items}
            selectedIds={selectedItemIds}
            onPointerDown={startItemGesture}
            onSelect={selectDesktopItem}
            onOpen={(item) => {
              const app = APP_CATALOG.find((entry) => entry.id === item.appId)
              if (app) launchApp(app)
            }}
          />
          {workspace.windows.map((item, index) => {
            const app = APP_CATALOG.find((entry) => entry.id === item.appId)
            const appId =
              app?.id ??
              (item.kind === 'notes'
                ? 'notes'
                : item.kind === 'welcome'
                  ? 'workspace-welcome'
                  : 'workspace-windows')
            const Icon =
              app?.icon ?? (item.kind === 'notes' ? StickyNote : PanelsTopLeft)
            return (
              <section
                key={item.id}
                ref={(element) => {
                  if (element) windowElements.current.set(item.id, element)
                  else windowElements.current.delete(item.id)
                }}
                tabIndex={-1}
                aria-label={item.title}
                data-window-id={item.id}
                data-app-id={appId}
                data-external={
                  appId !== 'settings' && !appId.startsWith('workspace-')
                }
                data-active={focusedWindowId === item.id}
                data-selected={selectedIds.includes(item.id)}
                className={styles.window}
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
                  {appPresentation === 'realistic' && appId === 'files' && (
                    <span
                      className={styles.nativeNavigation}
                      aria-hidden="true"
                    >
                      <ChevronLeft size={17} />
                      <ChevronRight size={17} />
                    </span>
                  )}
                  <span className={styles.windowTitle}>
                    <span className={styles.windowAppIcon}>
                      <AppIcon
                        appId={appId}
                        icon={Icon}
                        size={15}
                        strokeWidth={1.7}
                      />
                    </span>
                    <span className={styles.windowName}>{item.title}</span>
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
                  {appPresentation === 'realistic' && appId === 'notes' && (
                    <div className={styles.nativeMenu} aria-hidden="true">
                      <span>File</span>
                      <span>Edit</span>
                      <span>View</span>
                      <span>Search</span>
                    </div>
                  )}
                  <WindowContent
                    item={item}
                    workspace={workspace}
                    accentTheme={accentTheme}
                    onAccentThemeChange={changeAccentTheme}
                    appPresentation={appPresentation}
                    onAppPresentationChange={changeAppPresentation}
                    onNoteChange={(note) =>
                      setWorkspace((current) => ({ ...current, note }))
                    }
                  />
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
                zIndex:
                  selection.target === 'items'
                    ? 0
                    : workspace.windows.length + 1,
              }}
            />
          )}
        </div>
      </div>
      <div className={styles.docks}>
        <CanvasTools
          mode={tool}
          showHint={
            !showMap &&
            !launcher &&
            !notificationsOpen &&
            !systemPanel &&
            !dockAppId
          }
          onModeChange={(mode) => {
            closePopovers()
            setTool(mode)
            if (mode !== 'lasso') setSelectedIds([])
            if (mode !== 'cursor') setSelectedItemIds([])
            setShowMap(false)
            setLauncher(null)
          }}
          onOpenToolMenu={() => {
            closePopovers()
            setShowMap(false)
            setLauncher(null)
          }}
          mapOpen={showMap}
          onToggleMap={() => {
            closePopovers()
            setShowMap(!showMap)
            setLauncher(null)
          }}
          onArrange={arrangeAllWindows}
          windowCount={workspace.windows.length}
          selectedCount={selectedIds.length}
        />
        <LauncherDock
          open={launcher !== null}
          triggerRef={launcherTrigger}
          onToggle={toggleLauncher}
          onLaunch={launchApp}
          windows={workspace.windows}
          activeWindowId={focusedWindowId}
          selectedAppId={dockAppId}
          onSelectApp={(id) => {
            closePopovers()
            setDockAppId(id)
            setLauncher(null)
            setShowMap(false)
            setSpaceHeld(false)
          }}
          onFocusWindow={revealWindow}
          onReorderWindows={(orderedIds) => {
            const order = new Map(orderedIds.map((id, index) => [id, index]))
            setWorkspace((current) => ({
              ...current,
              windows: current.windows.map((item) => {
                const dockOrder = order.get(item.id)
                return dockOrder === undefined ? item : { ...item, dockOrder }
              }),
            }))
          }}
        />
      </div>
      {launcher && (
        <AppLauncher
          mode={launcher}
          editingGestures={editingGestures}
          onModeChange={(mode) => {
            setEditingGestures(false)
            setLauncher(mode)
          }}
          onCustomizeGestures={() => {
            closePopovers()
            setLauncher(null)
            setEditingGestures(false)
            setShowMap(false)
            setSpaceHeld(false)
            notificationInbox.current?.showGestureSettings()
            setNotificationsOpen(true)
          }}
          onClose={closeLauncher}
          onLaunch={launchApp}
        />
      )}
      {showMap && (
        <aside className={styles.mapPanel}>
          <div className={styles.panelHeading}>
            <h2>Overview</h2>
            <span>{workspace.windows.length} open windows</span>
          </div>
          <Minimap
            workspace={workspace}
            view={view}
            onNavigate={(x, y) => viewport.current?.scrollTo(x, y)}
          />
          <div className={styles.mapFooter}>
            <span>Drag to explore</span>
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
