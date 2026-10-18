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
  Minimize2,
  PanelsTopLeft,
  StickyNote,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react'
import SystemBar, { type SystemPanel } from './components/SystemBar'
import NotificationInbox, {
  type NotificationTarget,
} from './components/NotificationInbox'
import Minimap from './components/Minimap'
import CanvasTools from './components/CanvasTools'
import DesktopItems from './components/DesktopItems'
import DrawingLayer from './components/DrawingLayer'
import DrawingActions from './components/DrawingActions'
import { recognizeGesture } from './gesture-recognition'
import {
  addDrawingStroke,
  MAX_DRAWING_STROKES,
  type DrawingLayerName,
} from './drawings'
import AppLauncher from './components/AppLauncher'
import LauncherDock from './components/LauncherDock'
import AppIcon from './components/AppIcon'
import WindowContent from './components/WindowContent'
import type { SettingsNavigationRequest } from './components/Settings'
import GatherWindows from './components/GatherWindows'
import WindowSwitcher from './components/WindowSwitcher'
import {
  animateWindowReveal,
  captureWindowPreview,
  type PreviewSnapshot,
} from './preview-motion'
import CanvasSearch from './components/CanvasSearch'
import {
  getCanvasSearchLayout,
  getWindowSwitcherLayout,
  type CanvasSearchResult,
} from './canvas-search'
import { APP_CATALOG, type LauncherApp } from './components/launcher-apps'
import {
  arrangeWindows,
  CANVAS_TOOL_STORAGE_KEY,
  clamp,
  loadCanvasTool,
  loadWindowSelectionShape,
  loadWorkspace,
  MIN_WIDTH,
  resizeBounds,
  STORAGE_KEY,
  WINDOW_SELECTION_STORAGE_KEY,
  type Bounds,
  type DesktopWindow,
  type DesktopItem,
  type WindowSelectionShape,
} from './desktop'
import { polygonIntersectsBounds, type SelectionPoint } from './selection'
import useBackground from './useBackground'
import useAI from './useAI'
import useShellPeek from './useShellPeek'
import useWindowSwitcher from './useWindowSwitcher'
import { gatherRelatedWindows } from './gather-windows'
import { getMaximizedBounds, getWindowClearance } from './window-layout'
import {
  loadGestureShortcuts,
  saveGestureShortcuts,
  type GestureShortcut,
  type GesturePoint,
} from './gestures'
import styles from './App.module.css'
import shellStyles from './components/ShellControls.module.css'
import {
  ACCENT_THEMES,
  loadAccentTheme,
  loadColorMode,
  loadShowBatteryPercentage,
  saveAccentTheme,
  saveColorMode,
  saveShowBatteryPercentage,
  type AccentThemeId,
  type ColorMode,
} from './theme'

type Gesture = {
  pointerId: number
  type:
    | 'pan'
    | 'move'
    | 'resize'
    | 'window-select'
    | 'item-select'
    | 'item-move'
    | 'draw'
    | 'drawing-move'
  startX: number
  startY: number
  scrollX: number
  scrollY: number
  id?: string
  bounds?: Bounds
  edge?: string
  items?: DesktopItem[]
  windows?: DesktopWindow[]
  selectedItemIds?: string[]
  moved?: boolean
  selectionShape?: WindowSelectionShape
  points?: SelectionPoint[]
  drawingLayer?: DrawingLayerName
}

const edges = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw']

