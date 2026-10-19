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
import { transformCanvasWorkspace } from './layout-workspace'
import { CANVAS_LAYERS } from './canvas-layers'
import useObjectLayout from './useObjectLayout'
import useScene from './useScene'
import { useSystemStatus } from './useSystemStatus'
import { useNotifications } from './useNotifications'
import { CANVAS_TOOL_CATALOG } from './canvas-tool-catalog'
import SearchControlPreview from './components/SearchControlPreview'
import {
  FRAME_WIDGETS,
  getFrameBounds,
  getPinnedWindowOffset,
  getTargetGroup,
  getWidgetExpanded,
  targetKey,
  type LayoutTarget,
} from './frame-layout'
import FrameShell from './components/FrameShell'
import FramePreviewSlot, {
  type FramePreviewBounds,
} from './components/FramePreviewSlot'
import LayoutEditor from './components/LayoutEditor'
import LayoutItemControls from './components/LayoutItemControls'
import { getLayoutItemOptions } from './layout-item-options'
import FrameGuides from './components/FrameGuides'
import LayoutConfirm from './components/LayoutConfirm'
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
import { loadFavoriteApps, saveFavoriteApps, addFavoriteApp } from './favorites'
import AppIcon from './components/AppIcon'
import WindowContent from './components/WindowContent'
import WindowHost from './components/WindowHost'
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
  CANVAS_GRID_SIZE,
  CANVAS_TOOL_STORAGE_KEY,
  clamp,
  loadCanvasTool,
  loadWindowSelectionShape,
  MIN_WIDTH,
  WINDOW_SELECTION_STORAGE_KEY,
  type Bounds,
  type DesktopWindow,
  type DesktopItem,
  type CanvasControl,
  type Workspace,
  type WindowSelectionShape,
} from './desktop'
import { polygonIntersectsBounds, type SelectionPoint } from './selection'
import useBackground from './useBackground'
import useAI from './useAI'
import useShellPeek from './useShellPeek'
import useWindowSwitcher from './useWindowSwitcher'
import usePeekMotion from './usePeekMotion'
import {
  restoreBackgroundItems as restoreCanvasBackground,
  settleBackgroundItems as settleCanvasBackground,
  settleCoveredItems as settleCanvasCovered,
} from './peek-layout'
import { gatherRelatedWindows } from './gather-windows'
import { getMaximizedBounds, getWindowClearance } from './window-layout'
import { getCanvasMoveDelta, getCanvasResizeBounds } from './canvas-grid'
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
  saveAccentTheme,
  saveColorMode,
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
  controls?: CanvasControl[]
  controlId?: string
  windows?: DesktopWindow[]
  selectedItemIds?: string[]
  selectedControlIds?: string[]
  moved?: boolean
  selectionShape?: WindowSelectionShape
  points?: SelectionPoint[]
  drawingLayer?: DrawingLayerName
}

function restoreDesktopDrag(workspace: Workspace, gesture: Gesture): Workspace {
  const items = new Map(gesture.items?.map((item) => [item.id, item]))
  const controls = new Map(
    gesture.controls?.map((control) => [control.id, control]),
  )
  return {
    ...workspace,
    items: workspace.items.map((item) => items.get(item.id) ?? item),
    controls: workspace.controls?.map(
      (control) => controls.get(control.id) ?? control,
    ),
  }
}

const edges = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw']

