import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type UIEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { transformCanvasWorkspace } from '../utils/layout-workspace'
import useObjectLayout from './use-object-layout'
import useScene from './use-scene'
import { useSystemStatus } from './use-system-status'
import { useNotifications } from './use-notifications'
import { CANVAS_TOOL_CATALOG } from '../constants/canvas-tool-catalog'
import {
  FRAME_WIDGETS,
  getFrameBounds,
  getPinnedWindowOffset,
  getTargetGroup,
  getWidgetExpanded,
  targetKey,
  type FrameEdge,
  type LayoutTarget,
} from '../utils/frame-layout'
import {
  getLayoutItemOptions,
  setLayoutItemOptions,
} from '../utils/layout-item-options'
import type { ClockDateFormat } from '../utils/clock-format'
import type { GesturePoint } from '../types/gestures'
import { recognizeGesture } from '../utils/gesture-recognition'
import {
  animateWindowReveal,
  captureWindowPreview,
  type PreviewSnapshot,
} from '../services/preview-motion'
import { cancelHandwritingRecognition } from '../services/handwriting'
import {
  getCanvasSearchLayout,
  getWindowSwitcherLayout,
  type CanvasSearchResult,
} from '../utils/canvas-search'
import { APP_CATALOG, type LauncherApp } from '../constants/launcher-apps'
import { arrangeWindows, clamp, MIN_WIDTH } from '../utils/desktop'
import {
  saveCanvasTool,
  loadCanvasTool,
  loadWindowSelectionShape,
  saveWindowSelectionShape,
} from '../services/desktop-preferences'
import { type DesktopWindow, type DesktopItem } from '../types/desktop'
import useBackground from './use-background'
import useAI from './use-ai'
import useShellPeek from './use-shell-peek'
import useInputModality from './use-input-modality'
import useWindowSwitcher from './use-window-switcher'
import usePeekMotion from './use-peek-motion'
import {
  restoreBackgroundItems as restoreCanvasBackground,
  settleBackgroundItems as settleCanvasBackground,
  settleCoveredItems as settleCanvasCovered,
} from '../utils/peek-layout'
import { gatherRelatedWindows } from '../utils/gather-windows'
import { getMaximizedBounds, getWindowClearance } from '../utils/window-layout'
import type { SettingsNavigationRequest } from '../types/settings'
import type { NotificationTarget } from '../types/notifications'
import type { SystemPanel } from '../types/system-status'
import { useCanvasGestures } from './use-canvas-gestures'
import { useDesktopPreferences } from './use-desktop-preferences'
import { useDockFavorites } from './use-dock-favorites'
import { useFramePreviewBounds } from './use-frame-preview-bounds'

type ShellPanel =
  | { kind: 'notifications' }
  | { kind: 'system'; panel: Exclude<SystemPanel, null> }
  | { kind: 'overview' }
  | { kind: 'launcher'; mode: 'apps' | 'gestures' }
  | { kind: 'dock'; appId: string }
  | null

