import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  type SetStateAction,
} from 'react'
import type {
  Bounds,
  CanvasTool,
  DesktopItem,
  DesktopWindow,
  WindowSelectionShape,
  Workspace,
} from '../types/desktop'
import type { CanvasDrawing } from '../types/drawing'
import type { CanvasSelection, DrawingDraft } from '../types/canvas-interaction'
import { getCanvasMoveDelta, getCanvasResizeBounds } from '../utils/canvas-grid'
import { clamp } from '../utils/desktop'
import { addDrawingStroke, MAX_DRAWING_STROKES } from '../utils/drawings'
import type { LayoutTarget, ObjectPlacement } from '../utils/frame-layout'
import {
  restoreDesktopDrag,
  type PointerSession,
  type PointerSessionDetails,
} from '../utils/pointer-session'
import { polygonIntersectsBounds } from '../utils/selection'
import type usePeekMotion from './use-peek-motion'
import type { SceneActions } from './use-scene'

interface CanvasGesturesOptions {
  viewport: RefObject<HTMLDivElement | null>
  workspace: Workspace
  setWorkspace: Dispatch<SetStateAction<Workspace>>
  view: Bounds
  tool: CanvasTool
  focusView: boolean
  previewLayout: boolean
  previewExiting: boolean
  spaceHeld: boolean
  setSpaceHeld: (held: boolean) => void
  setFavoriteDropActive: (active: boolean) => void
  selectionShape: WindowSelectionShape
  selectedWindows: DesktopWindow[]
  selectedIds: string[]
  selectedItemIds: string[]
  selectedControlIds: string[]
  selectedDrawing: CanvasDrawing | undefined
  setSelectedDrawingId: (id: string | null) => void
  setSelectedIds: Dispatch<SetStateAction<string[]>>
  setSelectedItemIds: Dispatch<SetStateAction<string[]>>
  setSelectedControlIds: Dispatch<SetStateAction<string[]>>
  onCanvas: (kind: 'window' | 'item', id: string) => boolean
  placement: (target: LayoutTarget) => ObjectPlacement
  place: SceneActions['place']
  cancelPeekMotion: () => void
  preparePeekMotion: ReturnType<typeof usePeekMotion>['prepare']
  settleBackgroundItems: (workspace: Workspace) => Workspace
  settleCoveredItems: (workspace: Workspace) => Workspace
  closePopovers: () => void
  focusWindow: (id: string) => void
  isFavoriteDrop: (id: string | null, x: number, y: number) => boolean
  hoverFavoriteDrop: (id: string | null, x: number, y: number) => boolean
  dropFavorite: (id: string, x: number, y: number) => boolean
}