function App() {
  const background = useBackground()
  const ai = useAI()
  const [accentTheme, setAccentTheme] = useState(loadAccentTheme)
  const [colorMode, setColorMode] = useState(loadColorMode)
  const [gestureShortcuts, setGestureShortcuts] = useState(loadGestureShortcuts)
  const [showBatteryPercentage, setShowBatteryPercentage] = useState(
    loadShowBatteryPercentage,
  )
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
  const [focusView, setFocusView] = useState<{
    id: string
    x: number
    y: number
  } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [systemPanel, setSystemPanel] = useState<SystemPanel>(null)
  const [tool, setTool] = useState(loadCanvasTool)
  const [drawingLayer, setDrawingLayer] = useState<DrawingLayerName>('above')
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null,
  )
  const [drawingDraft, setDrawingDraft] = useState<{
    points: GesturePoint[]
    layer: DrawingLayerName
  } | null>(null)
  const [consumingDrawingIds, setConsumingDrawingIds] = useState<string[]>([])
  const [drawingLaunchId, setDrawingLaunchId] = useState<string | null>(null)
  const drawingLaunchTimers = useRef(new Set<number>())
  useEffect(() => {
    const timers = drawingLaunchTimers.current
    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [])
  const selectedDrawing = workspace.drawings.find(
    (item) => item.id === selectedDrawingId,
  )
  const [switcherOrigin, setSwitcherOrigin] = useState({ x: view.x, y: view.y })
  const [canvasSearch, setCanvasSearch] = useState<{
    x: number
    y: number
    anchor: { x: number; y: number }
    query: string
    selected: number
  } | null>(null)
  const searchLayout = canvasSearch
    ? getCanvasSearchLayout(
        workspace,
        { ...view, x: canvasSearch.x, y: canvasSearch.y },
        canvasSearch.anchor,
        canvasSearch.query,
      )
    : null
  const searchResult = searchLayout?.results[canvasSearch?.selected ?? 0]
  const [selectionShape, setSelectionShape] = useState(loadWindowSelectionShape)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const selectedWindows = workspace.windows.filter((item) =>
    selectedIds.includes(item.id),
  )
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [selection, setSelection] = useState<
    (Bounds & { target: 'windows' | 'items'; points?: SelectionPoint[] }) | null
  >(null)
  const [launcher, setLauncher] = useState<'apps' | 'gestures' | null>(null)
  const [editingGestures, setEditingGestures] = useState(false)
  const [settingsNavigation, setSettingsNavigation] = useState<{
    windowId: string
    request: SettingsNavigationRequest
  } | null>(null)
  const [dockAppId, setDockAppId] = useState<string | null>(null)
  const [revealRequest, setRevealRequest] = useState<{
    id: string
    left: number
    top: number
    preview?: PreviewSnapshot
    focus?: boolean
  } | null>(null)
  const previewExiting = !!revealRequest?.preview
  const launcherTrigger = useRef<HTMLButtonElement>(null)
  const windowElements = useRef(new Map<string, HTMLElement>())
  useLayoutEffect(() => {
    if (drawingLaunchId)
      windowElements.current
        .get(drawingLaunchId)
        ?.focus({ preventScroll: true })
  }, [drawingLaunchId])
  const viewport = useRef<HTMLDivElement>(null)
  const gesture = useRef<Gesture | null>(null)
  const captureTarget = useRef<Element | null>(null)
  const latestPointer = useRef({ x: 0, y: 0 })
  const home = workspace.home
  const windowClearance = getWindowClearance(view.width)
  const shellPeek = useShellPeek(
    focusView !== null,
    notificationsOpen ||
      systemPanel !== null ||
      showMap ||
      launcher !== null ||
      dockAppId !== null,
  )
  const focusedWindowId = workspace.windows.some((item) => item.id === activeId)
    ? activeId
    : (workspace.windows.at(-1)?.id ?? null)
  const windowSwitcher = useWindowSwitcher({
    windows: workspace.windows,
    activeWindowId: focusedWindowId,
    onCommit: (id) => revealWindow(id, { center: true }),
    onOpen: () => {
      setCanvasSearch(null)
      setNotificationsOpen(false)
      setSystemPanel(null)
      setDockAppId(null)
      setShowMap(false)
      setLauncher(null)
      setRevealRequest(null)
      const canvas = viewport.current
      if (canvas)
        setSwitcherOrigin({ x: canvas.scrollLeft, y: canvas.scrollTop })
      canvas?.scrollTo({
        left: canvas.scrollLeft,
        top: canvas.scrollTop,
        behavior: 'instant',
      })
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
      setDrawingDraft(null)
    },
  })
  const switcherView = { ...view, ...switcherOrigin }
  const switcherLayout = windowSwitcher.open
    ? getWindowSwitcherLayout(workspace, switcherView, windowSwitcher.windows)
    : null
  const previewLayout = switcherLayout ?? searchLayout
  const previewWindowId = windowSwitcher.open
    ? windowSwitcher.selectedId
    : searchResult?.kind === 'window'
      ? searchResult.id
      : null
  const renderedFocusView = windowSwitcher.open ? null : focusView
  const switcherWindow = windowSwitcher.windows.find(
    (item) => item.id === windowSwitcher.selectedId,
  )
  const switcherPlacement = switcherWindow
    ? switcherLayout?.windows.get(switcherWindow.id)
    : undefined

  const closePopovers = useCallback(() => {
    setCanvasSearch(null)
    setNotificationsOpen(false)
    setSystemPanel(null)
    setDockAppId(null)
  }, [setDockAppId])

  const leaveFocusView = useCallback(() => {
    if (!focusView) return
    setRevealRequest(null)
    setWorkspace((current) => ({
      ...current,
      windows: current.windows.map((item) =>
        item.id === focusView.id
          ? {
              ...item,
              ...getMaximizedBounds(
                {
                  ...focusView,
                  width: window.innerWidth,
                  height: window.innerHeight,
                },
                current,
              ),
            }
          : item,
      ),
    }))
    setFocusView(null)
  }, [focusView])

  const openCanvasSearch = useCallback(
    (anchor: { x: number; y: number }) => {
      const canvas = viewport.current
      if (!canvas || document.querySelector(':modal')) return
      leaveFocusView()
      closePopovers()
      setLauncher(null)
      setShowMap(false)
      setSpaceHeld(false)
      setSelection(null)
      setSelectedIds([])
      setSelectedItemIds([])
      setDrawingDraft(null)
      setSelectedDrawingId(null)
      setTool('search')
      setRevealRequest(null)
      const pointerId = gesture.current?.pointerId
      gesture.current = null
      if (
        pointerId !== undefined &&
        captureTarget.current?.hasPointerCapture(pointerId)
      )
        captureTarget.current.releasePointerCapture(pointerId)
      captureTarget.current = null
      setDragging(false)
      const origin = { x: canvas.scrollLeft, y: canvas.scrollTop }
      canvas.scrollTo({ left: origin.x, top: origin.y, behavior: 'instant' })
      setCanvasSearch({ ...origin, anchor, query: '', selected: 0 })
    },
    [
      closePopovers,
      leaveFocusView,
      setLauncher,
      setSelectedIds,
      setSelectedItemIds,
    ],
  )

  const arrangeAllWindows = useCallback(() => {
    setRevealRequest(null)
    const canvas = viewport.current
    if (!canvas) return
    leaveFocusView()
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
    setDrawingDraft(null)
    setSelectedDrawingId(null)
    setSelectedIds([])
    setSelectedItemIds([])
    setShowMap(false)
    setLauncher(null)
    closePopovers()
    setWorkspace((current) => arrangeWindows(current, origin))
  }, [
    closePopovers,
    leaveFocusView,
    setLauncher,
    setSelectedIds,
    setSelectedItemIds,
  ])

  useLayoutEffect(() => {
    viewport.current?.scrollTo(home.x, home.y)
  }, [home.x, home.y])

  useLayoutEffect(() => {
    if (!revealRequest || (focusView && !revealRequest.preview)) return
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    // Focus after restacking so React's focus restoration cannot cancel the pan.
    if (revealRequest.focus !== false)
      windowElements.current
        .get(revealRequest.id)
        ?.focus({ preventScroll: true })
    viewport.current?.scrollTo({
      left: revealRequest.left,
      top: revealRequest.top,
      behavior: revealRequest.preview || reducedMotion ? 'instant' : 'smooth',
    })
    if (!revealRequest.preview) return
    const animations = reducedMotion
      ? []
      : animateWindowReveal(
          windowElements.current,
          revealRequest.preview,
          revealRequest.id,
          { width: view.width, height: view.height },
        )
    let canceled = false
    void Promise.allSettled(
      animations.map((animation) => animation.finished),
    ).then(() => {
      if (!canceled) {
        animations.forEach((animation) => animation.cancel())
        setRevealRequest(null)
      }
    })
    return () => {
      canceled = true
      animations.forEach((animation) => animation.cancel())
    }
  }, [revealRequest, focusView, view.width, view.height])

  useEffect(() => {
    try {
      localStorage.setItem(CANVAS_TOOL_STORAGE_KEY, tool)
    } catch {
      /* Keep the selected tool usable when storage is unavailable. */
    }
  }, [tool])

  useEffect(() => {
    try {
      localStorage.setItem(WINDOW_SELECTION_STORAGE_KEY, selectionShape)
    } catch {
      /* Keep the selected shape usable when storage is unavailable. */
    }
  }, [selectionShape])

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
        if (canvasSearch) {
          event.preventDefault()
          setCanvasSearch(null)
          viewport.current?.focus({ preventScroll: true })
        }
        setShowMap(false)
        setLauncher(null)
        closePopovers()
        setSelectedIds([])
        setSelectedItemIds([])
        setSelection(null)
        setDrawingDraft(null)
        setSelectedDrawingId(null)
        if (
          gesture.current?.type === 'window-select' ||
          gesture.current?.type === 'item-select' ||
          gesture.current?.type === 'draw' ||
          gesture.current?.type === 'drawing-move'
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
        event.target.closest(
          'input, textarea, select, [contenteditable="true"]',
        )
      )
        return
      if (launcher || event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key === '/') {
        event.preventDefault()
        openCanvasSearch({
          x: window.innerWidth / 2,
          y: window.innerHeight / 3,
        })
        return
      }
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
      if (event.key.toLowerCase() === 'l' || event.key.toLowerCase() === 'r') {
        closePopovers()
        setTool('select')
        setSelectionShape(
          event.key.toLowerCase() === 'l' ? 'freeform' : 'rectangle',
        )
        setSelectedItemIds([])
        setShowMap(false)
      }
      if (event.key.toLowerCase() === 'd') {
        closePopovers()
        setTool('draw')
        setSelectedIds([])
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
        if (focusView) return
        if (event.target instanceof Element && event.target.closest('button'))
          return
        event.preventDefault()
        setSpaceHeld(true)
      }
      if (event.code === 'Home') {
        event.preventDefault()
        if (!focusView) viewport.current?.scrollTo(home.x, home.y)
      }
    }
    const release = () => {
      setSpaceHeld(false)
      setDragging(false)
      if (gesture.current?.selectionShape === 'freeform') setSelectedIds([])
      gesture.current = null
      setSelection(null)
      setDrawingDraft(null)
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
  }, [
    home.x,
    home.y,
    launcher,
    closePopovers,
    arrangeAllWindows,
    focusView,
    canvasSearch,
    openCanvasSearch,
  ])

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
    if (focusView && focusView.id !== id) leaveFocusView()
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
    if (!current || !canvas || focusView) return
    if (current.type === 'pan') {
      canvas.scrollTo(
        current.scrollX - clientX + current.startX,
        current.scrollY - clientY + current.startY,
      )
      return
    }
    if (current.type === 'draw') {
      const point = {
        x: clamp(clientX + canvas.scrollLeft, 0, workspace.width),
        y: clamp(clientY + canvas.scrollTop, 0, workspace.height),
      }
      const previous = current.points!.at(-1)!
      if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1) return
      current.points!.push(point)
      if (current.points!.length > 4096)
        current.points = current.points!.filter((_, index) => index % 2 === 0)
      setDrawingDraft({
        points: [...current.points!],
        layer: current.drawingLayer!,
      })
      return
    }
    if (current.type === 'drawing-move') {
      const bounds = current.bounds!
      const dx = clientX - current.startX + canvas.scrollLeft - current.scrollX
      const dy = clientY - current.startY + canvas.scrollTop - current.scrollY
      setWorkspace((previous) => ({
        ...previous,
        drawings: previous.drawings.map((item) =>
          item.id !== current.id
            ? item
            : {
                ...item,
                x: clamp(bounds.x + dx, 0, previous.width - bounds.width),
                y: clamp(bounds.y + dy, 0, previous.height - bounds.height),
              },
        ),
      }))
      return
    }
    if (
      current.type === 'window-select' &&
      current.selectionShape === 'freeform'
    ) {
      const point = {
        x: clamp(clientX + canvas.scrollLeft, 0, workspace.width),
        y: clamp(clientY + canvas.scrollTop, 0, workspace.height),
      }
      const previousPoint = current.points!.at(-1)!
      if (Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) < 2)
        return
      current.points!.push(point)
      // Bound the live stroke while preserving its overall shape on long drags.
      if (current.points!.length > 4096)
        current.points = current.points!.filter((_, index) => index % 2 === 0)
      const points = [...current.points!]
      const x = Math.min(...points.map((entry) => entry.x))
      const y = Math.min(...points.map((entry) => entry.y))
      setSelection({
        target: 'windows',
        x,
        y,
        width: Math.max(...points.map((entry) => entry.x)) - x,
        height: Math.max(...points.map((entry) => entry.y)) - y,
        points,
      })
      setSelectedIds(
        workspace.windows
          .filter((item) => polygonIntersectsBounds(points, item))
          .map((item) => item.id),
      )
      return
    }
    if (current.type === 'window-select' || current.type === 'item-select') {
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
    if (current.type === 'move' && current.windows) {
      // Apply one bounded delta so selected windows keep their spacing.
      const windows = current.windows
      const moveX = clamp(
        dx,
        -Math.min(...windows.map((item) => item.x)),
        workspace.width -
          Math.max(...windows.map((item) => item.x + item.width)),
      )
      const moveY = clamp(
        dy,
        -Math.min(...windows.map((item) => item.y)),
        workspace.height -
          Math.max(...windows.map((item) => item.y + item.height)),
      )
      const origins = new Map(windows.map((item) => [item.id, item]))
      setWorkspace((previous) => ({
        ...previous,
        windows: previous.windows.map((item) => {
          const origin = origins.get(item.id)
          if (!origin) return item
          return {
            ...item,
            x: origin.x + moveX,
            y: origin.y + moveY,
            ...(origin.restore && {
              restore: {
                ...origin.restore,
                x: clamp(
                  origin.restore.x + moveX,
                  0,
                  previous.width - origin.restore.width,
                ),
                y: clamp(
                  origin.restore.y + moveY,
                  0,
                  previous.height - origin.restore.height,
                ),
              },
            }),
          }
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
    if (focusView) return
    const canvas = viewport.current
    if (
      canvas &&
      (gesture.current?.type === 'move' ||
        gesture.current?.type === 'drawing-move' ||
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
    const group =
      type === 'move' &&
      item &&
      selectedWindows.length > 1 &&
      selectedIds.includes(item.id)
        ? selectedWindows
        : undefined
    if (
      focusView ||
      previewLayout ||
      previewExiting ||
      gesture.current ||
      (event.button !== 0 && event.button !== 1) ||
      (item?.restore && type !== 'pan' && !group)
    )
      return
    const canvas = viewport.current!
    setSelectedDrawingId(null)
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
      windows: group,
      edge,
      selectionShape: type === 'window-select' ? selectionShape : undefined,
      points:
        type === 'window-select' && selectionShape === 'freeform'
          ? [
              {
                x: canvas.scrollLeft + event.clientX,
                y: canvas.scrollTop + event.clientY,
              },
            ]
          : undefined,
      selectedItemIds:
        type === 'item-select' &&
        (event.shiftKey || event.metaKey || event.ctrlKey)
          ? selectedItemIds
          : [],
    }
    setDragging(type !== 'window-select' && type !== 'item-select')
    if (type === 'window-select' || type === 'item-select') {
      if (type === 'window-select') setSelectedIds([])
      else {
        setSelectedIds([])
        setSelectedItemIds(gesture.current.selectedItemIds!)
      }
      setSelection({
        target: type === 'window-select' ? 'windows' : 'items',
        points: gesture.current.points,
        x: canvas.scrollLeft + event.clientX,
        y: canvas.scrollTop + event.clientY,
        width: 0,
        height: 0,
      })
    }
    if (item) focusWindow(item.id)
    return gesture.current
  }

  function startDrawing(event: ReactPointerEvent) {
    if (event.button !== 0 || gesture.current) return
    const canvas = viewport.current!
    event.preventDefault()
    event.stopPropagation()
    canvas.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    captureTarget.current = event.currentTarget
    const points = [
      {
        x: clamp(canvas.scrollLeft + event.clientX, 0, workspace.width),
        y: clamp(canvas.scrollTop + event.clientY, 0, workspace.height),
      },
    ]
    const existing =
      selectedDrawing && selectedDrawing.strokes.length < MAX_DRAWING_STROKES
        ? selectedDrawing
        : null
    const layer = existing?.layer ?? drawingLayer
    gesture.current = {
      pointerId: event.pointerId,
      type: 'draw',
      startX: event.clientX,
      startY: event.clientY,
      scrollX: canvas.scrollLeft,
      scrollY: canvas.scrollTop,
      id: existing?.id,
      points,
      drawingLayer: layer,
    }
    setSelectedIds([])
    setSelectedItemIds([])
    setDrawingDraft({ points, layer })
    closePopovers()
  }

  function selectDrawing(id: string) {
    setSelectedDrawingId(id)
    setSelectedIds([])
    setSelectedItemIds([])
    closePopovers()
  }

  function startDrawingMove(
    event: ReactPointerEvent<SVGSVGElement>,
    id: string,
  ) {
    const drawing = workspace.drawings.find((item) => item.id === id)
    if (
      !drawing ||
      tool !== 'cursor' ||
      event.button !== 0 ||
      gesture.current ||
      previewLayout ||
      previewExiting ||
      focusView
    )
      return
    const current = startGesture(event, 'drawing-move')
    if (!current) return
    current.id = id
    current.bounds = drawing
    selectDrawing(id)
  }

  function selectDesktopItem(item: DesktopItem, additive: boolean) {
    setSelectedDrawingId(null)
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
    if (previewLayout || previewExiting) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    if (focusView || event.button !== 0 || gesture.current) return
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
    if (gesture.current.type === 'draw') {
      if (event.type === 'pointerup') {
        applyGesture(event.clientX, event.clientY)
        const current = gesture.current
        const existing =
          workspace.drawings.find((item) => item.id === current.id) ?? null
        const drawing = addDrawingStroke(
          existing,
          current.points!,
          current.drawingLayer!,
          workspace,
        )
        setWorkspace((previous) => ({
          ...previous,
          drawings: existing
            ? previous.drawings.map((item) =>
                item.id === drawing.id ? drawing : item,
              )
            : [...previous.drawings, drawing],
        }))
        setSelectedDrawingId(drawing.id)
      }
      setDrawingDraft(null)
    }
    if (
      gesture.current.type === 'window-select' &&
      gesture.current.selectionShape === 'freeform'
    ) {
      if (event.type === 'pointerup') applyGesture(event.clientX, event.clientY)
      else setSelectedIds([])
    }
    gesture.current = null
    setDragging(false)
    setSelection(null)
    if (captureTarget.current?.hasPointerCapture(event.pointerId))
      captureTarget.current.releasePointerCapture(event.pointerId)
    captureTarget.current = null
  }

  function maximize(item: DesktopWindow) {
    setRevealRequest(null)
    if (focusView?.id === item.id) {
      leaveFocusView()
      return
    }
    const canvas = viewport.current!
    setWorkspace((current) => ({
      ...current,
      windows: current.windows.map((entry) => {
        if (entry.id !== item.id) return entry
        if (entry.restore) {
          const { restore, ...rest } = entry
          return { ...rest, ...restore }
        }
        return {
          ...entry,
          restore: {
            x: entry.x,
            y: entry.y,
            width: entry.width,
            height: entry.height,
          },
          ...getMaximizedBounds(
            {
              x: canvas.scrollLeft,
              y: canvas.scrollTop,
              width: view.width,
              height: view.height,
            },
            current,
          ),
        }
      }),
    }))
    focusWindow(item.id)
  }

  function toggleFocusView(item: DesktopWindow) {
    if (focusView?.id === item.id) {
      leaveFocusView()
      return
    }
    const canvas = viewport.current!
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
    setRevealRequest(null)
    setShowMap(false)
    setLauncher(null)
    closePopovers()
    focusWindow(item.id)
    setWorkspace((current) => ({
      ...current,
      windows: current.windows.map((entry) =>
        entry.id === item.id
          ? {
              ...entry,
              restore: entry.restore ?? {
                x: entry.x,
                y: entry.y,
                width: entry.width,
                height: entry.height,
              },
              ...getMaximizedBounds(
                { ...origin, width: view.width, height: view.height },
                current,
              ),
            }
          : entry,
      ),
    }))
    setView((current) => ({ ...current, ...origin }))
    setFocusView({ id: item.id, ...origin })
    windowElements.current.get(item.id)?.focus({ preventScroll: true })
  }

  function closeWindow(id: string) {
    setRevealRequest(null)
    if (focusView?.id === id) setFocusView(null)
    setWorkspace((current) => ({
      ...current,
      windows: current.windows.filter((entry) => entry.id !== id),
    }))
  }

  function addWindow(app?: LauncherApp, center?: { x: number; y: number }) {
    leaveFocusView()
    const canvas = viewport.current!
    const id = crypto.randomUUID()
    const offset = (workspace.windows.length % 5) * 24
    const width =
      app?.id === 'settings'
        ? Math.max(
            MIN_WIDTH,
            Math.min(680, view.width - windowClearance.side * 2),
          )
        : 360
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
            center
              ? center.x - width / 2
              : canvas.scrollLeft +
                  Math.max(20, (view.width - width) / 2) +
                  offset,
            0,
            current.width - width,
          ),
          y: clamp(
            center
              ? center.y - height / 2
              : canvas.scrollTop +
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
    return id
  }

  function playDrawing() {
    if (!selectedDrawing || consumingDrawingIds.includes(selectedDrawing.id))
      return false
    const match = recognizeGesture(selectedDrawing.strokes, gestureShortcuts)
    const app = APP_CATALOG.find((item) => item.id === match?.appId)
    if (!app) return false
    const drawingId = selectedDrawing.id
    const windowId = addWindow(app, {
      x: selectedDrawing.x + selectedDrawing.width / 2,
      y: selectedDrawing.y + selectedDrawing.height / 2,
    })
    setDrawingLaunchId(windowId)
    setConsumingDrawingIds((current) => [...current, drawingId])
    setSelectedDrawingId(null)
    setTool('cursor')
    const timer = window.setTimeout(() => {
      setWorkspace((current) => ({
        ...current,
        drawings: current.drawings.filter((item) => item.id !== drawingId),
      }))
      setConsumingDrawingIds((current) =>
        current.filter((id) => id !== drawingId),
      )
      setDrawingLaunchId((current) => (current === windowId ? null : current))
      drawingLaunchTimers.current.delete(timer)
    }, 300)
    drawingLaunchTimers.current.add(timer)
    return true
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
    setRevealRequest(null)
    addWindow(app)
    closeLauncher()
    closePopovers()
    setShowMap(false)
    setSpaceHeld(false)
    setSelectedIds([])
    setSelectedItemIds([])
  }

  function revealWindow(id: string, options?: { center: boolean }) {
    const item = workspace.windows.find((entry) => entry.id === id)
    if (!item) return
    const preview =
      previewLayout &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? captureWindowPreview(windowElements.current)
        : undefined
    const top = options?.center
      ? (view.height - item.height) / 2
      : item.restore
        ? windowClearance.top
        : Math.max(windowClearance.top, (view.height - item.height) / 2)
    const left = options?.center
      ? (view.width - item.width) / 2
      : item.restore
        ? windowClearance.side
        : Math.max(windowClearance.side, (view.width - item.width) / 2)
    closePopovers()
    setLauncher(null)
    setShowMap(false)
    setSelectedIds([])
    setSelectedItemIds([])
    setSpaceHeld(false)
    focusWindow(item.id)
    if (focusView?.id === item.id) {
      if (preview)
        setRevealRequest({ id, left: focusView.x, top: focusView.y, preview })
      else windowElements.current.get(item.id)?.focus({ preventScroll: true })
      return
    }
    setRevealRequest({
      id: item.id,
      left: clamp(item.x - left, 0, Math.max(0, workspace.width - view.width)),
      top: clamp(item.y - top, 0, Math.max(0, workspace.height - view.height)),
      preview,
    })
  }

  function activateSearchResult(result: CanvasSearchResult | undefined) {
    if (!result) return
    setCanvasSearch(null)
    if (result.kind === 'window') revealWindow(result.id, { center: true })
    else {
      const item = workspace.items.find((entry) => entry.id === result.id)
      const app = APP_CATALOG.find((entry) => entry.id === item?.appId)
      if (app) launchApp(app)
    }
  }

  function openGestureSettings() {
    const settings = workspace.windows.findLast(
      (item) => item.appId === 'settings',
    )
    const id =
      settings?.id ??
      addWindow(APP_CATALOG.find((app) => app.id === 'settings')!)
    setSettingsNavigation({
      windowId: id,
      request: { id: crypto.randomUUID(), category: 'gestures' },
    })
    if (settings) revealWindow(id, { center: true })
    closePopovers()
    setLauncher(null)
    setEditingGestures(false)
    setShowMap(false)
    setSpaceHeld(false)
  }

  function openNotificationTarget(target: NotificationTarget) {
    if (target === 'gestures') {
      openGestureSettings()
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

  function changeAccentTheme(theme: AccentThemeId) {
    setAccentTheme(theme)
    saveAccentTheme(theme)
  }

  function saveGestureShortcut(
    shortcut: GestureShortcut,
    originalAppId?: string,
  ) {
    const next = [
      shortcut,
      ...gestureShortcuts.filter(
        (item) => item.appId !== shortcut.appId && item.appId !== originalAppId,
      ),
    ]
    setGestureShortcuts(next)
    saveGestureShortcuts(next)
  }

  function removeGestureShortcut(appId: string) {
    const next = gestureShortcuts.filter((item) => item.appId !== appId)
    setGestureShortcuts(next)
    saveGestureShortcuts(next)
  }

  function changeColorMode(mode: ColorMode) {
    setColorMode(mode)
    saveColorMode(mode)
  }

  function changeShowBatteryPercentage(show: boolean) {
    setShowBatteryPercentage(show)
    saveShowBatteryPercentage(show)
  }

  return (
    <main
      className={styles.desktop}
      data-accent={accentTheme}
      data-color-mode={colorMode}
      data-presentation="realistic"
      data-focus-mode={renderedFocusView !== null}
      data-canvas-preview={previewLayout !== null}
      data-preview-exiting={previewExiting}
      data-shell-peek={!renderedFocusView || shellPeek}
      style={{ '--accent-base': accent.color } as CSSProperties}
    >
      {background.photo && background.photo.fit !== 'repeat' && (
        <div
          className={styles.photoBackground}
          data-background-fit={background.photo.fit}
          aria-hidden="true"
          style={{
            backgroundImage: `url("${background.photo.url}")`,
            backgroundSize:
              background.photo.fit === 'stretch'
                ? '100% 100%'
                : background.photo.fit,
          }}
        />
      )}
      <div
        className={`${styles.topbar} ${shellStyles.mobileSurface}`}
        data-shell-controls
        inert={windowSwitcher.open}
      >
        <NotificationInbox
          open={notificationsOpen}
          previewVisible={
            !previewLayout &&
            !systemPanel &&
            !launcher &&
            !showMap &&
            !dockAppId
          }
          onToggle={() => {
            setCanvasSearch(null)
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
        <SystemBar
          showBatteryPercentage={showBatteryPercentage}
          openPanel={systemPanel}
          onPanelChange={(panel) => {
            setCanvasSearch(null)
            setSystemPanel(panel)
            if (panel) {
              setDockAppId(null)
              setNotificationsOpen(false)
              setLauncher(null)
              setShowMap(false)
            }
          }}
        />
      </div>
      <div
        ref={viewport}
        tabIndex={-1}
        role={windowSwitcher.open ? 'listbox' : undefined}
        aria-label={windowSwitcher.open ? 'Switch windows' : undefined}
        aria-activedescendant={
          windowSwitcher.open
            ? `switcher-${windowSwitcher.selectedId}`
            : undefined
        }
        className={`${styles.viewport} ${previewLayout || (!focusView && (tool === 'cursor' || tool === 'search')) ? styles.cursorReady : ''} ${!focusView && spaceHeld ? styles.panReady : ''} ${!focusView && dragging ? styles.dragging : ''} ${!focusView && !previewLayout && (tool === 'select' || tool === 'draw') && !spaceHeld ? styles.selecting : ''}`}
        data-canvas-viewport
        onScroll={(event) => {
          const lockedView =
            previewExiting && revealRequest
              ? { x: revealRequest.left, y: revealRequest.top }
              : windowSwitcher.open
                ? switcherOrigin
                : (focusView ?? canvasSearch)
          if (lockedView) {
            const canvas = event.currentTarget
            const x = clamp(
              lockedView.x,
              0,
              canvas.scrollWidth - canvas.clientWidth,
            )
            const y = clamp(
              lockedView.y,
              0,
              canvas.scrollHeight - canvas.clientHeight,
            )
            if (canvas.scrollLeft !== x || canvas.scrollTop !== y)
              canvas.scrollTo({ left: x, top: y, behavior: 'instant' })
            if (previewExiting)
              setView((current) =>
                current.x === x && current.y === y
                  ? current
                  : { ...current, x, y },
              )
            return
          }
          const { scrollLeft: x, scrollTop: y } = event.currentTarget
          setView((current) => ({ ...current, x, y }))
        }}
        onPointerDownCapture={(event) => {
          if (
            focusView ||
            previewLayout ||
            previewExiting ||
            (event.target as Element).closest('dialog[open]')
          )
            return
          if (event.button === 1 || spaceHeld) startGesture(event, 'pan')
          else if (tool === 'draw' && event.button === 0) startDrawing(event)
          else if (
            tool === 'select' &&
            !(event.target as Element).closest('[data-grouped="true"]')
          )
            startGesture(event, 'window-select')
        }}
        onPointerDown={(event) => {
          if (
            !(event.target as HTMLElement).closest(
              '[data-window-id], [data-desktop-item-id], [data-drawing-id]',
            )
          ) {
            if (windowSwitcher.open) {
              event.preventDefault()
              event.stopPropagation()
              windowSwitcher.cancel()
              return
            }
            if (canvasSearch) {
              setCanvasSearch(null)
              return
            }
            closePopovers()
            if (tool === 'search' && event.button === 0) {
              event.preventDefault()
              openCanvasSearch({ x: event.clientX, y: event.clientY })
            } else
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
          className={`${styles.world} ${background.photo ? styles.customBackground : ''}`}
          data-background-fit={
            background.photo?.fit === 'repeat' ? 'repeat' : undefined
          }
          style={{
            width: workspace.width,
            height: workspace.height,
            backgroundImage:
              background.photo?.fit === 'repeat'
                ? `url("${background.photo.url}")`
                : undefined,
          }}
        >
          <div inert={focusView !== null || windowSwitcher.open}>
            <DesktopItems
              items={workspace.items}
              selectedIds={selectedItemIds}
              placements={previewLayout?.items}
              previewSelectedId={
                searchResult?.kind === 'item' ? searchResult.id : undefined
              }
              onPointerDown={startItemGesture}
              onSelect={selectDesktopItem}
              onOpen={(item) => {
                if (canvasSearch) {
                  activateSearchResult({ kind: 'item', id: item.id })
                  return
                }
                const app = APP_CATALOG.find((entry) => entry.id === item.appId)
                if (app) launchApp(app)
              }}
            />
          </div>
          {!previewLayout && !focusView && (
            <div className={styles.drawingLayer} style={{ zIndex: 0 }}>
              <DrawingLayer
                drawings={workspace.drawings}
                layer="below"
                selectedId={selectedDrawingId}
                consumingIds={consumingDrawingIds}
                draft={drawingDraft ?? undefined}
                interactive={tool === 'cursor' && !previewExiting}
                onPointerDown={startDrawingMove}
                onSelect={selectDrawing}
              />
            </div>
          )}
          {workspace.windows.map((item, index) => {
            const placement = previewLayout?.windows.get(item.id)
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
                data-drawing-launch={
                  !previewLayout &&
                  !previewExiting &&
                  drawingLaunchId === item.id
                }
                data-external={
                  appId !== 'settings' && !appId.startsWith('workspace-')
                }
                data-active={!previewLayout && focusedWindowId === item.id}
                data-focus-mode={renderedFocusView?.id === item.id}
                data-preview-match={placement?.matches}
                data-preview-selected={
                  placement ? previewWindowId === item.id : undefined
                }
                inert={
                  (renderedFocusView !== null &&
                    renderedFocusView.id !== item.id) ||
                  placement?.matches === false
                }
                data-selected={!previewLayout && selectedIds.includes(item.id)}
                data-grouped={
                  selectedWindows.length > 1 && selectedIds.includes(item.id)
                }
                className={styles.window}
                style={{
                  position:
                    renderedFocusView?.id === item.id ? 'fixed' : undefined,
                  left: renderedFocusView?.id === item.id ? 0 : item.x,
                  top: renderedFocusView?.id === item.id ? 0 : item.y,
                  width:
                    renderedFocusView?.id === item.id ? view.width : item.width,
                  height:
                    renderedFocusView?.id === item.id
                      ? view.height
                      : item.height,
                  transform: placement
                    ? `translate(${placement.x - item.x}px, ${placement.y - item.y}px) scale(${placement.scale})`
                    : 'translate(0px, 0px) scale(1)',
                  zIndex:
                    renderedFocusView?.id === item.id
                      ? workspace.windows.length + 1
                      : index + 1,
                }}
                onFocusCapture={() => {
                  if (!previewLayout) focusWindow(item.id)
                }}
                onPointerDown={(event) => {
                  if (
                    !previewLayout &&
                    !(event.target as Element).closest('button')
                  )
                    focusWindow(item.id)
                }}
              >
                <header
                  inert={previewLayout !== null}
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
                  {appId === 'files' && (
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
                        focusView?.id === item.id
                          ? 'Leave focused view'
                          : 'Maximize window'
                      }
                      aria-label={`${focusView?.id === item.id ? 'Leave focused view for' : 'Maximize'} ${item.title}`}
                      onClick={() => toggleFocusView(item)}
                    >
                      {focusView?.id === item.id ? (
                        <Minimize2 size={12} />
                      ) : (
                        <Maximize2 size={12} />
                      )}
                    </button>
                    <button
                      title="Close window"
                      aria-label={`Close ${item.title}`}
                      onClick={() => closeWindow(item.id)}
                    >
                      <X size={15} />
                    </button>
                  </div>
                </header>
                <div
                  className={styles.windowBody}
                  inert={previewLayout !== null}
                >
                  {appId === 'notes' && (
                    <div className={styles.nativeMenu} aria-hidden="true">
                      <span>File</span>
                      <span>Edit</span>
                      <span>View</span>
                      <span>Search</span>
                    </div>
                  )}
                  <WindowContent
                    item={item}
                    settingsNavigation={
                      settingsNavigation?.windowId === item.id
                        ? settingsNavigation.request
                        : undefined
                    }
                    ai={ai}
                    workspace={workspace}
                    accentTheme={accentTheme}
                    colorMode={colorMode}
                    onColorModeChange={changeColorMode}
                    gestureShortcuts={gestureShortcuts}
                    onSaveGestureShortcut={saveGestureShortcut}
                    onRemoveGestureShortcut={removeGestureShortcut}
                    onAccentThemeChange={changeAccentTheme}
                    showBatteryPercentage={showBatteryPercentage}
                    onShowBatteryPercentageChange={changeShowBatteryPercentage}
                    background={background.photo}
                    backgroundBusy={background.busy}
                    backgroundError={background.error}
                    onBackgroundUpload={background.upload}
                    onBackgroundFitChange={background.changeFit}
                    onBackgroundReset={background.reset}
                    onNoteChange={(note) =>
                      setWorkspace((current) => ({ ...current, note }))
                    }
                  />
                </div>
                {!previewLayout &&
                  !item.restore &&
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
                {!previewLayout && !item.restore && (
                  <ArrowDownRight className={styles.resizeHint} size={12} />
                )}
                {placement?.matches && (
                  <button
                    type="button"
                    id={windowSwitcher.open ? `switcher-${item.id}` : undefined}
                    role={windowSwitcher.open ? 'option' : undefined}
                    aria-selected={
                      windowSwitcher.open
                        ? windowSwitcher.selectedId === item.id
                        : undefined
                    }
                    tabIndex={windowSwitcher.open ? -1 : 0}
                    className={styles.previewWindowTarget}
                    aria-label={`Open ${item.title} window`}
                    onPointerDown={(event) => event.preventDefault()}
                    onClick={() =>
                      windowSwitcher.open
                        ? windowSwitcher.select(item.id)
                        : activateSearchResult({ kind: 'window', id: item.id })
                    }
                  />
                )}
              </section>
            )
          })}
          {!previewLayout && !focusView && (
            <div
              className={styles.drawingLayer}
              style={{ zIndex: workspace.windows.length + 1 }}
            >
              <DrawingLayer
                drawings={workspace.drawings}
                layer="above"
                selectedId={selectedDrawingId}
                consumingIds={consumingDrawingIds}
                draft={drawingDraft ?? undefined}
                interactive={tool === 'cursor' && !previewExiting}
                onPointerDown={startDrawingMove}
                onSelect={selectDrawing}
              />
            </div>
          )}
          {selection?.points ? (
            <svg
              className={styles.freeformSelection}
              aria-hidden="true"
              viewBox={`${selection.x - 2} ${selection.y - 2} ${selection.width + 4} ${selection.height + 4}`}
              style={{
                left: selection.x - 2,
                top: selection.y - 2,
                width: selection.width + 4,
                height: selection.height + 4,
                zIndex: workspace.windows.length + 1,
              }}
            >
              <polygon
                points={selection.points
                  .map(({ x, y }) => `${x},${y}`)
                  .join(' ')}
              />
              <polyline
                points={selection.points
                  .map(({ x, y }) => `${x},${y}`)
                  .join(' ')}
              />
              <path
                d={`M${selection.points.at(-1)!.x},${selection.points.at(-1)!.y} L${selection.points[0].x},${selection.points[0].y}`}
                strokeDasharray="3 4"
              />
            </svg>
          ) : (
            selection && (
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
            )
          )}
        </div>
      </div>
      {!focusView && !previewLayout && selectedDrawing && !drawingDraft && (
        <DrawingActions
          key={selectedDrawing.id}
          drawing={selectedDrawing}
          view={view}
          editing={tool === 'draw'}
          onPlay={gestureShortcuts.length > 0 ? playDrawing : undefined}
          onLayerChange={(layer) => {
            setDrawingLayer(layer)
            setWorkspace((current) => ({
              ...current,
              drawings: current.drawings.map((item) =>
                item.id === selectedDrawing.id ? { ...item, layer } : item,
              ),
            }))
          }}
          onDelete={() => {
            setWorkspace((current) => ({
              ...current,
              drawings: current.drawings.filter(
                (item) => item.id !== selectedDrawing.id,
              ),
            }))
            setSelectedDrawingId(null)
          }}
          onFinish={() => setSelectedDrawingId(null)}
        />
      )}
      {!focusView && !previewLayout && selectedWindows.length > 0 && (
        <GatherWindows
          key={`${ai.enabled}:${selectedIds.toSorted().join(',')}`}
          windows={selectedWindows}
          view={view}
          enabled={ai.enabled}
          downloading={ai.downloading}
          onGather={() => {
            const canvas = viewport.current
            if (!ai.enabled || !canvas) return
            const currentView = {
              x: canvas.scrollLeft,
              y: canvas.scrollTop,
              width: canvas.clientWidth,
              height: canvas.clientHeight,
            }
            const next = gatherRelatedWindows(
              workspace,
              selectedIds,
              currentView,
            )
            if (next === workspace) return
            const preview = window.matchMedia(
              '(prefers-reduced-motion: reduce)',
            ).matches
              ? undefined
              : captureWindowPreview(windowElements.current)
            setWorkspace(next)
            setRevealRequest(
              preview
                ? {
                    id: selectedIds[0],
                    left: currentView.x,
                    top: currentView.y,
                    preview,
                    focus: false,
                  }
                : null,
            )
          }}
        />
      )}
      <div
        className={`${styles.docks} ${shellStyles.mobileSurface}`}
        data-shell-controls
        inert={windowSwitcher.open}
      >
        <CanvasTools
          mode={tool}
          drawingLayer={drawingLayer}
          onDrawingLayerChange={(layer) => {
            closePopovers()
            setDrawingLayer(layer)
            setTool('draw')
            setSelectedDrawingId(null)
            setSelectedIds([])
            setSelectedItemIds([])
            setShowMap(false)
            setLauncher(null)
          }}
          selectionShape={selectionShape}
          onSelectionShapeChange={(shape) => {
            closePopovers()
            setSelectionShape(shape)
            setTool('select')
            setSelectedIds([])
            setSelectedItemIds([])
            setShowMap(false)
            setLauncher(null)
          }}
          menusAllowed={
            !previewLayout &&
            !showMap &&
            !launcher &&
            !notificationsOpen &&
            !systemPanel &&
            !dockAppId
          }
          onModeChange={(mode) => {
            closePopovers()
            setTool(mode)
            if (mode !== 'select') setSelectedIds([])
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
        />
        <span className={styles.dockDivider} aria-hidden="true" />
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
          gestureShortcuts={gestureShortcuts}
          mode={launcher}
          editingGestures={editingGestures}
          onSaveGestureShortcut={saveGestureShortcut}
          onModeChange={(mode) => {
            setEditingGestures(false)
            setLauncher(mode)
          }}
          onCustomizeGestures={openGestureSettings}
          onClose={closeLauncher}
          onLaunch={launchApp}
        />
      )}
      {showMap && (
        <aside className={styles.mapPanel} data-shell-controls>
          <div className={styles.panelHeading}>
            <h2>Overview</h2>
            <div
              className={styles.zoomControls}
              role="group"
              aria-label="Canvas zoom"
            >
              <button
                type="button"
                className={`${styles.zoomButton} ${shellStyles.control}`}
                aria-label="Zoom out"
              >
                <ZoomOut size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`${styles.zoomButton} ${shellStyles.control}`}
                aria-label="Zoom in"
              >
                <ZoomIn size={18} strokeWidth={1.5} aria-hidden="true" />
              </button>
            </div>
          </div>
          <Minimap
            workspace={workspace}
            view={view}
            onNavigate={(x, y) => {
              if (!focusView) viewport.current?.scrollTo(x, y)
            }}
          />
        </aside>
      )}
      {switcherWindow && switcherPlacement && (
        <WindowSwitcher
          title={switcherWindow.title}
          focusTarget={viewport}
          position={{
            x: switcherPlacement.x - switcherView.x,
            y:
              switcherPlacement.y -
              switcherView.y +
              switcherWindow.height * switcherPlacement.scale +
              10,
            width: switcherWindow.width * switcherPlacement.scale,
          }}
        />
      )}
      {canvasSearch && searchLayout && (
        <CanvasSearch
          position={searchLayout.position}
          resultsAbove={searchLayout.resultsAbove}
          query={canvasSearch.query}
          onQueryChange={(query) =>
            setCanvasSearch({ ...canvasSearch, query, selected: 0 })
          }
          onClose={() => {
            setCanvasSearch(null)
            viewport.current?.focus({ preventScroll: true })
          }}
          onActivate={() => activateSearchResult(searchResult)}
          onNavigate={(direction) => {
            const count = searchLayout.results.length
            if (count)
              setCanvasSearch({
                ...canvasSearch,
                selected: (canvasSearch.selected + direction + count) % count,
              })
          }}
          empty={searchLayout.results.length === 0}
        />
      )}
    </main>
  )
}

export default App