function App() {
  const background = useBackground()
  const ai = useAI()
  const [accentTheme, setAccentTheme] = useState(loadAccentTheme)
  const [colorMode, setColorMode] = useState(loadColorMode)
  const [gestureShortcuts, setGestureShortcuts] = useState(loadGestureShortcuts)
  const accent =
    ACCENT_THEMES.find((theme) => theme.id === accentTheme) ?? ACCENT_THEMES[0]
  const [favoriteAppIds, setFavoriteAppIds] = useState(loadFavoriteApps)
  const [favoriteDropActive, setFavoriteDropActive] = useState(false)
  const [justFavoritedAppId, setJustFavoritedAppId] = useState<string | null>(
    null,
  )
  const [returningFavoriteIds, setReturningFavoriteIds] = useState<string[]>([])
  const favoriteTimer = useRef<number | undefined>(undefined)
  useEffect(() => saveFavoriteApps(favoriteAppIds), [favoriteAppIds])
  useEffect(() => () => window.clearTimeout(favoriteTimer.current), [])
  const {
    workspace,
    setWorkspace,
    layout,
    setLayout,
    view,
    setView,
    removeObject,
  } = useScene()
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
  const status = useSystemStatus()
  const clockOptions = getLayoutItemOptions(layout, 'widget:clock')
  const notificationState = useNotifications()
  const [widgetReveal, setWidgetReveal] = useState<{
    id: string
    onFrame: boolean
  } | null>(null)
  const [toolMenuRequest, setToolMenuRequest] = useState(0)
  const [tool, setTool] = useState(loadCanvasTool)
  const drawingLayer: DrawingLayerName = 'above'
  const [frameHost, setFrameHost] = useState<HTMLDivElement | null>(null)
  const [canvasHost, setCanvasHost] = useState<HTMLDivElement | null>(null)
  const [framePreviewBounds, setFramePreviewBounds] = useState(
    new Map<string, FramePreviewBounds>(),
  )
  const updateFramePreviewBounds = useCallback(
    (target: LayoutTarget, bounds: FramePreviewBounds | null) => {
      setFramePreviewBounds((current) => {
        const key = targetKey(target)
        const previous = current.get(key)
        if (
          (!bounds && !previous) ||
          (bounds &&
            previous &&
            bounds.x === previous.x &&
            bounds.y === previous.y &&
            bounds.width === previous.width &&
            bounds.height === previous.height &&
            bounds.frame.x === previous.frame.x &&
            bounds.frame.y === previous.frame.y &&
            bounds.frame.width === previous.frame.width &&
            bounds.frame.height === previous.frame.height)
        )
          return current
        const next = new Map(current)
        if (bounds) next.set(key, bounds)
        else next.delete(key)
        return next
      })
    },
    [],
  )
  const [expandedPinnedId, setExpandedPinnedId] = useState<string | null>(null)
  const [hoveredPinnedId, setHoveredPinnedId] = useState<string | null>(null)
  const [closingPinnedId, setClosingPinnedId] = useState<string | null>(null)
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
    sessionId: string
    x: number
    y: number
    anchor: { x: number; y: number }
    query: string
    handwriting: boolean
    selected: number
  } | null>(null)
  const searchLayout = canvasSearch
    ? getCanvasSearchLayout(
        workspace,
        { ...view, x: canvasSearch.x, y: canvasSearch.y },
        canvasSearch.anchor,
        canvasSearch.query,
        canvasSearch.handwriting,
        { widgets: FRAME_WIDGETS, tools: CANVAS_TOOL_CATALOG },
      )
    : null
  const searchResult = searchLayout?.results[canvasSearch?.selected ?? 0]
  const [selectionShape, setSelectionShape] = useState(loadWindowSelectionShape)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [selectedControlIds, setSelectedControlIds] = useState<string[]>([])
  const suppressedControlClick = useRef<string | null>(null)
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
  const latestPointer = useRef({ x: 0, y: 0, altKey: false })
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
      setWidgetReveal(null)
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
      const interrupted = gesture.current
      if (interrupted?.type === 'item-move' && interrupted.moved)
        setWorkspace((current) => restoreDesktopDrag(current, interrupted))
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
  const { cancel: cancelPeekMotion, prepare: preparePeekMotion } =
    usePeekMotion(viewport, !previewLayout && !focusView)
  const objectLayout = useObjectLayout(
    workspace,
    setWorkspace,
    layout,
    setLayout,
    view,
    tool === 'layout',
    (target) =>
      preparePeekMotion({
        excludedWindowId: target.kind === 'window' ? target.id : undefined,
      }),
    { hover: hoverFavoriteDrop, drop: dropFavorite },
  )
  const measureControl = useCallback(
    (id: string, size: { width: number; height: number }) => {
      setLayout((current) => {
        const key = targetKey({ kind: 'widget', id })
        const placement = current.placements[key]
        if (
          !placement ||
          (placement.surface !== 'canvas' &&
            placement.surface !== 'background') ||
          (placement.width === size.width && placement.height === size.height)
        )
          return current
        return {
          ...current,
          placements: {
            ...current.placements,
            [key]: { ...placement, ...size },
          },
        }
      })
    },
    [setLayout],
  )
  const restoreBackgroundItems = useCallback(
    (current: typeof workspace) =>
      transformCanvasWorkspace(
        current,
        objectLayout.layout,
        restoreCanvasBackground,
      ),
    [objectLayout.layout],
  )
  const settleBackgroundItems = (current: typeof workspace) =>
    transformCanvasWorkspace(
      current,
      objectLayout.layout,
      settleCanvasBackground,
    )
  const settleCoveredItems = (current: typeof workspace) =>
    transformCanvasWorkspace(current, objectLayout.layout, settleCanvasCovered)
  const onCanvas = (kind: 'window' | 'item', id: string) => {
    const surface = objectLayout.placement({ kind, id }).surface
    return surface === 'canvas' || surface === 'background'
  }
  const selectedWindows = workspace.windows.filter(
    (item) => selectedIds.includes(item.id) && onCanvas('window', item.id),
  )
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
    setWidgetReveal(null)
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
  }, [focusView, setWorkspace])

  const openCanvasSearch = useCallback(
    (anchor: { x: number; y: number }) => {
      const canvas = viewport.current
      if (!canvas || document.querySelector(':modal')) return
      cancelPeekMotion()
      leaveFocusView()
      closePopovers()
      setLauncher(null)
      setShowMap(false)
      setSpaceHeld(false)
      setSelection(null)
      setSelectedIds([])
      setSelectedItemIds([])
      setSelectedControlIds([])
      setDrawingDraft(null)
      setSelectedDrawingId(null)
      setTool('search')
      setRevealRequest(null)
      const interrupted = gesture.current
      if (interrupted?.type === 'item-move' && interrupted.moved)
        setWorkspace((current) => restoreDesktopDrag(current, interrupted))
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
      setCanvasSearch({
        ...origin,
        sessionId: crypto.randomUUID(),
        anchor,
        query: '',
        handwriting: false,
        selected: 0,
      })
    },
    [
      closePopovers,
      cancelPeekMotion,
      leaveFocusView,
      setLauncher,
      setSelectedIds,
      setSelectedItemIds,
      setWorkspace,
    ],
  )

  const arrangeAllWindows = useCallback(() => {
    cancelPeekMotion()
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
    setSelectedControlIds([])
    setShowMap(false)
    setLauncher(null)
    closePopovers()
    preparePeekMotion({ backgroundOnly: true })
    setWorkspace((current) =>
      restoreBackgroundItems(
        transformCanvasWorkspace(current, objectLayout.layout, (canvas) =>
          arrangeWindows(canvas, origin),
        ),
      ),
    )
  }, [
    closePopovers,
    cancelPeekMotion,
    preparePeekMotion,
    objectLayout.layout,
    restoreBackgroundItems,
    leaveFocusView,
    setWorkspace,
    setLauncher,
    setSelectedIds,
    setSelectedItemIds,
  ])

  useLayoutEffect(() => {
    viewport.current?.scrollTo(home.x, home.y)
  }, [home.x, home.y])

  const finishWidgetReveal = useEffectEvent((id: string) => {
    setWidgetReveal(null)
    if (id === 'notifications') setNotificationsOpen(true)
    else if (id === 'apps') {
      setEditingGestures(false)
      setLauncher('apps')
    } else if (id === 'tools') setToolMenuRequest((current) => current + 1)
    else if (
      id === 'wifi' ||
      id === 'volume' ||
      id === 'battery' ||
      id === 'clock'
    )
      setSystemPanel(id)
  })

  useLayoutEffect(() => {
    if (!widgetReveal) return
    const canvas = viewport.current
    const element = document.querySelector<HTMLElement>(
      `[data-layout-widget="${CSS.escape(widgetReveal.id)}"]`,
    )
    if (!canvas || !element) return

    // Reveal members inside scrolling frame groups without moving the canvas.
    for (
      let parent = element.parentElement;
      parent && parent !== canvas;
      parent = parent.parentElement
    ) {
      const overflow = getComputedStyle(parent)
      const bounds = element.getBoundingClientRect()
      const container = parent.getBoundingClientRect()
      if (/auto|scroll/.test(overflow.overflowX))
        parent.scrollLeft +=
          bounds.left < container.left
            ? bounds.left - container.left
            : Math.max(0, bounds.right - container.right)
      if (/auto|scroll/.test(overflow.overflowY))
        parent.scrollTop +=
          bounds.top < container.top
            ? bounds.top - container.top
            : Math.max(0, bounds.bottom - container.bottom)
    }

    const bounds = element.getBoundingClientRect()
    const canvasBounds = canvas.getBoundingClientRect()
    const left = widgetReveal.onFrame
      ? canvas.scrollLeft
      : clamp(
          canvas.scrollLeft +
            bounds.left -
            canvasBounds.left +
            bounds.width / 2 -
            canvas.clientWidth / 2,
          0,
          canvas.scrollWidth - canvas.clientWidth,
        )
    const top = widgetReveal.onFrame
      ? canvas.scrollTop
      : clamp(
          canvas.scrollTop +
            bounds.top -
            canvasBounds.top +
            bounds.height / 2 -
            canvas.clientHeight * 0.35,
          0,
          canvas.scrollHeight - canvas.clientHeight,
        )
    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    if (!widgetReveal.onFrame)
      canvas.scrollTo({
        left,
        top,
        behavior: reducedMotion ? 'instant' : 'smooth',
      })

    let frame: number
    let arrived = false
    function waitForArrival() {
      if (!canvas || !widgetReveal) return
      if (
        Math.abs(canvas.scrollLeft - left) < 1 &&
        Math.abs(canvas.scrollTop - top) < 1
      ) {
        arrived = true
        finishWidgetReveal(widgetReveal.id)
      } else frame = requestAnimationFrame(waitForArrival)
    }
    const cancel = () => setWidgetReveal(null)
    frame = requestAnimationFrame(waitForArrival)
    document.addEventListener('pointerdown', cancel, true)
    document.addEventListener('wheel', cancel, true)
    document.addEventListener('keydown', cancel, true)
    window.addEventListener('resize', cancel)
    window.addEventListener('blur', cancel)
    return () => {
      cancelAnimationFrame(frame)
      if (!arrived && !widgetReveal.onFrame)
        canvas.scrollTo({
          left: canvas.scrollLeft,
          top: canvas.scrollTop,
          behavior: 'instant',
        })
      document.removeEventListener('pointerdown', cancel, true)
      document.removeEventListener('wheel', cancel, true)
      document.removeEventListener('keydown', cancel, true)
      window.removeEventListener('resize', cancel)
      window.removeEventListener('blur', cancel)
    }
  }, [widgetReveal])

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
    const resize = () =>
      setView((current) => ({
        ...current,
        width: window.innerWidth,
        height: window.innerHeight,
      }))
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openCanvasSearch({
          x: window.innerWidth / 2,
          y: window.innerHeight / 3,
        })
        return
      }
      if (event.key === 'Escape') {
        if (gesture.current?.controlId)
          suppressedControlClick.current = gesture.current.controlId
        if (tool === 'layout') setTool('cursor')
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
        setSelectedControlIds([])
        setSelection(null)
        setDrawingDraft(null)
        setSelectedDrawingId(null)
        if (
          gesture.current?.type === 'window-select' ||
          gesture.current?.type === 'item-select' ||
          gesture.current?.type === 'item-move' ||
          gesture.current?.type === 'draw' ||
          gesture.current?.type === 'drawing-move'
        ) {
          const interrupted = gesture.current
          if (interrupted.type === 'item-move' && interrupted.moved)
            setWorkspace((current) => restoreDesktopDrag(current, interrupted))
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
        setSelectedControlIds([])
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
        setSelectedControlIds([])
        setShowMap(false)
      }
      if (event.key.toLowerCase() === 'd') {
        closePopovers()
        setTool('draw')
        setSelectedIds([])
        setSelectedItemIds([])
        setSelectedControlIds([])
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
      const interrupted = gesture.current
      if (interrupted?.type === 'item-move' && interrupted.moved)
        setWorkspace((current) => restoreDesktopDrag(current, interrupted))
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
    setView,
    setWorkspace,
    tool,
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
    setExpandedPinnedId(
      objectLayout.placement({ kind: 'window', id }).surface === 'frame'
        ? id
        : null,
    )
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
      if (!current.moved && Math.hypot(dx, dy) < 4) return
      current.moved = true
      const delta = getCanvasMoveDelta(
        [bounds],
        bounds,
        { x: dx, y: dy },
        workspace,
        latestPointer.current.altKey,
      )
      setWorkspace((previous) => ({
        ...previous,
        drawings: previous.drawings.map((item) =>
          item.id !== current.id
            ? item
            : {
                ...item,
                peekOrigin: undefined,
                x: bounds.x + delta.x,
                y: bounds.y + delta.y,
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
          .filter(
            (item) =>
              onCanvas('window', item.id) &&
              polygonIntersectsBounds(points, item),
          )
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
            onCanvas(isDesktopSelection ? 'item' : 'window', item.id) &&
            item.x < area.x + area.width &&
            item.x + item.width > area.x &&
            item.y < area.y + area.height &&
            item.y + item.height > area.y,
        )
        .map((item) => item.id)
      if (isDesktopSelection) {
        setSelectedItemIds([...new Set([...current.selectedItemIds!, ...ids])])
        const controls = (workspace.controls ?? [])
          .filter(
            (control) =>
              control.x < area.x + area.width &&
              control.x + control.width > area.x &&
              control.y < area.y + area.height &&
              control.y + control.height > area.y,
          )
          .map((control) => control.id)
        setSelectedControlIds([
          ...new Set([...current.selectedControlIds!, ...controls]),
        ])
      } else setSelectedIds(ids)
      return
    }
    const dx = clientX - current.startX + canvas.scrollLeft - current.scrollX
    const dy = clientY - current.startY + canvas.scrollTop - current.scrollY
    if (current.type === 'item-move') {
      hoverFavoriteDrop(current.id ?? null, clientX, clientY)
      // Move the whole selection by one bounded delta, preserving its spacing.
      if (!current.moved && Math.hypot(dx, dy) < 4) return
      if (!current.moved && current.controlId) {
        suppressedControlClick.current = current.controlId
        captureTarget.current?.setPointerCapture(current.pointerId)
        closePopovers()
        setLauncher(null)
        setShowMap(false)
        setDragging(true)
      }
      current.moved = true
      const items = current.items ?? []
      const controls = current.controls ?? []
      const { x: moveX, y: moveY } = getCanvasMoveDelta(
        [...items, ...controls],
        current.bounds!,
        { x: dx, y: dy },
        workspace,
        latestPointer.current.altKey,
      )
      const origins = new Map(items.map((item) => [item.id, item]))
      const controlOrigins = new Map(
        controls.map((control) => [control.id, control]),
      )
      setWorkspace((previous) => ({
        ...previous,
        items: previous.items.map((item) => {
          const origin = origins.get(item.id)
          return origin
            ? {
                ...item,
                peekOrigin: undefined,
                x: origin.x + moveX,
                y: origin.y + moveY,
              }
            : item
        }),
        controls: previous.controls?.map((control) => {
          const origin = controlOrigins.get(control.id)
          return origin
            ? {
                ...control,
                peekOrigin: undefined,
                x: origin.x + moveX,
                y: origin.y + moveY,
              }
            : control
        }),
      }))
      return
    }
    if (
      (current.type === 'move' || current.type === 'resize') &&
      Math.hypot(dx, dy) > 0.5
    )
      current.moved = true
    if (current.type === 'move') {
      if (!current.moved) return
      // Apply one bounded delta so selected windows keep their spacing.
      const windows = current.windows!
      const { x: moveX, y: moveY } = getCanvasMoveDelta(
        windows,
        current.bounds!,
        { x: dx, y: dy },
        workspace,
        latestPointer.current.altKey,
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
    if (!current.moved) return
    const bounds = current.bounds!
    setWorkspace((previous) => ({
      ...previous,
      windows: previous.windows.map((item) =>
        item.id !== current.id
          ? item
          : {
              ...item,
              ...getCanvasResizeBounds(
                bounds,
                current.edge!,
                dx,
                dy,
                previous,
                latestPointer.current.altKey,
              ),
            },
      ),
    }))
  }

  const updateDragModifier = useEffectEvent((event: KeyboardEvent) => {
    const pointer = latestPointer.current
    if (
      !gesture.current ||
      !['move', 'resize', 'item-move', 'drawing-move'].includes(
        gesture.current.type,
      ) ||
      pointer.altKey === event.altKey
    )
      return
    pointer.altKey = event.altKey
    applyGesture(pointer.x, pointer.y)
  })

  useEffect(() => {
    window.addEventListener('keydown', updateDragModifier)
    window.addEventListener('keyup', updateDragModifier)
    return () => {
      window.removeEventListener('keydown', updateDragModifier)
      window.removeEventListener('keyup', updateDragModifier)
    }
  }, [])

  const panAtEdge = useEffectEvent(() => {
    if (
      focusView ||
      (gesture.current?.type === 'item-move' &&
        isFavoriteDrop(
          gesture.current.id ?? null,
          latestPointer.current.x,
          latestPointer.current.y,
        ))
    )
      return
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
    preserveClick = false,
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
    cancelPeekMotion()
    const canvas = viewport.current!
    setSelectedDrawingId(null)
    if (!preserveClick) {
      event.preventDefault()
      event.stopPropagation()
      event.currentTarget.setPointerCapture(event.pointerId)
    }
    captureTarget.current = event.currentTarget
    latestPointer.current = {
      x: event.clientX,
      y: event.clientY,
      altKey: event.altKey,
    }
    gesture.current = {
      pointerId: event.pointerId,
      type,
      startX: event.clientX,
      startY: event.clientY,
      scrollX: canvas.scrollLeft,
      scrollY: canvas.scrollTop,
      id: item?.id,
      bounds: item,
      windows: group ?? (type === 'move' && item ? [item] : undefined),
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
      selectedControlIds:
        type === 'item-select' &&
        (event.shiftKey || event.metaKey || event.ctrlKey)
          ? selectedControlIds
          : [],
    }
    setDragging(
      !preserveClick && type !== 'window-select' && type !== 'item-select',
    )
    if (type === 'window-select' || type === 'item-select') {
      if (type === 'window-select') setSelectedIds([])
      else {
        setSelectedIds([])
        setSelectedItemIds(gesture.current.selectedItemIds!)
        setSelectedControlIds(gesture.current.selectedControlIds!)
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
    cancelPeekMotion()
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
    setSelectedControlIds([])
    setDrawingDraft({ points, layer })
    closePopovers()
  }

  function selectDrawing(id: string) {
    setSelectedDrawingId(id)
    setSelectedIds([])
    setSelectedItemIds([])
    setSelectedControlIds([])
    closePopovers()
  }

  function startDrawingMove(
    event: ReactPointerEvent<SVGSVGElement>,
    id: string,
  ) {
    const drawing = workspace.drawings.find((item) => item.id === id)
    if (objectLayout.placement({ kind: 'drawing', id }).surface === 'frame') {
      event.stopPropagation()
      selectDrawing(id)
      return
    }
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

  function isFavoriteDrop(itemId: string | null, x: number, y: number) {
    const item = workspace.items.find((item) => item.id === itemId)
    if (item?.kind !== 'app') return false
    const target = launcherTrigger.current
    if (!target || target.closest('[hidden]')) return false
    const bounds = target.getBoundingClientRect()
    return (
      bounds.width > 0 &&
      x >= bounds.left - 10 &&
      x <= bounds.right + 10 &&
      y >= bounds.top - 10 &&
      y <= bounds.bottom + 10
    )
  }

  function hoverFavoriteDrop(itemId: string | null, x: number, y: number) {
    const active = isFavoriteDrop(itemId, x, y)
    setFavoriteDropActive(active)
    return active
  }

  function dropFavorite(itemId: string, x: number, y: number) {
    if (!isFavoriteDrop(itemId, x, y)) return false
    const item = workspace.items.find((item) => item.id === itemId)!
    setFavoriteAppIds((current) => addFavoriteApp(current, item.appId))
    setJustFavoritedAppId(item.appId)
    setReturningFavoriteIds([itemId])
    setFavoriteDropActive(false)
    window.clearTimeout(favoriteTimer.current)
    favoriteTimer.current = window.setTimeout(() => {
      setJustFavoritedAppId(null)
      setReturningFavoriteIds([])
    }, 700)
    return true
  }

  function openDesktopItem(item: DesktopItem) {
    if (tool === 'layout' || previewExiting) return
    if (canvasSearch) {
      activateSearchResult({ kind: 'item', id: item.id })
      return
    }
    const app = APP_CATALOG.find((entry) => entry.id === item.appId)
    if (app) launchApp(app)
  }

  function selectDesktopItem(item: DesktopItem, additive: boolean) {
    setSelectedDrawingId(null)
    setSelectedIds([])
    if (!additive) setSelectedControlIds([])
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
    if (
      !previewLayout &&
      objectLayout.placement({ kind: 'item', id: item.id }).surface === 'frame'
    ) {
      event.stopPropagation()
      selectDesktopItem(item, false)
      return
    }
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
    const controlIds = additive || selected ? selectedControlIds : []
    setSelectedControlIds(controlIds)
    event.currentTarget.focus({ preventScroll: true })
    if (!ids.includes(item.id)) {
      event.preventDefault()
      event.stopPropagation()
      return
    }
    const current = startGesture(event, 'item-move')
    if (!current) return
    current.id = item.id
    current.bounds = item
    current.items = workspace.items.filter(
      (entry) => ids.includes(entry.id) && onCanvas('item', entry.id),
    )
    current.controls = (workspace.controls ?? []).filter((control) =>
      controlIds.includes(control.id),
    )
  }

  function startControlGesture(
    event: ReactPointerEvent<HTMLDivElement>,
    id: string,
  ) {
    if (
      tool !== 'cursor' ||
      focusView ||
      previewLayout ||
      previewExiting ||
      event.button !== 0 ||
      gesture.current ||
      spaceHeld
    )
      return
    const control = workspace.controls?.find((entry) => entry.id === id)
    if (!control) return
    // Popovers belong to the control, but only its resting bar is draggable.
    const bounds = event.currentTarget.getBoundingClientRect()
    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom ||
      (event.target as Element).closest(
        '[data-widget-popover], input, textarea, select, [contenteditable="true"]',
      )
    )
      return
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    const selected = selectedControlIds.includes(id)
    const ids = additive
      ? selected
        ? selectedControlIds.filter((entry) => entry !== id)
        : [...selectedControlIds, id]
      : selected
        ? selectedControlIds
        : [id]
    const itemIds = additive || selected ? selectedItemIds : []
    setSelectedIds([])
    setSelectedControlIds(ids)
    setSelectedItemIds(itemIds)
    if (additive) suppressedControlClick.current = id
    if (!ids.includes(id)) return
    const current = startGesture(event, 'item-move', undefined, undefined, true)
    if (!current) return
    current.controlId = id
    current.bounds = control
    current.items = workspace.items.filter(
      (item) => itemIds.includes(item.id) && onCanvas('item', item.id),
    )
    current.controls = (workspace.controls ?? []).filter((entry) =>
      ids.includes(entry.id),
    )
  }

  function endGesture(event: ReactPointerEvent) {
    if (gesture.current?.pointerId !== event.pointerId) return
    latestPointer.current.altKey = event.altKey
    const completed = gesture.current
    if (
      event.type !== 'pointerup' &&
      completed.type === 'item-move' &&
      completed.moved
    ) {
      if (completed.controlId)
        suppressedControlClick.current = completed.controlId
      setWorkspace((current) => restoreDesktopDrag(current, completed))
    }
    if (
      event.type === 'pointerup' &&
      (completed.type === 'move' ||
        completed.type === 'resize' ||
        completed.type === 'item-move' ||
        completed.type === 'drawing-move')
    ) {
      const favorited =
        completed.type === 'item-move' &&
        completed.moved &&
        completed.id &&
        dropFavorite(completed.id, event.clientX, event.clientY)
      if (favorited) {
        setWorkspace((current) => restoreDesktopDrag(current, completed))
      } else applyGesture(event.clientX, event.clientY)
      if (completed.moved && !favorited) {
        preparePeekMotion({
          excludedWindowId:
            completed.type === 'move' || completed.type === 'resize'
              ? completed.id
              : undefined,
        })
        setWorkspace(settleCoveredItems)
      }
    }
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
        preparePeekMotion({ backgroundOnly: true, drawingOrigin: drawing })
        setWorkspace((previous) =>
          settleBackgroundItems({
            ...previous,
            drawings: existing
              ? previous.drawings.map((item) =>
                  item.id === drawing.id ? drawing : item,
                )
              : [...previous.drawings, drawing],
          }),
        )
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
    setFavoriteDropActive(false)
    setSelection(null)
    if (captureTarget.current?.hasPointerCapture(event.pointerId))
      captureTarget.current.releasePointerCapture(event.pointerId)
    captureTarget.current = null
  }

  function maximize(item: DesktopWindow) {
    if (
      objectLayout.placement({ kind: 'window', id: item.id }).surface ===
      'frame'
    ) {
      setExpandedPinnedId((current) => (current === item.id ? null : item.id))
      return
    }
    setRevealRequest(null)
    if (focusView?.id === item.id) {
      preparePeekMotion({ excludedWindowId: item.id })
      leaveFocusView()
      setWorkspace(settleCoveredItems)
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
    preparePeekMotion({ excludedWindowId: item.id })
    setWorkspace(settleCoveredItems)
  }

  function toggleFocusView(item: DesktopWindow) {
    if (
      objectLayout.placement({ kind: 'window', id: item.id }).surface ===
      'frame'
    ) {
      setExpandedPinnedId((current) => (current === item.id ? null : item.id))
      return
    }
    cancelPeekMotion()
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
    setSelectedControlIds([])
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

  function closeWindow(id: string, confirmed = false) {
    if (
      !confirmed &&
      objectLayout.placement({ kind: 'window', id }).surface === 'frame'
    ) {
      setClosingPinnedId(id)
      return
    }
    setClosingPinnedId(null)
    setRevealRequest(null)
    if (focusView?.id === id) setFocusView(null)
    preparePeekMotion({ backgroundOnly: true })
    removeObject({ kind: 'window', id })
  }

  function addWindow(
    app?: LauncherApp,
    center?: { x: number; y: number },
    consumedDrawingId?: string,
  ) {
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
    preparePeekMotion({ excludedWindowId: focusView?.id })
    setWorkspace((current) => {
      const fadingDrawings = new Set(consumingDrawingIds)
      if (consumedDrawingId) fadingDrawings.add(consumedDrawingId)
      const settled = settleCoveredItems({
        ...current,
        drawings: current.drawings.filter(
          (drawing) => !fadingDrawings.has(drawing.id),
        ),
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
      })
      if (!fadingDrawings.size) return settled
      // A played gesture fades at its launch point instead of peeking away.
      const drawings = new Map(settled.drawings.map((item) => [item.id, item]))
      return {
        ...settled,
        drawings: current.drawings.map((item) => drawings.get(item.id) ?? item),
      }
    })
    setActiveId(id)
    setExpandedPinnedId(
      objectLayout.placement({ kind: 'window', id }).surface === 'frame'
        ? id
        : null,
    )
    return id
  }

  function playDrawing() {
    if (!selectedDrawing || consumingDrawingIds.includes(selectedDrawing.id))
      return false
    const match = recognizeGesture(selectedDrawing.strokes, gestureShortcuts)
    const app = APP_CATALOG.find((item) => item.id === match?.appId)
    if (!app) return false
    const drawingId = selectedDrawing.id
    const drawingPlacement = objectLayout.placement({
      kind: 'drawing',
      id: drawingId,
    })
    const drawingBounds =
      drawingPlacement.surface === 'frame'
        ? (framePreviewBounds.get(`drawing:${drawingId}`) ??
          getFrameBounds(
            drawingPlacement,
            selectedDrawing.width,
            selectedDrawing.height,
            view,
          ))
        : selectedDrawing
    const drawingOffset =
      drawingPlacement.surface === 'frame' ? view : { x: 0, y: 0 }
    const windowId = addWindow(
      app,
      {
        x: drawingBounds.x + drawingBounds.width / 2 + drawingOffset.x,
        y: drawingBounds.y + drawingBounds.height / 2 + drawingOffset.y,
      },
      drawingId,
    )
    setDrawingLaunchId(windowId)
    setConsumingDrawingIds((current) => [...current, drawingId])
    setSelectedDrawingId(null)
    setTool('cursor')
    const timer = window.setTimeout(() => {
      objectLayout.forget({ kind: 'drawing', id: drawingId })
      preparePeekMotion({ backgroundOnly: true })
      setWorkspace((current) =>
        restoreBackgroundItems({
          ...current,
          drawings: current.drawings.filter((item) => item.id !== drawingId),
        }),
      )
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
    setSelectedControlIds([])
  }

  function revealWindow(id: string, options?: { center: boolean }) {
    const item = workspace.windows.find((entry) => entry.id === id)
    if (!item) return
    if (objectLayout.placement({ kind: 'window', id }).surface === 'frame') {
      closePopovers()
      focusWindow(id)
      setCanvasSearch(null)
      setLauncher(null)
      return
    }
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
    setSelectedControlIds([])
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
    else if (result.kind === 'widget') {
      const id = result.id
      if (!FRAME_WIDGETS.some((widget) => widget.id === id)) return
      closePopovers()
      setTool('cursor')
      setLauncher(null)
      setShowMap(false)
      const target = { kind: 'widget' as const, id }
      const placement = objectLayout.placement(target)
      if (placement.surface === 'hidden')
        objectLayout.place(target, {
          surface: 'canvas',
          x: view.x + view.width / 2 - 28,
          y: view.y + view.height * 0.35 - 28,
        })
      setWidgetReveal({ id, onFrame: placement.surface === 'frame' })
    } else if (result.kind === 'tool') {
      activateCanvasTool(result.id)
    } else if (result.kind === 'drawing') {
      const drawing = workspace.drawings.find((entry) => entry.id === result.id)
      setTool('cursor')
      setSelectedDrawingId(result.id)
      if (
        drawing &&
        objectLayout.placement({ kind: 'drawing', id: result.id }).surface !==
          'frame'
      )
        viewport.current?.scrollTo({
          left: drawing.x - (view.width - drawing.width) / 2,
          top: drawing.y - (view.height - drawing.height) / 2,
          behavior: 'smooth',
        })
    } else {
      const item = workspace.items.find((entry) => entry.id === result.id)
      const app = APP_CATALOG.find((entry) => entry.id === item?.appId)
      if (app) launchApp(app)
    }
  }

  function activateCanvasTool(id: string) {
    const entry = CANVAS_TOOL_CATALOG.find((item) => item.id === id)
    if (!entry) return
    closePopovers()
    setLauncher(null)
    setShowMap(false)
    setSpaceHeld(false)
    setSelection(null)
    setDrawingDraft(null)
    setSelectedDrawingId(null)
    setSelectedIds([])
    setSelectedItemIds([])
    setSelectedControlIds([])
    if ('mode' in entry) {
      if (entry.mode === 'layout') changeLayout()
      else {
        setTool(entry.mode)
        if ('shape' in entry) setSelectionShape(entry.shape)
      }
    } else {
      setTool('cursor')
      if (entry.action === 'map') setShowMap(true)
      else arrangeAllWindows()
    }
    viewport.current?.focus({ preventScroll: true })
  }

  function openGestureSettings(
    category: SettingsNavigationRequest['category'] = 'gestures',
  ) {
    const settings = workspace.windows.findLast(
      (item) => item.appId === 'settings',
    )
    const id =
      settings?.id ??
      addWindow(APP_CATALOG.find((app) => app.id === 'settings')!)
    setSettingsNavigation({
      windowId: id,
      request: { id: crypto.randomUUID(), category },
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

  function changeLayout() {
    leaveFocusView()
    closePopovers()
    objectLayout.setSelected(null)
    setTool('layout')
  }

  const frameWidgets = {
    notifications: (
      <NotificationInbox
        state={notificationState}
        expanded={getWidgetExpanded(objectLayout.layout, 'notifications')}
        open={notificationsOpen}
        previewVisible={
          !previewLayout && !systemPanel && !launcher && !showMap && !dockAppId
        }
        onToggle={() => {
          setWidgetReveal(null)
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
    ),
    tools: (
      <CanvasTools
        openRequest={toolMenuRequest}
        mode={tool}
        selectionShape={selectionShape}
        onSelectionShapeChange={(shape) => {
          closePopovers()
          setSelectionShape(shape)
          setTool('select')
          setSelectedIds([])
          setSelectedItemIds([])
          setSelectedControlIds([])
          setShowMap(false)
          setLauncher(null)
        }}
        menusAllowed={
          !dragging &&
          !previewLayout &&
          !showMap &&
          !launcher &&
          !notificationsOpen &&
          !systemPanel &&
          !dockAppId
        }
        onModeChange={(mode) => {
          if (mode === 'layout') {
            leaveFocusView()
            objectLayout.setSelected(null)
          }
          closePopovers()
          setTool(mode)
          if (mode !== 'select') setSelectedIds([])
          if (mode !== 'cursor') setSelectedItemIds([])
          setSelectedControlIds([])
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
    ),
    apps: (
      <LauncherDock
        favoriteAppIds={favoriteAppIds}
        favoriteDropActive={favoriteDropActive}
        justFavoritedAppId={justFavoritedAppId}
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
    ),
    ...Object.fromEntries(
      (['clock', 'wifi', 'volume', 'battery'] as const).map((id) => [
        id,
        <SystemBar
          status={status}
          clockDateFormat={clockOptions.dateFormat}
          key={id}
          id={id}
          expanded={getWidgetExpanded(objectLayout.layout, id)}
          openPanel={systemPanel}
          onPanelChange={(panel) => {
            setWidgetReveal(null)
            setCanvasSearch(null)
            setSystemPanel(panel)
            if (panel) {
              setDockAppId(null)
              setNotificationsOpen(false)
              setLauncher(null)
              setShowMap(false)
            }
          }}
        />,
      ]),
    ),
  }

  return (
    <main
      className={styles.desktop}
      data-layout-editing={tool === 'layout'}
      onPointerDownCapture={(event) => {
        suppressedControlClick.current = null
        objectLayout.events.onPointerDownCapture(event)
        if (
          tool !== 'layout' &&
          expandedPinnedId &&
          !(event.target as Element).closest(
            `[data-window-id="${expandedPinnedId}"], [data-layout-editor]`,
          )
        )
          setExpandedPinnedId(null)
      }}
      onFocusCapture={(event) => {
        if (
          expandedPinnedId &&
          !(event.target as Element).closest(
            `[data-window-id="${expandedPinnedId}"], [data-layout-editor]`,
          )
        )
          setExpandedPinnedId(null)
      }}
      onPointerMove={(event) => {
        objectLayout.events.onPointerMove(event)
        if (gesture.current?.pointerId !== event.pointerId) return
        latestPointer.current = {
          x: event.clientX,
          y: event.clientY,
          altKey: event.altKey,
        }
        applyGesture(event.clientX, event.clientY)
      }}
      onPointerUp={(event) => {
        objectLayout.events.onPointerUp(event)
        endGesture(event)
      }}
      onPointerCancel={(event) => {
        objectLayout.events.onPointerCancel(event)
        endGesture(event)
      }}
      onLostPointerCapture={(event) => {
        objectLayout.events.onLostPointerCapture(event)
        if (event.target === captureTarget.current) endGesture(event)
      }}
      onClickCapture={(event) => {
        const control = (event.target as Element).closest<HTMLElement>(
          '[data-canvas-control-id]',
        )
        if (
          control &&
          control.dataset.canvasControlId === suppressedControlClick.current
        ) {
          suppressedControlClick.current = null
          event.preventDefault()
          event.stopPropagation()
          return
        }
        if (
          tool === 'layout' &&
          !(event.target as Element).closest('[data-layout-editor]')
        ) {
          event.preventDefault()
          event.stopPropagation()
        }
      }}
      data-accent={accentTheme}
      data-color-mode={colorMode}
      data-presentation="realistic"
      data-focus-mode={renderedFocusView !== null}
      data-canvas-preview={previewLayout !== null}
      data-preview-exiting={previewExiting}
      data-shell-peek={!renderedFocusView || shellPeek}
      style={{ '--accent-base': accent.color } as CSSProperties}
    >
      <div
        ref={setFrameHost}
        className={styles.frameHost}
        data-shell-controls
      />
      {tool === 'layout' && (
        <>
          <LayoutEditor
            target={objectLayout.selected}
            title={objectLayout.title}
            placement={
              objectLayout.selected
                ? objectLayout.placement(objectLayout.selected)
                : null
            }
            onPlacementChange={(next) => {
              if (objectLayout.selected)
                objectLayout.place(objectLayout.selected, next)
            }}
            expanded={objectLayout.expanded}
            onToggleExpanded={objectLayout.toggleExpanded}
            grouped={
              !!objectLayout.group || objectLayout.selected?.kind === 'group'
            }
            onUngroup={objectLayout.ungroup}
            onFrame={objectLayout.attachSelected}
            onRemove={objectLayout.remove}
            onDone={() => setTool('cursor')}
          >
            <LayoutItemControls
              target={objectLayout.selected}
              layout={layout}
              onChange={setLayout}
              now={status.now}
            />
          </LayoutEditor>
        </>
      )}
      {objectLayout.warning && (
        <LayoutConfirm
          title="Keep a way back to your canvas"
          confirmLabel="Open settings"
          onCancel={() => objectLayout.setWarning(false)}
          onConfirm={() => {
            objectLayout.setWarning(false)
            setTool('cursor')
            openGestureSettings('system')
          }}
        >
          Canvas tools can be removed after you enable “Make canvas tools
          hide-able” in Settings. You can find them again with / or Ctrl+K
          search, or restore them from Settings.
        </LayoutConfirm>
      )}
      {closingPinnedId && (
        <LayoutConfirm
          title="Close and remove from pinned?"
          confirmLabel="Close and remove"
          destructive
          onCancel={() => setClosingPinnedId(null)}
          onConfirm={() => closeWindow(closingPinnedId, true)}
        >
          This closes the window and removes it from the frame.
        </LayoutConfirm>
      )}
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
              '[data-window-id], [data-desktop-item-id], [data-drawing-id], [data-canvas-control-id]',
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
        onAuxClick={(event) => event.preventDefault()}
      >
        <div
          ref={setCanvasHost}
          className={`${styles.world} ${background.photo ? styles.customBackground : ''}`}
          data-canvas-world
          data-background-fit={
            background.photo?.fit === 'repeat' ? 'repeat' : undefined
          }
          style={
            {
              '--canvas-grid-size': `${CANVAS_GRID_SIZE}px`,
              width: workspace.width,
              height: workspace.height,
              backgroundImage:
                background.photo?.fit === 'repeat'
                  ? `url("${background.photo.url}")`
                  : undefined,
            } as CSSProperties
          }
        >
          {tool === 'layout' && (
            <FrameGuides target={objectLayout.dropTarget} />
          )}
          <div inert={focusView !== null || windowSwitcher.open}>
            <DesktopItems
              items={
                previewLayout
                  ? workspace.items
                  : workspace.items.filter(
                      (item) =>
                        !getTargetGroup(objectLayout.layout, {
                          kind: 'item',
                          id: item.id,
                        }),
                    )
              }
              frameLayout={objectLayout.layout}
              frameHost={frameHost}
              view={view}
              selectedIds={selectedItemIds}
              returningIds={returningFavoriteIds}
              placements={previewLayout?.items}
              previewSelectedId={
                searchResult?.kind === 'item' ? searchResult.id : undefined
              }
              onPointerDown={startItemGesture}
              onSelect={selectDesktopItem}
              onOpen={openDesktopItem}
            />
          </div>
          {!windowSwitcher.open && !focusView && (
            <div className={styles.drawingLayer} style={{ zIndex: 0 }}>
              <DrawingLayer
                drawings={workspace.drawings}
                frameLayout={objectLayout.layout}
                frameHost={frameHost}
                groupBounds={framePreviewBounds}
                draggingWidget={objectLayout.draggingWidget}
                frameDropTarget={objectLayout.dropTarget}
                view={view}
                placements={searchLayout?.drawings}
                onOpen={(id) => activateSearchResult({ kind: 'drawing', id })}
                layer="below"
                selectedId={
                  searchResult?.kind === 'drawing'
                    ? searchResult.id
                    : selectedDrawingId
                }
                consumingIds={consumingDrawingIds}
                draft={drawingDraft ?? undefined}
                interactive={
                  (tool === 'cursor' || tool === 'layout' || !!searchLayout) &&
                  !previewExiting
                }
                onPointerDown={startDrawingMove}
                onSelect={selectDrawing}
              />
            </div>
          )}
          {workspace.windows.map((item, index) => {
            const placement = previewLayout?.windows.get(item.id)
            const grouped = getTargetGroup(objectLayout.layout, {
              kind: 'window',
              id: item.id,
            })
            const movingGroup =
              grouped && objectLayout.draggingWidget?.id === grouped.id
                ? objectLayout.draggingWidget
                : null
            const savedObjectPlacement = objectLayout.placement({
              kind: 'window',
              id: item.id,
            })
            const objectPlacement =
              movingGroup && savedObjectPlacement.surface !== 'frame'
                ? (objectLayout.dropTarget ?? { surface: 'canvas' as const })
                : savedObjectPlacement
            const attached =
              !previewLayout && objectPlacement.surface === 'frame'
            const slot = grouped
              ? framePreviewBounds.get(`window:${item.id}`)
              : undefined
            const expanded =
              expandedPinnedId === item.id || (tool === 'layout' && !grouped)
            const frameBounds = attached
              ? getFrameBounds(objectPlacement, item.width, item.height, view)
              : null
            if (frameBounds && slot && objectPlacement.surface === 'frame') {
              if (
                objectPlacement.edge === 'top' ||
                objectPlacement.edge === 'bottom'
              ) {
                frameBounds.x = expanded
                  ? clamp(slot.x, 0, view.width - frameBounds.width)
                  : slot.x
                frameBounds.width = slot.width
              } else {
                frameBounds.y = expanded
                  ? clamp(slot.y, 0, view.height - frameBounds.height)
                  : slot.y
                frameBounds.height = slot.height
              }
            }
            const canvasBounds =
              movingGroup && !previewLayout && !attached && slot
                ? { ...item, x: slot.x + view.x, y: slot.y + view.y }
                : item
            const offset = attached
              ? getPinnedWindowOffset(
                  frameBounds!,
                  objectPlacement.edge,
                  view,
                  expanded,
                  slot
                    ? Math.max(
                        42,
                        (objectPlacement.edge === 'left'
                          ? slot.frame.x + slot.frame.width
                          : objectPlacement.edge === 'right'
                            ? view.width - slot.frame.x
                            : objectPlacement.edge === 'top'
                              ? slot.frame.y + slot.frame.height
                              : view.height - slot.frame.y) +
                          (hoveredPinnedId === item.id ? 58 : 0),
                      )
                    : hoveredPinnedId === item.id
                      ? 100
                      : 42,
                )
              : { x: 0, y: 0 }
            const app = APP_CATALOG.find((entry) => entry.id === item.appId)
            const appId =
              app?.id ?? (item.kind === 'notes' ? 'notes' : 'workspace-windows')
            const Icon =
              app?.icon ?? (item.kind === 'notes' ? StickyNote : PanelsTopLeft)
            const content = (
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
                data-surface={objectPlacement.surface}
                data-frame-edge={attached ? objectPlacement.edge : undefined}
                data-pinned-collapsed={attached && !expanded}
                onPointerEnter={(event) => {
                  if (attached && event.pointerType !== 'touch')
                    setHoveredPinnedId(item.id)
                }}
                onPointerLeave={() => {
                  if (attached) setHoveredPinnedId(null)
                }}
                data-layout-selected={
                  tool === 'layout' &&
                  objectLayout.selected?.kind === 'window' &&
                  objectLayout.selected.id === item.id
                }
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
                  clipPath:
                    slot && frameBounds && attached && !expanded
                      ? objectPlacement.edge === 'top' ||
                        objectPlacement.edge === 'bottom'
                        ? `inset(0px ${Math.max(0, frameBounds.x + frameBounds.width - slot.frame.x - slot.frame.width)}px 0px ${Math.max(0, slot.frame.x - frameBounds.x)}px)`
                        : `inset(${Math.max(0, slot.frame.y - frameBounds.y)}px 0px ${Math.max(0, frameBounds.y + frameBounds.height - slot.frame.y - slot.frame.height)}px 0px)`
                      : undefined,
                  position:
                    renderedFocusView?.id === item.id || attached
                      ? 'fixed'
                      : undefined,
                  left:
                    renderedFocusView?.id === item.id
                      ? 0
                      : (frameBounds?.x ?? canvasBounds.x),
                  top:
                    renderedFocusView?.id === item.id
                      ? 0
                      : (frameBounds?.y ?? canvasBounds.y),
                  width:
                    renderedFocusView?.id === item.id
                      ? view.width
                      : (frameBounds?.width ?? item.width),
                  height:
                    renderedFocusView?.id === item.id
                      ? view.height
                      : (frameBounds?.height ?? item.height),
                  transform: placement
                    ? `translate(${placement.x - item.x}px, ${placement.y - item.y}px) scale(${placement.scale})`
                    : `translate(${offset.x}px, ${offset.y}px) scale(1)`,
                  zIndex:
                    renderedFocusView?.id === item.id
                      ? CANVAS_LAYERS.window + workspace.windows.length
                      : attached
                        ? 1100 + index
                        : objectPlacement.surface === 'background'
                          ? CANVAS_LAYERS.backgroundWindow
                          : CANVAS_LAYERS.window + index,
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
                  inert={previewLayout !== null || (attached && !expanded)}
                  className={styles.titlebar}
                  onPointerDown={(event) => {
                    if (
                      !attached &&
                      !(event.target as HTMLElement).closest('button')
                    )
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
                        attached
                          ? 'Tuck into frame'
                          : focusView?.id === item.id
                            ? 'Leave focused view'
                            : 'Maximize window'
                      }
                      aria-label={`${attached ? 'Tuck into frame' : focusView?.id === item.id ? 'Leave focused view for' : 'Maximize'} ${item.title}`}
                      onClick={() => toggleFocusView(item)}
                    >
                      {attached || focusView?.id === item.id ? (
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
                  inert={
                    previewLayout !== null ||
                    (attached && !expanded) ||
                    (!focusView && (tool === 'select' || tool === 'layout'))
                  }
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
                    allowHideTools={objectLayout.layout.allowHideTools}
                    onAllowHideToolsChange={objectLayout.setAllowHideTools}
                    onRestoreCanvasTools={objectLayout.restoreTools}
                    ai={ai}
                    workspace={workspace}
                    accentTheme={accentTheme}
                    colorMode={colorMode}
                    onColorModeChange={changeColorMode}
                    gestureShortcuts={gestureShortcuts}
                    onSaveGestureShortcut={saveGestureShortcut}
                    onRemoveGestureShortcut={removeGestureShortcut}
                    onAccentThemeChange={changeAccentTheme}
                    onChangeLayout={changeLayout}
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
                  !attached &&
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
                {!previewLayout && !attached && !item.restore && (
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
                {attached && !expanded && (
                  <button
                    className={styles.pinnedReveal}
                    aria-label={`Open pinned ${item.title}`}
                    onClick={() => focusWindow(item.id)}
                  >
                    <span>
                      <Icon size={18} />
                      <span>{item.title}</span>
                    </span>
                  </button>
                )}
              </section>
            )
            return (
              <WindowHost
                key={item.id}
                container={attached ? frameHost : canvasHost}
              >
                {content}
              </WindowHost>
            )
          })}
          {!windowSwitcher.open && !focusView && (
            <div
              className={styles.drawingLayer}
              style={{ zIndex: CANVAS_LAYERS.raised }}
            >
              <DrawingLayer
                drawings={workspace.drawings}
                frameLayout={objectLayout.layout}
                frameHost={frameHost}
                groupBounds={framePreviewBounds}
                draggingWidget={objectLayout.draggingWidget}
                frameDropTarget={objectLayout.dropTarget}
                view={view}
                placements={searchLayout?.drawings}
                onOpen={(id) => activateSearchResult({ kind: 'drawing', id })}
                layer="above"
                selectedId={
                  searchResult?.kind === 'drawing'
                    ? searchResult.id
                    : selectedDrawingId
                }
                consumingIds={consumingDrawingIds}
                draft={drawingDraft ?? undefined}
                interactive={
                  (tool === 'cursor' || tool === 'layout' || !!searchLayout) &&
                  !previewExiting
                }
                onPointerDown={startDrawingMove}
                onSelect={selectDrawing}
              />
            </div>
          )}
          {searchLayout &&
            searchLayout.results.map((result) => {
              if (result.kind !== 'widget' && result.kind !== 'tool')
                return null
              const place = (
                result.kind === 'widget'
                  ? searchLayout.widgets
                  : searchLayout.tools
              ).get(result.id)
              if (!place?.matches) return null
              return (
                <button
                  key={`${result.kind}:${result.id}`}
                  type="button"
                  className={styles.widgetResult}
                  data-search-result-kind={result.kind}
                  data-search-result-id={result.id}
                  data-preview-selected={
                    searchResult?.kind === result.kind &&
                    searchResult.id === result.id
                  }
                  style={{
                    left: place.x,
                    top: place.y,
                    width: 240,
                    height: 72,
                    transform: `scale(${place.scale})`,
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => activateSearchResult(result)}
                >
                  <SearchControlPreview
                    widgetId={result.kind === 'widget' ? result.id : undefined}
                    toolId={result.kind === 'tool' ? result.id : undefined}
                    status={status}
                    clockDateFormat={clockOptions.dateFormat}
                    notifications={notificationState}
                    tool={tool}
                    selectionShape={selectionShape}
                    favoriteAppIds={favoriteAppIds}
                  />
                </button>
              )
            })}
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
                zIndex: CANVAS_LAYERS.window + workspace.windows.length,
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
                      : CANVAS_LAYERS.window + workspace.windows.length,
                }}
              />
            )
          )}
        </div>
      </div>

      {!focusView &&
        !previewLayout &&
        tool !== 'layout' &&
        selectedDrawing &&
        !drawingDraft && (
          <DrawingActions
            key={selectedDrawing.id}
            drawing={
              objectLayout.placement({
                kind: 'drawing',
                id: selectedDrawing.id,
              }).surface === 'frame'
                ? {
                    ...selectedDrawing,
                    ...(() => {
                      const placement = objectLayout.placement({
                        kind: 'drawing',
                        id: selectedDrawing.id,
                      })
                      const b =
                        placement.surface === 'frame'
                          ? (framePreviewBounds.get(
                              `drawing:${selectedDrawing.id}`,
                            ) ??
                            getFrameBounds(
                              placement,
                              selectedDrawing.width,
                              selectedDrawing.height,
                              view,
                            ))
                          : selectedDrawing
                      return { ...b, x: b.x + view.x, y: b.y + view.y }
                    })(),
                  }
                : selectedDrawing
            }
            view={view}
            editing={tool === 'draw'}
            onPlay={gestureShortcuts.length > 0 ? playDrawing : undefined}
            onChangeLayout={() => {
              objectLayout.setSelected({
                kind: 'drawing',
                id: selectedDrawing.id,
              })
              setTool('layout')
            }}
            onDelete={() => {
              objectLayout.forget({ kind: 'drawing', id: selectedDrawing.id })
              preparePeekMotion({ backgroundOnly: true })
              setWorkspace((current) =>
                restoreBackgroundItems({
                  ...current,
                  drawings: current.drawings.filter(
                    (item) => item.id !== selectedDrawing.id,
                  ),
                }),
              )
              setSelectedDrawingId(null)
            }}
            onFinish={() => setSelectedDrawingId(null)}
          />
        )}
      {!focusView &&
        !previewLayout &&
        tool !== 'layout' &&
        selectedWindows.length > 0 && (
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
              const next = transformCanvasWorkspace(
                workspace,
                objectLayout.layout,
                (canvas) =>
                  gatherRelatedWindows(canvas, selectedIds, currentView),
              )
              if (next === workspace) return
              const preview = window.matchMedia(
                '(prefers-reduced-motion: reduce)',
              ).matches
                ? undefined
                : captureWindowPreview(windowElements.current)
              preparePeekMotion({ backgroundOnly: true })
              setWorkspace(restoreBackgroundItems(next))
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
      <FrameShell
        canvasHost={canvasHost}
        popoverHost={frameHost}
        selectedControlIds={selectedControlIds}
        onControlPointerDown={startControlGesture}
        onControlSizeChange={measureControl}
        layout={objectLayout.layout}
        view={view}
        editing={tool === 'layout'}
        selected={objectLayout.selected}
        draggingWidget={objectLayout.draggingWidget}
        groupDropTarget={objectLayout.groupDropTarget}
        hidden={!!previewLayout}
        inert={windowSwitcher.open}
        widgets={frameWidgets}
        renderItem={(target, edge) => {
          if (target.kind === 'item')
            return (
              <DesktopItems
                items={workspace.items.filter((item) => item.id === target.id)}
                selectedIds={selectedItemIds}
                frameLayout={objectLayout.layout}
                view={view}
                inline
                onPointerDown={startItemGesture}
                onSelect={selectDesktopItem}
                onOpen={openDesktopItem}
              />
            )
          const item =
            target.kind === 'window'
              ? workspace.windows.find((item) => item.id === target.id)
              : workspace.drawings.find((item) => item.id === target.id)
          if (!item) return null
          const vertical = edge === 'left' || edge === 'right'
          const width = Math.min(item.width, view.width - 48)
          const height = Math.min(item.height, view.height - 48)
          return (
            <FramePreviewSlot
              target={target}
              width={target.kind === 'window' && vertical ? 44 : width}
              height={target.kind === 'window' && !vertical ? 44 : height}
              onBounds={updateFramePreviewBounds}
            />
          )
        }}
      />
      {launcher && (
        <AppLauncher
          anchorRef={launcherTrigger}
          gestureShortcuts={gestureShortcuts}
          mode={launcher}
          editingGestures={editingGestures}
          onSaveGestureShortcut={saveGestureShortcut}
          onModeChange={(mode) => {
            setEditingGestures(false)
            setLauncher(mode)
          }}
          onCustomizeGestures={() => openGestureSettings()}
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
          key={canvasSearch.sessionId}
          handwritingOpen={canvasSearch.handwriting}
          onHandwritingOpenChange={(handwriting) =>
            setCanvasSearch((current) =>
              current ? { ...current, handwriting } : null,
            )
          }
          handwritingHeight={searchLayout.handwritingHeight}
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