export function useCanvasGestures({
  viewport,
  workspace,
  setWorkspace,
  view,
  tool,
  focusView,
  previewLayout,
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
  placement,
  place,
  cancelPeekMotion,
  preparePeekMotion,
  settleBackgroundItems,
  settleCoveredItems,
  closePopovers,
  focusWindow,
  isFavoriteDrop,
  hoverFavoriteDrop,
  dropFavorite,
}: CanvasGesturesOptions) {
  const [dragging, setDragging] = useState(false)
  const [drawingDraft, setDrawingDraft] = useState<DrawingDraft | null>(null)
  const suppressedControlClick = useRef<string | null>(null)
  const [selection, setSelection] = useState<CanvasSelection | null>(null)
  const gesture = useRef<PointerSession | null>(null)
  const captureTarget = useRef<Element | null>(null)
  const latestPointer = useRef({ x: 0, y: 0, altKey: false })
  const finishPointerSession = useCallback(
    (cancelled = false) => {
      const current = gesture.current
      gesture.current = null
      const target = captureTarget.current
      captureTarget.current = null
      if (cancelled && current?.type === 'item-move' && current.moved) {
        if (current.controlId)
          suppressedControlClick.current = current.controlId
        setWorkspace((workspace) => restoreDesktopDrag(workspace, current))
      }
      if (
        cancelled &&
        current?.type === 'window-select' &&
        current.selectionShape === 'freeform'
      )
        setSelectedIds([])
      if (current && target?.hasPointerCapture(current.pointerId))
        target.releasePointerCapture(current.pointerId)
      setDragging(false)
      setFavoriteDropActive(false)
      setSelection(null)
      setDrawingDraft(null)
      if (cancelled) setSpaceHeld(false)
    },
    [setWorkspace, setSelectedIds, setFavoriteDropActive, setSpaceHeld],
  )

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
      const previous = current.points.at(-1)!
      if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1) return
      current.points.push(point)
      if (current.points.length > 4096)
        current.points = current.points.filter((_, index) => index % 2 === 0)
      setDrawingDraft((previous) => ({
        pinned: previous?.pinned,
        points: [...current.points],
        layer: current.drawingLayer,
      }))
      return
    }
    if (current.type === 'drawing-move') {
      const bounds = current.bounds
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
      const previousPoint = current.points.at(-1)!
      if (Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y) < 2)
        return
      current.points.push(point)
      // Bound the live stroke while preserving its overall shape on long drags.
      if (current.points.length > 4096)
        current.points = current.points.filter((_, index) => index % 2 === 0)
      const points = [...current.points]
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
        setSelectedItemIds([...new Set([...current.selectedItemIds, ...ids])])
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
          ...new Set([...current.selectedControlIds, ...controls]),
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
        setDragging(true)
      }
      current.moved = true
      const items = current.items ?? []
      const controls = current.controls ?? []
      const { x: moveX, y: moveY } = getCanvasMoveDelta(
        [...items, ...controls],
        current.bounds,
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
      const windows = current.windows
      const { x: moveX, y: moveY } = getCanvasMoveDelta(
        windows,
        current.bounds,
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
    const bounds = current.bounds
    setWorkspace((previous) => ({
      ...previous,
      windows: previous.windows.map((item) =>
        item.id !== current.id
          ? item
          : {
              ...item,
              ...getCanvasResizeBounds(
                bounds,
                current.edge,
                dx,
                dy,
                previous,
                latestPointer.current.altKey,
              ),
            },
      ),
    }))
  }

  function updateDragModifier(event: KeyboardEvent) {
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
  }

  function panAtEdge() {
    if (
      focusView ||
      (gesture.current?.type === 'drawing-move' &&
        placement({ kind: 'drawing', id: gesture.current.id }).surface ===
          'pinned') ||
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
  }

  function startGesture(
    event: ReactPointerEvent,
    details: PointerSessionDetails,
    preserveClick = false,
  ) {
    const { type } = details
    if (
      focusView ||
      previewLayout ||
      previewExiting ||
      gesture.current ||
      (event.button !== 0 && event.button !== 1) ||
      ((details.type === 'move' || details.type === 'resize') &&
        details.bounds.restore &&
        !(details.type === 'move' && details.windows.length > 1))
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
      ...details,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollX: canvas.scrollLeft,
      scrollY: canvas.scrollTop,
      moved: false,
    }
    setDragging(
      !preserveClick && type !== 'window-select' && type !== 'item-select',
    )
    if (details.type === 'window-select' || details.type === 'item-select') {
      setSelectedIds([])
      if (details.type === 'item-select') {
        setSelectedItemIds(details.selectedItemIds)
        setSelectedControlIds(details.selectedControlIds)
      }
      setSelection({
        target: details.type === 'window-select' ? 'windows' : 'items',
        points:
          details.type === 'window-select' &&
          details.selectionShape === 'freeform'
            ? details.points
            : undefined,
        x: canvas.scrollLeft + event.clientX,
        y: canvas.scrollTop + event.clientY,
        width: 0,
        height: 0,
      })
    }
    if (details.type === 'move' || details.type === 'resize')
      focusWindow(details.id)
    return true
  }

  function startSelection(
    event: ReactPointerEvent,
    target: 'windows' | 'items',
  ) {
    const canvas = viewport.current
    if (!canvas) return
    const additive = event.shiftKey || event.metaKey || event.ctrlKey
    startGesture(
      event,
      target === 'windows'
        ? {
            type: 'window-select',
            selectionShape,
            points: [
              {
                x: canvas.scrollLeft + event.clientX,
                y: canvas.scrollTop + event.clientY,
              },
            ],
          }
        : {
            type: 'item-select',
            selectedItemIds: additive ? selectedItemIds : [],
            selectedControlIds: additive ? selectedControlIds : [],
          },
    )
  }

  function startWindowMove(event: ReactPointerEvent, item: DesktopWindow) {
    startGesture(event, {
      type: 'move',
      id: item.id,
      bounds: item,
      windows:
        selectedWindows.length > 1 && selectedIds.includes(item.id)
          ? selectedWindows
          : [item],
    })
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
    const layer = existing?.layer ?? 'above'
    gesture.current = {
      pointerId: event.pointerId,
      type: 'draw',
      startX: event.clientX,
      startY: event.clientY,
      scrollX: canvas.scrollLeft,
      scrollY: canvas.scrollTop,
      moved: false,
      id: existing?.id,
      points,
      drawingLayer: layer,
    }
    setSelectedIds([])
    setSelectedItemIds([])
    setSelectedControlIds([])
    setDrawingDraft({
      points,
      layer,
      pinned: existing
        ? placement({ kind: 'drawing', id: existing.id }).surface === 'pinned'
        : true,
    })
    closePopovers()
  }

  function selectDrawing(id: string) {
    setSelectedDrawingId(id)
    setSelectedIds([])
    setSelectedItemIds([])
    setSelectedControlIds([])
    closePopovers()
    viewport.current?.focus({ preventScroll: true })
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
    if (startGesture(event, { type: 'drawing-move', id, bounds: drawing }))
      selectDrawing(id)
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
      placement({ kind: 'item', id: item.id }).surface === 'frame'
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
      startGesture(event, { type: 'pan' })
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
    startGesture(event, {
      type: 'item-move',
      id: item.id,
      bounds: item,
      items: workspace.items.filter(
        (entry) => ids.includes(entry.id) && onCanvas('item', entry.id),
      ),
      controls: (workspace.controls ?? []).filter((control) =>
        controlIds.includes(control.id),
      ),
    })
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
    startGesture(
      event,
      {
        type: 'item-move',
        controlId: id,
        bounds: control,
        items: workspace.items.filter(
          (item) => itemIds.includes(item.id) && onCanvas('item', item.id),
        ),
        controls: (workspace.controls ?? []).filter((entry) =>
          ids.includes(entry.id),
        ),
      },
      true,
    )
  }

  function endGesture(event: ReactPointerEvent) {
    if (gesture.current?.pointerId !== event.pointerId) return
    latestPointer.current.altKey = event.altKey
    const completed = gesture.current
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
    if (completed.type === 'draw') {
      if (event.type === 'pointerup') {
        applyGesture(event.clientX, event.clientY)
        const current = completed
        const existing =
          workspace.drawings.find((item) => item.id === current.id) ?? null
        const drawing = addDrawingStroke(
          existing,
          current.points,
          current.drawingLayer,
          workspace,
        )
        const pinned =
          !existing ||
          placement({ kind: 'drawing', id: existing.id }).surface === 'pinned'
        if (!pinned)
          preparePeekMotion({ backgroundOnly: true, drawingOrigin: drawing })
        setWorkspace((previous) => {
          const next = {
            ...previous,
            drawings: existing
              ? previous.drawings.map((item) =>
                  item.id === drawing.id ? drawing : item,
                )
              : [...previous.drawings, drawing],
          }
          return pinned ? next : settleBackgroundItems(next)
        })
        if (!existing)
          place(
            { kind: 'drawing', id: drawing.id },
            { surface: 'pinned', x: drawing.x - view.x, y: drawing.y - view.y },
            { settle: false },
          )
        setSelectedDrawingId(drawing.id)
      }
      setDrawingDraft(null)
    }
    if (
      completed.type === 'window-select' &&
      completed.selectionShape === 'freeform'
    ) {
      if (event.type === 'pointerup') applyGesture(event.clientX, event.clientY)
      else setSelectedIds([])
    }
    finishPointerSession(event.type !== 'pointerup')
  }

  function moveGesture(event: ReactPointerEvent<HTMLElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return
    latestPointer.current = {
      x: event.clientX,
      y: event.clientY,
      altKey: event.altKey,
    }
    applyGesture(event.clientX, event.clientY)
  }

  const isGestureActive = useCallback(() => gesture.current !== null, [])
  return {
    dragging,
    drawingDraft,
    selection,
    finishPointerSession,
    isGestureActive,
    isCaptureTarget: (target: EventTarget) => target === captureTarget.current,
    clearSuppressedControlClick() {
      suppressedControlClick.current = null
    },
    consumeSuppressedControlClick(id?: string) {
      if (id !== suppressedControlClick.current) return false
      suppressedControlClick.current = null
      return true
    },
    updateDragModifier,
    panAtEdge,
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
  }
}