export function useDesktop() {
  const inputModality = useInputModality()
  const background = useBackground()
  const ai = useAI()
  const {
    accentTheme,
    accent,
    colorMode,
    gestureShortcuts,
    changeAccentTheme,
    changeColorMode,
    saveGestureShortcut,
    removeGestureShortcut,
  } = useDesktopPreferences()
  const {
    workspace,
    setWorkspace,
    layout,
    setLayout,
    view,
    setView,
    removeObject,
    sceneActions,
  } = useScene()
  const {
    launcherTrigger,
    favoriteAppIds,
    favoriteDropActive,
    setFavoriteDropActive,
    justFavoritedAppId,
    returningFavoriteIds,
    isFavoriteDrop,
    hoverFavoriteDrop,
    dropFavorite,
  } = useDockFavorites(workspace.items)
  const [activeId, setActiveId] = useState<string | null>(
    workspace.windows.at(-1)?.id ?? null,
  )
  const [focusView, setFocusView] = useState<{
    id: string
    x: number
    y: number
  } | null>(null)
  const [spaceHeld, setSpaceHeld] = useState(false)
  const [shellPanel, setShellPanel] = useState<ShellPanel>(null)
  const [locked, setLocked] = useState(false)
  const showMap = shellPanel?.kind === 'overview'
  const notificationsOpen = shellPanel?.kind === 'notifications'
  const systemPanel = shellPanel?.kind === 'system' ? shellPanel.panel : null
  const launcher = shellPanel?.kind === 'launcher' ? shellPanel.mode : null
  const dockAppId = shellPanel?.kind === 'dock' ? shellPanel.appId : null
  const status = useSystemStatus()
  const clockOptions = getLayoutItemOptions(layout, 'widget:clock')
  const notificationState = useNotifications()
  const [widgetReveal, setWidgetReveal] = useState<{
    id: string
    onFrame: boolean
  } | null>(null)
  const [toolMenuRequest, setToolMenuRequest] = useState(0)
  const [tool, setTool] = useState(loadCanvasTool)
  const [frameHost, setFrameHost] = useState<HTMLDivElement | null>(null)
  const [popoverHost, setPopoverHost] = useState<HTMLDivElement | null>(null)
  const [pinnedDrawingHost, setPinnedDrawingHost] =
    useState<HTMLDivElement | null>(null)
  const [layoutDragHost, setLayoutDragHost] = useState<HTMLDivElement | null>(
    null,
  )
  const [canvasHost, setCanvasHost] = useState<HTMLDivElement | null>(null)
  const { framePreviewBounds, updateFramePreviewBounds } =
    useFramePreviewBounds()
  const [expandedPinnedId, setExpandedPinnedId] = useState<string | null>(null)
  const [hoveredPinnedId, setHoveredPinnedId] = useState<string | null>(null)
  const [closingPinnedId, setClosingPinnedId] = useState<string | null>(null)
  const [selectedDrawingId, setSelectedDrawingId] = useState<string | null>(
    null,
  )
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
  const [settingsNavigation, setSettingsNavigation] = useState<{
    windowId: string
    request: SettingsNavigationRequest
  } | null>(null)
  const [revealRequest, setRevealRequest] = useState<{
    id: string
    left: number
    top: number
    preview?: PreviewSnapshot
    focus?: boolean
  } | null>(null)
  const previewExiting = !!revealRequest?.preview
  const windowElements = useRef(new Map<string, HTMLElement>())
  useLayoutEffect(() => {
    if (drawingLaunchId)
      windowElements.current
        .get(drawingLaunchId)
        ?.focus({ preventScroll: true })
  }, [drawingLaunchId])
  const viewport = useRef<HTMLDivElement>(null)
  const home = workspace.home
  const windowClearance = getWindowClearance(view.width)
  const shellPeek = useShellPeek(focusView !== null, shellPanel !== null)
  const focusedWindowId = workspace.windows.some((item) => item.id === activeId)
    ? activeId
    : (workspace.windows.at(-1)?.id ?? null)
  const windowSwitcher = useWindowSwitcher({
    enabled: !locked,
    windows: workspace.windows,
    activeWindowId: focusedWindowId,
    onCommit: (id) => revealWindow(id, { center: true }),
    onOpen: () => {
      setWidgetReveal(null)
      setCanvasSearch(null)
      setShellPanel(null)
      setRevealRequest(null)
      const canvas = viewport.current
      if (canvas)
        setSwitcherOrigin({ x: canvas.scrollLeft, y: canvas.scrollTop })
      canvas?.scrollTo({
        left: canvas.scrollLeft,
        top: canvas.scrollTop,
        behavior: 'instant',
      })
      finishPointerSession(true)
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
    sceneActions,
    layout,
    setLayout,
    view,
    tool === 'layout' && !locked,
    (target) =>
      preparePeekMotion({
        excludedWindowId: target.kind === 'window' ? target.id : undefined,
        excludedControlId: target.kind === 'widget' ? target.id : undefined,
      }),
    { hover: hoverFavoriteDrop, drop: dropFavorite },
  )
  const setLayoutSelection = objectLayout.setSelected
  const activeLayoutDragHost = objectLayout.draggingTarget
    ? layoutDragHost
    : null
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
    setShellPanel(null)
  }, [setCanvasSearch])

  const {
    dragging,
    drawingDraft,
    selection,
    finishPointerSession,
    isGestureActive,
    isCaptureTarget,
    clearSuppressedControlClick,
    consumeSuppressedControlClick,
    updateDragModifier: handleDragModifier,
    panAtEdge: panGestureAtEdge,
    startGesture,
    moveGesture,
    endGesture,
    startSelection,
    startWindowMove,
    startDrawing,
    selectDrawing,
    startDrawingMove,
    selectDesktopItem,
    startItemGesture,
    startControlGesture,
  } = useCanvasGestures({
    viewport,
    workspace,
    setWorkspace,
    view,
    tool,
    focusView: focusView !== null,
    previewLayout: previewLayout !== null,
    previewExiting,
    spaceHeld,
    setSpaceHeld,
    setFavoriteDropActive,
    selectionShape,
    selectedWindows,
    selectedIds,
    selectedItemIds,
    selectedControlIds,
    selectedDrawing,
    setSelectedDrawingId,
    setSelectedIds,
    setSelectedItemIds,
    setSelectedControlIds,
    onCanvas,
    placement: objectLayout.placement,
    place: sceneActions.place,
    cancelPeekMotion,
    preparePeekMotion,
    settleBackgroundItems,
    settleCoveredItems,
    closePopovers,
    focusWindow,
    isFavoriteDrop,
    hoverFavoriteDrop,
    dropFavorite,
  })

  const openShellPanel = useCallback(
    (panel: ShellPanel) => {
      setWidgetReveal(null)
      setCanvasSearch(null)
      setSpaceHeld(false)
      setShellPanel(panel)
    },
    [setCanvasSearch],
  )

  const toggleShellPanel = useCallback(
    (kind: 'overview' | 'notifications') => {
      setWidgetReveal(null)
      setCanvasSearch(null)
      setSpaceHeld(false)
      setShellPanel((current) => (current?.kind === kind ? null : { kind }))
    },
    [setCanvasSearch],
  )

  // An outside-click listener may finish after another panel has opened.
  const dismissShellPanel = useCallback(
    (kind: NonNullable<ShellPanel>['kind']) => {
      setShellPanel((current) => (current?.kind === kind ? null : current))
    },
    [],
  )

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
      setSpaceHeld(false)
      setSelectedIds([])
      setSelectedItemIds([])
      setSelectedControlIds([])
      setSelectedDrawingId(null)
      setTool('search')
      setRevealRequest(null)
      finishPointerSession(true)
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
      finishPointerSession,
      cancelPeekMotion,
      leaveFocusView,
      setSelectedIds,
      setSelectedItemIds,
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
    finishPointerSession(true)
    setSelectedDrawingId(null)
    setSelectedIds([])
    setSelectedItemIds([])
    setSelectedControlIds([])
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
    finishPointerSession,
    cancelPeekMotion,
    preparePeekMotion,
    objectLayout.layout,
    restoreBackgroundItems,
    leaveFocusView,
    setWorkspace,
    setSelectedIds,
    setSelectedItemIds,
  ])

  function activateCanvasTool(id: string, toggle = false) {
    const entry = CANVAS_TOOL_CATALOG.find((item) => item.id === id)
    if (!entry) return
    if ('action' in entry) {
      if (entry.action === 'map') {
        if (toggle) toggleShellPanel('overview')
        else openShellPanel({ kind: 'overview' })
      } else arrangeAllWindows()
      return
    }
    closePopovers()
    finishPointerSession(true)
    if (entry.mode !== 'draw') setSelectedDrawingId(null)
    setSelectedIds([])
    setSelectedItemIds([])
    setSelectedControlIds([])
    if (entry.mode === 'layout') {
      leaveFocusView()
      setLayoutSelection(null)
    }
    setTool(entry.mode)
    if ('shape' in entry) setSelectionShape(entry.shape)
  }

  useLayoutEffect(() => {
    viewport.current?.scrollTo(home.x, home.y)
  }, [home.x, home.y])

  const finishWidgetReveal = useEffectEvent((id: string) => {
    setWidgetReveal(null)
    if (id === 'notifications') openShellPanel({ kind: 'notifications' })
    else if (id === 'apps') {
      openShellPanel({ kind: 'launcher', mode: 'apps' })
    } else if (id === 'tools') setToolMenuRequest((current) => current + 1)
    else if (
      id === 'wifi' ||
      id === 'bluetooth' ||
      id === 'volume' ||
      id === 'battery' ||
      id === 'power' ||
      id === 'clock'
    )
      openShellPanel({ kind: 'system', panel: id })
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
    saveCanvasTool(tool)
  }, [tool])

  useEffect(() => {
    saveWindowSelectionShape(selectionShape)
  }, [selectionShape])

  const layoutDrawingId =
    tool === 'layout' && objectLayout.selected?.kind === 'drawing'
      ? objectLayout.selected.id
      : null
  const activeDrawingId = layoutDrawingId ?? selectedDrawingId
  const finishDrawing = useCallback(() => {
    setSelectedDrawingId(null)
    if (layoutDrawingId) setLayoutSelection(null)
  }, [layoutDrawingId, setLayoutSelection])
  const deleteDrawing = useCallback(() => {
    if (!activeDrawingId) return
    preparePeekMotion({ backgroundOnly: true })
    removeObject({ kind: 'drawing', id: activeDrawingId })
    finishDrawing()
  }, [activeDrawingId, preparePeekMotion, removeObject, finishDrawing])

  const keydown = useEffectEvent((event: KeyboardEvent) => {
    if (locked || document.querySelector(':modal')) return
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault()
      openCanvasSearch({
        x: window.innerWidth / 2,
        y: window.innerHeight / 3,
      })
      return
    }
    if (event.key === 'Escape') {
      if (tool === 'layout') setTool('cursor')
      if (canvasSearch) {
        event.preventDefault()
        setCanvasSearch(null)
        viewport.current?.focus({ preventScroll: true })
      }
      closePopovers()
      setSelectedIds([])
      setSelectedItemIds([])
      setSelectedControlIds([])
      setSelectedDrawingId(null)
      finishPointerSession(true)
      if (launcher) launcherTrigger.current?.focus({ preventScroll: true })
    }
    if (
      event.target instanceof HTMLElement &&
      event.target.closest('input, textarea, select, [contenteditable="true"]')
    )
      return
    if (launcher || event.metaKey || event.ctrlKey || event.altKey) return
    if (
      activeDrawingId &&
      (event.key === 'Delete' || event.key === 'Enter') &&
      !event.shiftKey &&
      !event.isComposing &&
      !event.defaultPrevented &&
      !previewLayout &&
      !previewExiting &&
      !focusView &&
      !isGestureActive() &&
      !document.querySelector(':modal')
    ) {
      const target = event.target instanceof Element ? event.target : null
      if (
        target?.closest('[data-window-id]') ||
        (event.key === 'Enter' && target?.closest('button, a[href]'))
      )
        return
      event.preventDefault()
      if (!event.repeat) {
        if (event.key === 'Delete') deleteDrawing()
        else finishDrawing()
      }
      return
    }
    if (event.key === '/') {
      event.preventDefault()
      openCanvasSearch({
        x: window.innerWidth / 2,
        y: window.innerHeight / 3,
      })
      return
    }
    const shortcut = CANVAS_TOOL_CATALOG.find(
      (entry) => entry.shortcut.toLowerCase() === event.key.toLowerCase(),
    )
    if (shortcut) {
      event.preventDefault()
      if (!event.repeat) activateCanvasTool(shortcut.id, true)
      return
    }
    if (event.key.toLowerCase() === 'g')
      openShellPanel({ kind: 'launcher', mode: 'gestures' })
    if (event.key.toLowerCase() === 'n') toggleShellPanel('notifications')
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
  })

  useEffect(() => {
    const resize = () =>
      setView((current) => ({
        ...current,
        width: window.innerWidth,
        height: window.innerHeight,
      }))
    const release = () => finishPointerSession(true)
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
  }, [setView, finishPointerSession])

  useEffect(() => {
    if (!launcher) return
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Element &&
        !event.target.closest('[data-launcher-root], [data-launcher-trigger]')
      )
        dismissShellPanel('launcher')
    }
    document.addEventListener('pointerdown', dismiss, true)
    return () => document.removeEventListener('pointerdown', dismiss, true)
  }, [launcher, dismissShellPanel])

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

  // Keep the canvas shortcut listener ahead of the drag modifier listener.
  const updateDragModifier = useEffectEvent(handleDragModifier)
  const panAtEdge = useEffectEvent(panGestureAtEdge)

  useEffect(() => {
    window.addEventListener('keydown', updateDragModifier)
    window.addEventListener('keyup', updateDragModifier)
    return () => {
      window.removeEventListener('keydown', updateDragModifier)
      window.removeEventListener('keyup', updateDragModifier)
    }
  }, [])

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

  function openDesktopItem(item: DesktopItem) {
    if (tool === 'layout' || previewExiting) return
    if (canvasSearch) {
      activateSearchResult({ kind: 'item', id: item.id })
      return
    }
    const app = APP_CATALOG.find((entry) => entry.id === item.appId)
    if (app) launchApp(app)
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
    finishPointerSession(true)
    setSelectedIds([])
    setSelectedItemIds([])
    setSelectedControlIds([])
    setRevealRequest(null)
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

  function matchGesture(strokes: GesturePoint[][]) {
    const match = recognizeGesture(strokes, gestureShortcuts)
    return APP_CATALOG.find((item) => item.id === match?.appId)
  }

  function playLauncherGesture(points: GesturePoint[]) {
    const app = matchGesture([points])
    if (!app) return false
    launchApp(app)
    return true
  }

  function playDrawing() {
    if (!selectedDrawing || consumingDrawingIds.includes(selectedDrawing.id))
      return false
    const app = matchGesture(selectedDrawing.strokes)
    if (!app) return false
    const drawingId = selectedDrawing.id
    const windowId = addWindow(
      app,
      {
        x: selectedDrawing.x + selectedDrawing.width / 2,
        y: selectedDrawing.y + selectedDrawing.height / 2,
      },
      drawingId,
    )
    setDrawingLaunchId(windowId)
    setConsumingDrawingIds((current) => [...current, drawingId])
    setSelectedDrawingId(null)
    setTool('cursor')
    const timer = window.setTimeout(() => {
      preparePeekMotion({ backgroundOnly: true })
      removeObject({ kind: 'drawing', id: drawingId })
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
    openShellPanel(launcher ? null : { kind: 'launcher', mode: 'apps' })
  }

  function closeLauncher() {
    dismissShellPanel('launcher')
    launcherTrigger.current?.focus({ preventScroll: true })
  }

  function launchApp(app: LauncherApp) {
    setRevealRequest(null)
    addWindow(app)
    closeLauncher()
    closePopovers()
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
      viewport.current?.focus({ preventScroll: true })
    } else if (result.kind === 'drawing') {
      const drawing = workspace.drawings.find((entry) => entry.id === result.id)
      setTool('cursor')
      setSelectedDrawingId(result.id)
      if (
        drawing &&
        objectLayout.placement({ kind: 'drawing', id: result.id }).surface !==
          'pinned'
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

  function changeLayout() {
    activateCanvasTool('layout')
  }

  const surfaceEvents = {
    onPointerDownCapture(event: ReactPointerEvent<HTMLElement>) {
      if (locked) return
      clearSuppressedControlClick()
      objectLayout.events.onPointerDownCapture(event)
      if (
        tool !== 'layout' &&
        expandedPinnedId &&
        !(event.target as Element).closest(
          `[data-window-id="${expandedPinnedId}"], [data-layout-editor]`,
        )
      )
        setExpandedPinnedId(null)
    },
    onFocusCapture(event: FocusEvent<HTMLElement>) {
      if (locked) return
      if (
        expandedPinnedId &&
        !(event.target as Element).closest(
          `[data-window-id="${expandedPinnedId}"], [data-layout-editor]`,
        )
      )
        setExpandedPinnedId(null)
    },
    onPointerMove(event: ReactPointerEvent<HTMLElement>) {
      objectLayout.events.onPointerMove(event)
      moveGesture(event)
    },
    onPointerUp(event: ReactPointerEvent<HTMLElement>) {
      objectLayout.events.onPointerUp(event)
      endGesture(event)
    },
    onPointerCancel(event: ReactPointerEvent<HTMLElement>) {
      objectLayout.events.onPointerCancel(event)
      endGesture(event)
    },
    onLostPointerCapture(event: ReactPointerEvent<HTMLElement>) {
      objectLayout.events.onLostPointerCapture(event)
      if (isCaptureTarget(event.target)) endGesture(event)
    },
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (locked) return
      const control = (event.target as Element).closest<HTMLElement>(
        '[data-canvas-control-id]',
      )
      if (
        control &&
        consumeSuppressedControlClick(control.dataset.canvasControlId)
      ) {
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
    },
  }
  const viewportEvents = {
    onScroll(event: UIEvent<HTMLDivElement>) {
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
            current.x === x && current.y === y ? current : { ...current, x, y },
          )
        return
      }
      const { scrollLeft: x, scrollTop: y } = event.currentTarget
      setView((current) => ({ ...current, x, y }))
    },
    onPointerDownCapture(event: ReactPointerEvent<HTMLDivElement>) {
      if (
        focusView ||
        previewLayout ||
        previewExiting ||
        (event.target as Element).closest('dialog[open]')
      )
        return
      if (event.button === 1 || spaceHeld) startGesture(event, { type: 'pan' })
      else if (tool === 'draw' && event.button === 0) startDrawing(event)
      else if (
        tool === 'select' &&
        !(event.target as Element).closest('[data-grouped="true"]')
      )
        startSelection(event, 'windows')
    },
    onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
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
        } else if (tool === 'cursor') startSelection(event, 'items')
        else startGesture(event, { type: 'pan' })
      }
    },
  }

  function gatherWindows() {
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
      (canvas) => gatherRelatedWindows(canvas, selectedIds, currentView),
    )
    if (next === workspace) return
    const preview = window.matchMedia('(prefers-reduced-motion: reduce)')
      .matches
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
  }

  function lockScreen() {
    windowSwitcher.cancel(false)
    closePopovers()
    finishPointerSession(true)
    setLocked(true)
  }

  const systemWidgets = (
    ['clock', 'wifi', 'bluetooth', 'volume', 'battery', 'power'] as const
  ).map((id) => ({
    id,
    status,
    clockDateFormat: clockOptions.dateFormat,
    expanded: getWidgetExpanded(objectLayout.layout, id),
    openPanel: systemPanel,
    onLock: lockScreen,
    onPanelChange(panel: SystemPanel) {
      if (panel) openShellPanel({ kind: 'system', panel })
      else dismissShellPanel('system')
    },
  }))

  const itemActions = {
    onPointerDown: startItemGesture,
    onSelect: selectDesktopItem,
    onOpen: openDesktopItem,
  }

  function frameItem(target: LayoutTarget, edge?: FrameEdge) {
    if (target.kind === 'item') {
      return {
        kind: 'item' as const,
        props: {
          items: workspace.items.filter((item) => item.id === target.id),
          selectedIds: selectedItemIds,
          frameLayout: objectLayout.layout,
          view,
          inline: true,
          ...itemActions,
        },
      }
    }
    const item =
      target.kind === 'window'
        ? workspace.windows.find((item) => item.id === target.id)
        : undefined
    if (!item) return null
    const vertical = edge === 'left' || edge === 'right'
    return {
      kind: 'window' as const,
      props: {
        target,
        width: vertical ? 44 : Math.min(item.width, view.width - 48),
        height: vertical ? Math.min(item.height, view.height - 48) : 44,
        onBounds: updateFramePreviewBounds,
      },
    }
  }

  const windows = workspace.windows.map((item, index) => {
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
    const attached = !previewLayout && objectPlacement.surface === 'frame'
    const slot = grouped
      ? framePreviewBounds.get(`window:${item.id}`)
      : undefined
    const expanded = expandedPinnedId === item.id
    const hovered = tool !== 'layout' && hoveredPinnedId === item.id
    const frameBounds = attached
      ? getFrameBounds(objectPlacement, item.width, item.height, view)
      : null
    if (frameBounds && slot && objectPlacement.surface === 'frame') {
      if (objectPlacement.edge === 'top' || objectPlacement.edge === 'bottom') {
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
                      : view.height - slot.frame.y) + (hovered ? 58 : 0),
              )
            : hovered
              ? 100
              : 42,
        )
      : { x: 0, y: 0 }
    const app = APP_CATALOG.find((entry) => entry.id === item.appId)
    const appId =
      app?.id ?? (item.kind === 'notes' ? 'notes' : 'workspace-windows')
    const selected = selectedIds.includes(item.id)
    return {
      id: item.id,
      frame: {
        item,
        index,
        windowCount: workspace.windows.length,
        appId,
        view,
        container:
          activeLayoutDragHost &&
          (movingGroup ||
            (objectLayout.draggingTarget?.kind === 'window' &&
              objectLayout.draggingTarget.id === item.id))
            ? activeLayoutDragHost
            : attached
              ? frameHost
              : canvasHost,
        placement,
        surface: objectPlacement.surface,
        edge: attached ? objectPlacement.edge : undefined,
        attached,
        expanded,
        slot,
        frameBounds,
        canvasBounds,
        offset,
        editing: tool === 'layout',
        layoutSelected:
          tool === 'layout' &&
          objectLayout.selected?.kind === 'window' &&
          objectLayout.selected.id === item.id,
        drawingLaunch: drawingLaunchId === item.id,
        active: focusedWindowId === item.id,
        focused: renderedFocusView?.id === item.id,
        otherFocused:
          renderedFocusView !== null && renderedFocusView.id !== item.id,
        inFocusView: focusView?.id === item.id,
        previewLayout: previewLayout !== null,
        previewExiting,
        previewSelected: previewWindowId === item.id,
        switcherOpen: windowSwitcher.open,
        selected,
        grouped: selectedWindows.length > 1 && selected,
        contentInert: !focusView && (tool === 'select' || tool === 'layout'),
        onElement(element: HTMLElement | null) {
          if (element) windowElements.current.set(item.id, element)
          else windowElements.current.delete(item.id)
        },
        onHover(hovered: boolean) {
          setHoveredPinnedId(hovered ? item.id : null)
        },
        onFocus: () => focusWindow(item.id),
        onMove: (event: ReactPointerEvent<HTMLElement>) =>
          startWindowMove(event, item),
        onMaximize: () => maximize(item),
        onToggleFocus: () => toggleFocusView(item),
        onClose: () => closeWindow(item.id),
        onResize: (event: ReactPointerEvent<HTMLDivElement>, edge: string) =>
          startGesture(event, {
            type: 'resize',
            id: item.id,
            bounds: item,
            edge,
          }),
        onSelectPreview: () =>
          windowSwitcher.open
            ? windowSwitcher.select(item.id)
            : activateSearchResult({ kind: 'window', id: item.id }),
      },
      settingsNavigation:
        settingsNavigation?.windowId === item.id
          ? settingsNavigation.request
          : undefined,
    }
  })

  const controls =
    searchLayout?.results.flatMap((result) => {
      if (result.kind !== 'widget' && result.kind !== 'tool') return []
      const position = (
        result.kind === 'widget' ? searchLayout.widgets : searchLayout.tools
      ).get(result.id)
      if (!position?.matches) return []
      return [
        {
          key: `${result.kind}:${result.id}`,
          kind: result.kind,
          id: result.id,
          selected:
            searchResult?.kind === result.kind && searchResult.id === result.id,
          position,
          onClick: () => activateSearchResult(result),
          preview: {
            widgetId: result.kind === 'widget' ? result.id : undefined,
            toolId: result.kind === 'tool' ? result.id : undefined,
            status,
            clockDateFormat: clockOptions.dateFormat,
            notifications: notificationState,
            tool,
            selectionShape,
            favoriteAppIds,
          },
        },
      ]
    }) ?? []

  return {
    surface: {
      tool,
      accentTheme,
      accentColor: accent.color,
      colorMode,
      inputModality,
      photo: background.photo,
      focused: renderedFocusView !== null,
      previewing: previewLayout !== null,
      previewExiting,
      shellVisible: !renderedFocusView || shellPeek,
      switching: windowSwitcher.open,
      view,
      world: workspace,
      setFrameHost,
      setPopoverHost,
      setLayoutDragHost,
      setPinnedDrawingHost,
      events: surfaceEvents,
    },
    canvas: {
      viewport,
      setCanvasHost,
      view,
      world: workspace,
      photo: background.photo,
      tool,
      focusView: focusView !== null,
      previewLayout: previewLayout !== null,
      spaceHeld,
      dragging,
      switcherOpen: windowSwitcher.open,
      switcherId: windowSwitcher.selectedId,
      windowCount: workspace.windows.length,
      selection,
      events: viewportEvents,
      items: {
        iconVariant: background.photo
          ? ('filled' as const)
          : ('outline' as const),
        items: previewLayout
          ? workspace.items
          : workspace.items.filter(
              (item) =>
                !getTargetGroup(objectLayout.layout, {
                  kind: 'item',
                  id: item.id,
                }),
            ),
        frameLayout: objectLayout.layout,
        frameHost,
        dragHost: activeLayoutDragHost,
        draggingId:
          objectLayout.draggingTarget?.kind === 'item'
            ? objectLayout.draggingTarget.id
            : undefined,
        view,
        selectedIds: selectedItemIds,
        returningIds: returningFavoriteIds,
        placements: previewLayout?.items,
        previewSelectedId:
          searchResult?.kind === 'item' ? searchResult.id : undefined,
        ...itemActions,
      },
      ink:
        !windowSwitcher.open && !focusView
          ? {
              drawings: workspace.drawings,
              frameLayout: objectLayout.layout,
              pinnedHost: pinnedDrawingHost,
              dragHost: activeLayoutDragHost,
              draggingId:
                objectLayout.draggingTarget?.kind === 'drawing'
                  ? objectLayout.draggingTarget.id
                  : undefined,
              view,
              placements: searchLayout?.drawings,
              onOpen: (id: string) =>
                activateSearchResult({ kind: 'drawing', id }),
              selectedId:
                searchResult?.kind === 'drawing'
                  ? searchResult.id
                  : selectedDrawingId,
              consumingIds: consumingDrawingIds,
              draft: drawingDraft ?? undefined,
              interactive:
                (tool === 'cursor' || tool === 'layout' || !!searchLayout) &&
                !previewExiting,
              onPointerDown: startDrawingMove,
              onSelect: selectDrawing,
            }
          : null,
      guide: objectLayout.dropTarget,
      controls,
    },
    windows,
    windowContent: {
      allowHideTools: objectLayout.layout.allowHideTools,
      onAllowHideToolsChange: objectLayout.setAllowHideTools,
      onRestoreCanvasTools: objectLayout.restoreTools,
      ai,
      note: workspace.note,
      accentTheme,
      colorMode,
      onColorModeChange: changeColorMode,
      gestureShortcuts,
      onSaveGestureShortcut: saveGestureShortcut,
      onRemoveGestureShortcut: removeGestureShortcut,
      onAccentThemeChange: changeAccentTheme,
      onChangeLayout: changeLayout,
      background: background.photo,
      backgroundBusy: background.busy,
      backgroundError: background.error,
      onBackgroundUpload: background.upload,
      onBackgroundFitChange: background.changeFit,
      onBackgroundReset: background.reset,
      onNoteChange: (note: string) =>
        setWorkspace((current) => ({ ...current, note })),
    },
    layoutEditor:
      tool === 'layout'
        ? {
            guide: { target: objectLayout.dropTarget, viewport: view },
            editor: {
              target: objectLayout.selected,
              title: objectLayout.title,
              placement: objectLayout.selected
                ? objectLayout.placement(objectLayout.selected)
                : null,
              onPlacementChange(
                next: Parameters<typeof objectLayout.place>[1],
              ) {
                if (objectLayout.selected)
                  objectLayout.place(objectLayout.selected, next)
              },
              expanded: objectLayout.expanded,
              onToggleExpanded: objectLayout.toggleExpanded,
              grouped:
                !!objectLayout.group || objectLayout.selected?.kind === 'group',
              onUngroup: objectLayout.ungroup,
              onFrame: objectLayout.attachSelected,
              onRemove: objectLayout.remove,
              onDone: () => activateCanvasTool('cursor'),
            },
            clock: {
              dateFormat: clockOptions.dateFormat,
              onDateFormatChange(dateFormat: ClockDateFormat) {
                setLayout((current) =>
                  setLayoutItemOptions(current, 'widget:clock', { dateFormat }),
                )
              },
              now: status.now,
            },
          }
        : null,
    toolsRemovalWarning: objectLayout.warning
      ? {
          onCancel: () => objectLayout.setWarning(false),
          onConfirm() {
            objectLayout.setWarning(false)
            setTool('cursor')
            openGestureSettings('system')
          },
        }
      : null,
    pinnedClose: closingPinnedId
      ? {
          onCancel: () => setClosingPinnedId(null),
          onConfirm: () => closeWindow(closingPinnedId, true),
        }
      : null,
    drawingActions:
      !focusView &&
      !previewLayout &&
      tool !== 'layout' &&
      selectedDrawing &&
      !drawingDraft
        ? {
            drawing: selectedDrawing,
            view,
            editing: tool === 'draw',
            onPlay: gestureShortcuts.length > 0 ? playDrawing : undefined,
            onChangeLayout() {
              changeLayout()
              objectLayout.setSelected({
                kind: 'drawing',
                id: selectedDrawing.id,
              })
            },
            onDelete: deleteDrawing,
            onFinish: finishDrawing,
          }
        : null,
    gathering:
      !focusView &&
      !previewLayout &&
      tool !== 'layout' &&
      selectedWindows.length > 0
        ? {
            key: `${ai.enabled}:${selectedIds.toSorted().join(',')}`,
            props: {
              windows: selectedWindows,
              view,
              enabled: ai.enabled,
              downloading: ai.downloading,
              onGather: gatherWindows,
            },
          }
        : null,
    frame: {
      canvasHost,
      dragHost: activeLayoutDragHost,
      popoverHost,
      selectedControlIds,
      onControlPointerDown: startControlGesture,
      onControlSizeChange: measureControl,
      layout: objectLayout.layout,
      view,
      editing: tool === 'layout',
      selected: objectLayout.selected,
      draggingWidget: objectLayout.draggingWidget,
      groupDropTarget: objectLayout.groupDropTarget,
      hidden: !!previewLayout,
      inert: windowSwitcher.open,
    },
    frameItem,
    notifications: {
      state: notificationState,
      expanded: getWidgetExpanded(objectLayout.layout, 'notifications'),
      open: notificationsOpen,
      previewVisible: !previewLayout && (!shellPanel || notificationsOpen),
      onToggle: () => toggleShellPanel('notifications'),
      onClose: () => dismissShellPanel('notifications'),
      onNavigate: openNotificationTarget,
    },
    canvasTools: {
      openRequest: toolMenuRequest,
      mode: tool,
      selectionShape,
      onSelectionShapeChange: activateCanvasTool,
      menusAllowed: !dragging && !previewLayout && !shellPanel,
      onModeChange: (mode: typeof tool) =>
        activateCanvasTool(mode === 'select' ? selectionShape : mode),
      onOpenToolMenu: closePopovers,
      mapOpen: showMap,
      onToggleMap: () => activateCanvasTool('map', true),
      onArrange: () => activateCanvasTool('arrange'),
      windowCount: workspace.windows.length,
    },
    dock: {
      favoriteAppIds,
      favoriteDropActive,
      justFavoritedAppId,
      open: launcher !== null,
      triggerRef: launcherTrigger,
      onToggle: toggleLauncher,
      onLaunch: launchApp,
      windows: workspace.windows,
      activeWindowId: focusedWindowId,
      selectedAppId: dockAppId,
      onSelectApp(id: string | null) {
        if (id) openShellPanel({ kind: 'dock', appId: id })
        else dismissShellPanel('dock')
      },
      onFocusWindow: revealWindow,
      onReorderWindows(orderedIds: string[]) {
        const order = new Map(orderedIds.map((id, index) => [id, index]))
        setWorkspace((current) => ({
          ...current,
          windows: current.windows.map((item) => {
            const dockOrder = order.get(item.id)
            return dockOrder === undefined ? item : { ...item, dockOrder }
          }),
        }))
      },
    },
    systemWidgets,
    launcher: launcher
      ? {
          anchorRef: launcherTrigger,
          onPlayGesture: playLauncherGesture,
          mode: launcher,
          onSaveGestureShortcut: saveGestureShortcut,
          onModeChange: (mode: NonNullable<typeof launcher>) =>
            openShellPanel({ kind: 'launcher', mode }),
          onCustomizeGestures: () => openGestureSettings(),
          onClose: closeLauncher,
          onLaunch: launchApp,
        }
      : null,
    overview: showMap
      ? {
          workspace,
          view,
          onNavigate(x: number, y: number) {
            if (!focusView) viewport.current?.scrollTo(x, y)
          },
        }
      : null,
    switcher:
      switcherWindow && switcherPlacement
        ? {
            title: switcherWindow.title,
            focusTarget: viewport,
            position: {
              x: switcherPlacement.x - switcherView.x,
              y:
                switcherPlacement.y -
                switcherView.y +
                switcherWindow.height * switcherPlacement.scale +
                10,
              width: switcherWindow.width * switcherPlacement.scale,
            },
          }
        : null,
    search:
      canvasSearch && searchLayout
        ? {
            sessionId: canvasSearch.sessionId,
            props: {
              handwritingOpen: canvasSearch.handwriting,
              onHandwritingOpenChange: (handwriting: boolean) =>
                setCanvasSearch((current) =>
                  current ? { ...current, handwriting } : null,
                ),
              handwritingHeight: searchLayout.handwritingHeight,
              position: searchLayout.position,
              resultsAbove: searchLayout.resultsAbove,
              query: canvasSearch.query,
              onQueryChange(query: string) {
                cancelHandwritingRecognition()
                setCanvasSearch({ ...canvasSearch, query, selected: 0 })
              },
              onRecognizedText(text: string) {
                const query = `${canvasSearch.query.trimEnd()} ${text}`.trim()
                setCanvasSearch({ ...canvasSearch, query, selected: 0 })
              },
              onClose() {
                cancelHandwritingRecognition()
                setCanvasSearch(null)
                viewport.current?.focus({ preventScroll: true })
              },
              onActivate() {
                cancelHandwritingRecognition()
                activateSearchResult(searchResult)
              },
              onNavigate(direction: 1 | -1) {
                const count = searchLayout.results.length
                if (count)
                  setCanvasSearch({
                    ...canvasSearch,
                    selected:
                      (canvasSearch.selected + direction + count) % count,
                  })
              },
              empty: searchLayout.results.length === 0,
            },
          }
        : null,
    lockScreen: locked
      ? {
          status,
          photo: background.photo,
          onUnlock(password: string) {
            if (password !== 'hearthspace') return false
            setLocked(false)
            return true
          },
        }
      : null,
  }
}
