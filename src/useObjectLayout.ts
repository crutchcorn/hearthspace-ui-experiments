import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type PointerEvent,
} from 'react'
import type { Workspace, Bounds } from './desktop'
import {
  loadFrameLayout,
  saveFrameLayout,
  getPlacement,
  setObjectPlacement,
  setAllowHideTools,
  targetKey,
  getFrameDropTarget,
  getFrameDragBounds,
  getFrameBounds,
  getWidgetFrameDropTarget,
  type LayoutTarget,
  type ObjectPlacement,
  type FrameEdge,
  FRAME_WIDGETS,
  getTargetGroup,
  getFrameGroups,
  mergeFrameTargets,
  ungroupFrameTarget,
  getWidgetExpanded,
  setWidgetExpanded,
  type FrameLayout,
} from './frame-layout'
import { transformCanvasWorkspace, settleLayoutDrop } from './layout-workspace'
import { mergeOverlappingFrameItems } from './frame-collisions'
import { restoreBackgroundItems } from './peek-layout'

export default function useObjectLayout(
  workspace: Workspace,
  setWorkspace: Dispatch<SetStateAction<Workspace>>,
  view: Bounds,
  editing: boolean,
  beforeSettle: (target: LayoutTarget) => void,
  favorites?: {
    hover: (itemId: string | null, x: number, y: number) => boolean
    drop: (itemId: string, x: number, y: number) => boolean
  },
) {
  const [layout, setLayout] = useState(() => {
    let initial = loadFrameLayout()
    for (const widget of FRAME_WIDGETS) {
      const target = { kind: 'widget' as const, id: widget.id }
      const saved = getPlacement(initial, target)
      if (
        (saved.surface === 'canvas' || saved.surface === 'background') &&
        (saved.x === undefined || saved.y === undefined)
      )
        initial = setObjectPlacement(initial, target, {
          ...saved,
          x: saved.x ?? view.x + 100,
          y: saved.y ?? view.y + 120,
        })
    }
    return initial
  })
  const [selected, setSelected] = useState<LayoutTarget | null>(null)
  const [groupDropTarget, setGroupDropTarget] = useState<LayoutTarget | null>(
    null,
  )
  const [warning, setWarning] = useState(false)
  const [draggingWidget, setDraggingWidget] = useState<{
    id: string
    edge?: FrameEdge
    center: { x: number; y: number }
  } | null>(null)
  const [dropTarget, setDropTarget] = useState<Extract<
    ObjectPlacement,
    { surface: 'frame' }
  > | null>(null)
  const drag = useRef<{
    pointerId: number
    target: LayoutTarget
    x: number
    y: number
    bounds: Bounds
    moved: boolean
    captureTarget: HTMLElement
    originalLayout: FrameLayout
    originalPlacement?: ObjectPlacement
    originalObject?:
      | Workspace['windows'][number]
      | Workspace['items'][number]
      | Workspace['drawings'][number]
  } | null>(null)
  const pendingSnap = useRef<{
    target: LayoutTarget
    from: Bounds
    preview: boolean
  } | null>(null)
  const motionFrame = useRef<number | null>(null)
  const snapAnimation = useRef<Animation | null>(null)
  const turnAnimation = useRef<Animation | null>(null)
  const cancelMotion = useCallback(() => {
    if (motionFrame.current !== null) cancelAnimationFrame(motionFrame.current)
    motionFrame.current = null
    pendingSnap.current = null
    snapAnimation.current?.cancel()
    turnAnimation.current?.cancel()
  }, [])
  useEffect(() => saveFrameLayout(layout), [layout])
  useEffect(() => cancelMotion, [cancelMotion])
  useLayoutEffect(() => {
    if (!pendingSnap.current || motionFrame.current !== null) return
    // Measure after the widget has laid out its new orientation. Keep this frame
    // queued across pointer updates so fast dragging cannot cancel the turn.
    motionFrame.current = requestAnimationFrame(() => {
      motionFrame.current = null
      const snap = pendingSnap.current
      pendingSnap.current = null
      if (!snap) return
      const element = targetElement(snap.target)
      if (
        !element ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        return
      const widget = isToolbar(snap.target)
      if (!snap.preview) snapAnimation.current?.cancel()
      const to = motionBounds(element, widget)
      if (!to.width || !to.height) return
      const from = snap.from
      const duration = { duration: 280, easing: 'cubic-bezier(0.2,0.7,0.1,1)' }
      const dx = from.x + from.width / 2 - (to.x + to.width / 2)
      const dy = from.y + from.height / 2 - (to.y + to.height / 2)
      if (widget) {
        const wasVertical = from.height > from.width
        const nowVertical = to.height > to.width
        if (wasVertical !== nowVertical) {
          const currentAngle =
            Number.parseFloat(getComputedStyle(element).rotate) || 0
          turnAnimation.current?.cancel()
          const startAngle = Math.max(
            -90,
            Math.min(90, currentAngle + (nowVertical ? -90 : 90)),
          )
          turnAnimation.current = element.animate(
            [{ rotate: `${startAngle}deg` }, { rotate: '0deg' }],
            duration,
          )
        }
        if (!snap.preview) {
          snapAnimation.current?.cancel()
          snapAnimation.current = element.animate(
            [{ translate: `${dx}px ${dy}px` }, { translate: '0px 0px' }],
            duration,
          )
        }
      } else {
        snapAnimation.current?.cancel()
        snapAnimation.current = element.animate(
          [
            {
              transformOrigin: 'center',
              transform: `translate(${dx}px, ${dy}px) scale(${from.width / to.width},${from.height / to.height})`,
            },
            {
              transformOrigin: 'center',
              transform: element.style.transform || 'none',
            },
          ],
          duration,
        )
      }
    })
  }, [layout])

  useLayoutEffect(() => {
    const frame = requestAnimationFrame(() => {
      if (drag.current) return
      const targets: LayoutTarget[] = [
        ...getFrameGroups(layout).map((group) => ({
          kind: 'group' as const,
          id: group.id,
        })),
        ...FRAME_WIDGETS.map((widget) => ({
          kind: 'widget' as const,
          id: widget.id,
        })),
        ...workspace.items.map((item) => ({
          kind: 'item' as const,
          id: item.id,
        })),
        ...workspace.windows.map((item) => ({
          kind: 'window' as const,
          id: item.id,
        })),
        ...workspace.drawings.map((item) => ({
          kind: 'drawing' as const,
          id: item.id,
        })),
      ]
      const entries = targets.flatMap((target) => {
        if (target.kind !== 'group' && getTargetGroup(layout, target)) return []
        const placement = getPlacement(layout, target)
        const element = targetElement(target)
        if (
          placement.surface !== 'frame' ||
          !element ||
          element.closest('[hidden]') ||
          (!element.offsetWidth && !element.getBoundingClientRect().width)
        )
          return []
        const rect = element.getBoundingClientRect()
        const mergedMobile =
          view.width <= 760 && element.closest('[data-mobile-bar]')
        const bounds = mergedMobile
          ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          : getFrameBounds(
              placement,
              element.offsetWidth || rect.width,
              element.offsetHeight || rect.height,
              view,
              target.kind === 'window' || target.kind === 'drawing'
                ? 'flush'
                : 'padded',
            )
        if (target.kind === 'window') {
          if (placement.edge === 'left' || placement.edge === 'right') {
            bounds.width = Math.min(42, bounds.width)
            if (placement.edge === 'right') bounds.x = view.width - bounds.width
          } else {
            bounds.height = Math.min(42, bounds.height)
            if (placement.edge === 'bottom')
              bounds.y = view.height - bounds.height
          }
        }
        return [{ target, bounds }]
      })
      const next = mergeOverlappingFrameItems(layout, entries)
      if (next === layout) return
      setLayout(next)
      setSelected((previous) => {
        if (!previous) return previous
        const representative =
          previous.kind === 'group'
            ? getTargetGroup(layout, previous)?.members[0]
            : previous
        const group = representative
          ? getTargetGroup(next, representative)
          : undefined
        return group ? { kind: 'group', id: group.id } : previous
      })
      setWorkspace((previous) =>
        transformCanvasWorkspace(previous, next, restoreBackgroundItems),
      )
    })
    return () => cancelAnimationFrame(frame)
  }, [
    layout,
    view,
    workspace.items,
    workspace.windows,
    workspace.drawings,
    setWorkspace,
  ])

  function motionBounds(element: HTMLElement, widget: boolean): Bounds {
    const rect = element.getBoundingClientRect()
    if (!widget) return rect
    // Rotation changes the bounding box, but not its center or layout dimensions.
    return {
      x: rect.x + (rect.width - element.offsetWidth) / 2,
      y: rect.y + (rect.height - element.offsetHeight) / 2,
      width: element.offsetWidth,
      height: element.offsetHeight,
    }
  }

  function queueMotion(target: LayoutTarget, preview = false) {
    const element = targetElement(target)
    if (!element) return
    const pending = pendingSnap.current
    if (pending && targetKey(pending.target) === targetKey(target)) {
      pending.preview &&= preview
      return
    }
    pendingSnap.current = {
      target,
      from: motionBounds(element, isToolbar(target)),
      preview,
    }
  }

  function isToolbar(target: LayoutTarget) {
    return target.kind === 'widget' || target.kind === 'group'
  }

  function findGroupDrop(source: LayoutTarget, x: number, y: number) {
    const members =
      source.kind === 'group'
        ? (getFrameGroups(layout).find((group) => group.id === source.id)
            ?.members ?? [])
        : [source]
    const elements = document.querySelectorAll<HTMLElement>(
      '[data-layout-widget], [data-desktop-item-id], [data-layout-group], [data-window-id], [data-drawing-id]',
    )
    const candidates = [...elements].flatMap((element) => {
      if (!element.getBoundingClientRect().width || element.closest('[hidden]'))
        return []
      const target: LayoutTarget = element.dataset.layoutWidget
        ? { kind: 'widget', id: element.dataset.layoutWidget }
        : element.dataset.desktopItemId
          ? { kind: 'item', id: element.dataset.desktopItemId }
          : element.dataset.windowId
            ? { kind: 'window', id: element.dataset.windowId }
            : element.dataset.drawingId
              ? { kind: 'drawing', id: element.dataset.drawingId }
              : { kind: 'group', id: element.dataset.layoutGroup! }
      if (
        targetKey(target) === targetKey(source) ||
        members.some((member) => targetKey(member) === targetKey(target))
      )
        return []
      if (
        target.kind === 'group' &&
        members.some(
          (member) => getTargetGroup(layout, member)?.id === target.id,
        )
      )
        return []
      const placement = getPlacement(layout, target)
      if (placement.surface !== 'frame') return []
      let bounds = element.getBoundingClientRect()
      if (target.kind === 'window') {
        const vertical = placement.edge === 'left' || placement.edge === 'right'
        const edgeBounds = getFrameBounds(
          placement,
          bounds.width,
          bounds.height,
          view,
        )
        bounds = new DOMRect(
          placement.edge === 'right' ? view.width - 42 : edgeBounds.x,
          placement.edge === 'bottom' ? view.height - 42 : edgeBounds.y,
          vertical ? 42 : edgeBounds.width,
          vertical ? edgeBounds.height : 42,
        )
      }
      if (
        x < bounds.left - 8 ||
        x > bounds.right + 8 ||
        y < bounds.top - 8 ||
        y > bounds.bottom + 8
      )
        return []
      const vertical = placement.edge === 'left' || placement.edge === 'right'
      return [
        {
          target,
          before: vertical
            ? y < bounds.y + bounds.height / 2
            : x < bounds.x + bounds.width / 2,
          area: bounds.width * bounds.height,
        },
      ]
    })
    return candidates.sort((a, b) => a.area - b.area)[0] ?? null
  }

  function targetElement(target: LayoutTarget) {
    const attribute =
      target.kind === 'group'
        ? 'data-layout-group'
        : target.kind === 'widget'
          ? 'data-layout-widget'
          : target.kind === 'item'
            ? 'data-desktop-item-id'
            : target.kind === 'window'
              ? 'data-window-id'
              : 'data-drawing-id'
    return document.querySelector<HTMLElement>(
      `[${attribute}="${CSS.escape(target.id)}"]`,
    )
  }

  const favoriteHover = useRef(favorites?.hover)
  useLayoutEffect(() => {
    favoriteHover.current = favorites?.hover
  }, [favorites?.hover])
  const cancelDrag = useCallback(() => {
    favoriteHover.current?.(null, 0, 0)
    const current = drag.current
    if (!current) return
    drag.current = null
    cancelMotion()
    setDraggingWidget(null)
    setDropTarget(null)
    setGroupDropTarget(null)
    if (current.captureTarget.hasPointerCapture(current.pointerId))
      current.captureTarget.releasePointerCapture(current.pointerId)
    if (!current.moved) return
    setLayout(current.originalLayout)
    if (current.originalObject && !isToolbar(current.target)) {
      const field =
        current.target.kind === 'window'
          ? 'windows'
          : current.target.kind === 'item'
            ? 'items'
            : 'drawings'
      const original = current.originalObject
      setWorkspace((previous) => ({
        ...previous,
        [field]: previous[field].map((item) =>
          item.id === current.target.id ? original : item,
        ),
      }))
    }
  }, [setWorkspace, cancelMotion])

  useEffect(() => {
    if (!editing) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelDrag()
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('blur', cancelDrag)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('blur', cancelDrag)
      cancelDrag()
    }
  }, [editing, cancelDrag])

  function placement(target: LayoutTarget): ObjectPlacement {
    const saved = getPlacement(layout, target)
    if (
      target.kind === 'drawing' &&
      !layout.placements[targetKey(target)] &&
      !getTargetGroup(layout, target)
    )
      return {
        surface:
          workspace.drawings.find((item) => item.id === target.id)?.layer ===
          'below'
            ? 'background'
            : 'canvas',
      }
    return saved
  }
  function place(target: LayoutTarget, next: ObjectPlacement, settle = true) {
    if (
      target.kind === 'group' &&
      settle &&
      (next.surface === 'canvas' || next.surface === 'background')
    ) {
      const group = getTargetGroup(layout, target)
      if (!group) return
      const surface = next.surface
      const groupBounds = targetElement(target)?.getBoundingClientRect()
      const destinations = group.members.map((member) => {
        const slot =
          member.kind === 'window' || member.kind === 'drawing'
            ? document.querySelector<HTMLElement>(
                `[data-frame-preview-slot="${CSS.escape(targetKey(member))}"]`,
              )
            : null
        const bounds = (slot ?? targetElement(member))?.getBoundingClientRect()
        return {
          target: member,
          bounds: {
            x: view.x + (bounds?.x ?? groupBounds?.x ?? 100),
            y: view.y + (bounds?.y ?? groupBounds?.y ?? 120),
            width: bounds?.width ?? 240,
            height: bounds?.height ?? 54,
          },
        }
      })
      // Groups belong to the frame. Moving one onto the painting releases its
      // members at their visible positions instead of leaving empty frame slots.
      let nextLayout = ungroupFrameTarget(layout, target)
      for (const destination of destinations)
        nextLayout = setObjectPlacement(nextLayout, destination.target, {
          surface,
          ...(destination.target.kind === 'widget'
            ? { x: destination.bounds.x, y: destination.bounds.y }
            : {}),
        })
      beforeSettle(target)
      setLayout(nextLayout)
      setSelected(null)
      setWorkspace((current) => {
        const positions = new Map(
          destinations.map(({ target: member, bounds }) => [
            targetKey(member),
            bounds,
          ]),
        )
        const position = <T extends Bounds & { id: string }>(
          item: T,
          kind: LayoutTarget['kind'],
        ): T => {
          const bounds = positions.get(targetKey({ kind, id: item.id }))
          if (!bounds) return item
          return {
            ...item,
            x: Math.max(0, Math.min(bounds.x, current.width - item.width)),
            y: Math.max(0, Math.min(bounds.y, current.height - item.height)),
            peekOrigin: undefined,
          }
        }
        let updated: Workspace = {
          ...current,
          windows: current.windows.map((item) => position(item, 'window')),
          items: current.items.map((item) => position(item, 'item')),
          drawings: current.drawings.map((item) => {
            const moved = position(item, 'drawing')
            return moved === item
              ? item
              : {
                  ...moved,
                  layer: surface === 'background' ? 'below' : 'above',
                }
          }),
        }
        for (const destination of destinations)
          updated = settleLayoutDrop(
            updated,
            nextLayout,
            destination.target,
            destination.bounds,
          )
        return updated
      })
      return
    }
    if (
      (next.surface === 'canvas' || next.surface === 'background') &&
      isToolbar(target) &&
      (next.x === undefined || next.y === undefined)
    )
      next = {
        ...next,
        x: next.x ?? view.x + 100,
        y: next.y ?? view.y + 120,
      }
    const previous = placement(target)
    if (
      settle &&
      (next.surface === 'frame' ||
        previous.surface === 'frame' ||
        isToolbar(target))
    ) {
      queueMotion(target)
    }
    const nextLayout = setObjectPlacement(layout, target, next)
    setLayout(nextLayout)
    if (settle) beforeSettle(target)
    if (
      settle ||
      target.kind === 'drawing' ||
      previous.surface !== next.surface
    )
      setWorkspace((current) => {
        const updated =
          target.kind === 'drawing'
            ? {
                ...current,
                drawings: current.drawings.map((item) =>
                  item.id === target.id
                    ? {
                        ...item,
                        layer:
                          next.surface === 'background'
                            ? ('below' as const)
                            : ('above' as const),
                        peekOrigin: undefined,
                      }
                    : item,
                ),
              }
            : current
        return settle
          ? settleLayoutDrop(
              updated,
              nextLayout,
              target,
              widgetBounds(target, next),
            )
          : transformCanvasWorkspace(
              updated,
              nextLayout,
              restoreBackgroundItems,
            )
      })
  }
  function move(target: LayoutTarget, x: number, y: number) {
    const field =
      target.kind === 'window'
        ? 'windows'
        : target.kind === 'item'
          ? 'items'
          : 'drawings'
    if (isToolbar(target)) {
      const previous = placement(target)
      place(
        target,
        {
          surface: previous.surface === 'background' ? 'background' : 'canvas',
          x,
          y,
        },
        false,
      )
      return
    }
    setWorkspace((current) => ({
      ...current,
      [field]: current[field].map((item) =>
        item.id === target.id
          ? {
              ...item,
              x: Math.max(0, Math.min(x, current.width - item.width)),
              y: Math.max(0, Math.min(y, current.height - item.height)),
              peekOrigin: undefined,
            }
          : item,
      ),
    }))
  }
  function onPointerDownCapture(event: PointerEvent<HTMLElement>) {
    if (
      !editing ||
      drag.current ||
      event.button !== 0 ||
      (event.target as Element).closest('[data-layout-editor]')
    )
      return
    const element = (event.target as Element).closest<HTMLElement>(
      '[data-layout-widget], [data-layout-group], [data-window-id], [data-desktop-item-id], [data-drawing-id]',
    )
    if (!element) return
    const target: LayoutTarget = element.dataset.layoutGroup
      ? { kind: 'group', id: element.dataset.layoutGroup }
      : element.dataset.layoutWidget
        ? { kind: 'widget', id: element.dataset.layoutWidget }
        : element.dataset.windowId
          ? { kind: 'window', id: element.dataset.windowId }
          : element.dataset.desktopItemId
            ? { kind: 'item', id: element.dataset.desktopItemId }
            : { kind: 'drawing', id: element.dataset.drawingId! }
    const movingElement = targetElement(target) ?? element
    const measured = motionBounds(movingElement, isToolbar(target))
    const bounds =
      target.kind === 'window' &&
      movingElement.dataset.pinnedCollapsed === 'true'
        ? getFrameDragBounds(measured, view)
        : measured
    cancelMotion()
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    setSelected(target)
    const currentPlacement = placement(target)
    if (isToolbar(target))
      setDraggingWidget({
        id: target.id,
        edge:
          currentPlacement.surface === 'frame'
            ? currentPlacement.edge
            : undefined,
        center: {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        },
      })
    drag.current = {
      pointerId: event.pointerId,
      target,
      x: event.clientX,
      y: event.clientY,
      bounds,
      moved: false,
      captureTarget: event.currentTarget,
      originalLayout: layout,
      originalPlacement: layout.placements[targetKey(target)],
      originalObject:
        target.kind === 'window'
          ? workspace.windows.find((item) => item.id === target.id)
          : target.kind === 'item'
            ? workspace.items.find((item) => item.id === target.id)
            : target.kind === 'drawing'
              ? workspace.drawings.find((item) => item.id === target.id)
              : undefined,
    }
  }
  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    if (!editing) {
      cancelDrag()
      return
    }
    const dx = event.clientX - current.x,
      dy = event.clientY - current.y
    if (!current.moved && Math.hypot(dx, dy) < 6) return
    current.moved = true
    const movingBounds = dragBounds(current, dx, dy)
    const drop = isToolbar(current.target)
      ? getWidgetFrameDropTarget(movingBounds, view, 72, draggingWidget?.edge)
      : getFrameDropTarget(movingBounds, view)
    const favorite = favorites?.hover(
      current.target.kind === 'item' ? current.target.id : null,
      event.clientX,
      event.clientY,
    )
    setGroupDropTarget(
      favorite
        ? null
        : (findGroupDrop(current.target, event.clientX, event.clientY)
            ?.target ?? null),
    )
    setDropTarget(drop)
    if (isToolbar(current.target)) {
      const previousEdge = draggingWidget?.edge
      const nextEdge = drop?.edge ?? previousEdge
      const isVertical = (edge?: FrameEdge) =>
        edge === 'left' || edge === 'right'
      if (isVertical(previousEdge) !== isVertical(nextEdge)) {
        queueMotion(current.target, true)
      }
      setDraggingWidget({
        id: current.target.id,
        edge: nextEdge,
        center: {
          x: current.bounds.x + current.bounds.width / 2 + dx,
          y: current.bounds.y + current.bounds.height / 2 + dy,
        },
      })
    }
    const previous = placement(current.target)
    if (previous.surface === 'frame')
      place(current.target, { surface: 'canvas' }, false)
    move(current.target, view.x + movingBounds.x, view.y + movingBounds.y)
  }
  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    if (!editing || event.type !== 'pointerup') {
      cancelDrag()
      return
    }
    const dx = event.clientX - current.x
    const dy = event.clientY - current.y
    const movingBounds = dragBounds(current, dx, dy)
    if (current.moved || Math.hypot(dx, dy) >= 6) {
      if (
        current.target.kind === 'item' &&
        favorites?.drop(current.target.id, event.clientX, event.clientY)
      ) {
        cancelDrag()
        return
      }
      const joining = findGroupDrop(
        current.target,
        event.clientX,
        event.clientY,
      )
      if (joining) {
        queueMotion(current.target)
        const next = mergeFrameTargets(
          layout,
          current.target,
          joining.target,
          joining.before,
        )
        setLayout(next)
        const group = getTargetGroup(next, joining.target)
        if (group) setSelected({ kind: 'group', id: group.id })
        beforeSettle(current.target)
        setWorkspace((previous) =>
          transformCanvasWorkspace(previous, next, restoreBackgroundItems),
        )
        finishDrag(event)
        return
      }
      const drop = isToolbar(current.target)
        ? getWidgetFrameDropTarget(movingBounds, view, 72, draggingWidget?.edge)
        : getFrameDropTarget(movingBounds, view)
      if (drop) place(current.target, drop)
      else if (current.target.kind === 'group') {
        place(current.target, { surface: 'canvas' })
      } else {
        if (isToolbar(current.target)) {
          queueMotion(current.target)
          // Canvas widgets return to a row without shifting their drag center.
          if (movingBounds.height > movingBounds.width) {
            const { width, height } = movingBounds
            movingBounds.x += (width - height) / 2
            movingBounds.y += (height - width) / 2
            movingBounds.width = height
            movingBounds.height = width
          }
        }
        if (placement(current.target).surface === 'frame')
          place(current.target, { surface: 'canvas' }, false)
        move(current.target, view.x + movingBounds.x, view.y + movingBounds.y)
        const previous = placement(current.target)
        const nextPlacement = {
          ...previous,
          surface:
            previous.surface === 'background'
              ? ('background' as const)
              : ('canvas' as const),
          ...(isToolbar(current.target)
            ? {
                x: view.x + movingBounds.x,
                y: view.y + movingBounds.y,
              }
            : {}),
        }
        const nextLayout = setObjectPlacement(
          layout,
          current.target,
          nextPlacement,
        )
        setLayout(nextLayout)
        beforeSettle(current.target)
        setWorkspace((previous) =>
          settleLayoutDrop(
            previous,
            nextLayout,
            current.target,
            isToolbar(current.target)
              ? {
                  ...movingBounds,
                  x: view.x + movingBounds.x,
                  y: view.y + movingBounds.y,
                }
              : undefined,
          ),
        )
      }
    }
    finishDrag(event)
  }
  function finishDrag(event: PointerEvent<HTMLElement>) {
    drag.current = null
    setDraggingWidget(null)
    setDropTarget(null)
    setGroupDropTarget(null)
    favorites?.hover(null, 0, 0)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }
  function onPointerCancel(event: PointerEvent<HTMLElement>) {
    if (drag.current?.pointerId === event.pointerId) cancelDrag()
  }
  function dragBounds(
    current: NonNullable<typeof drag.current>,
    dx: number,
    dy: number,
  ): Bounds {
    const element = isToolbar(current.target)
      ? targetElement(current.target)
      : null
    const width = element?.offsetWidth ?? current.bounds.width
    const height = element?.offsetHeight ?? current.bounds.height
    return {
      x: current.bounds.x + dx + (current.bounds.width - width) / 2,
      y: current.bounds.y + dy + (current.bounds.height - height) / 2,
      width,
      height,
    }
  }
  function widgetBounds(
    target: LayoutTarget,
    next: ObjectPlacement,
  ): Bounds | undefined {
    if (
      !isToolbar(target) ||
      (next.surface !== 'canvas' && next.surface !== 'background')
    )
      return undefined
    const rect = document
      .querySelector(
        `[${target.kind === 'group' ? 'data-layout-group' : 'data-layout-widget'}="${CSS.escape(target.id)}"]`,
      )
      ?.getBoundingClientRect()
    return {
      x: next.x ?? view.x + 100,
      y: next.y ?? view.y + 120,
      width: rect?.width ?? 240,
      height: rect?.height ?? 54,
    }
  }
  function attachSelected() {
    if (!selected || placement(selected).surface === 'frame') return
    const attribute =
      selected.kind === 'group'
        ? 'data-layout-group'
        : selected.kind === 'widget'
          ? 'data-layout-widget'
          : selected.kind === 'item'
            ? 'data-desktop-item-id'
            : selected.kind === 'window'
              ? 'data-window-id'
              : 'data-drawing-id'
    const element = document.querySelector(
      `[${attribute}="${CSS.escape(selected.id)}"]`,
    )
    if (!element) return
    const nearest = getFrameDropTarget(
      element.getBoundingClientRect(),
      view,
      Infinity,
    )
    if (nearest) place(selected, nearest)
  }
  function remove() {
    if (!selected) return
    if (
      !layout.allowHideTools &&
      ((selected.kind === 'widget' && selected.id === 'tools') ||
        (selected.kind === 'group' &&
          getFrameGroups(layout)
            .find((group) => group.id === selected.id)
            ?.members.some(
              (member) => member.kind === 'widget' && member.id === 'tools',
            )))
    ) {
      setWarning(true)
      return
    }
    place(selected, {
      surface: isToolbar(selected)
        ? 'hidden'
        : selected.kind === 'item'
          ? 'background'
          : 'canvas',
    })
    setSelected(null)
  }
  function restoreTools() {
    place(
      { kind: 'widget', id: 'tools' },
      FRAME_WIDGETS.find((widget) => widget.id === 'tools')!.defaultPlacement,
    )
  }
  const title = !selected
    ? ''
    : selected.kind === 'group'
      ? 'Frame group'
      : selected.kind === 'widget'
        ? (FRAME_WIDGETS.find((item) => item.id === selected.id)?.title ?? '')
        : selected.kind === 'window'
          ? (workspace.windows.find((item) => item.id === selected.id)?.title ??
            '')
          : selected.kind === 'item'
            ? (workspace.items.find((item) => item.id === selected.id)?.title ??
              '')
            : `Drawing ${workspace.drawings.findIndex((item) => item.id === selected.id) + 1}`
  return {
    layout,
    selected,
    setSelected,
    warning,
    dropTarget,
    groupDropTarget,
    draggingWidget,
    group: selected ? getTargetGroup(layout, selected) : undefined,
    expanded:
      selected?.kind === 'widget' &&
      ['notifications', 'clock', 'wifi', 'volume', 'battery'].includes(
        selected.id,
      )
        ? getWidgetExpanded(layout, selected.id)
        : undefined,
    toggleExpanded: () => {
      if (selected?.kind !== 'widget') return
      setLayout((current) =>
        setWidgetExpanded(
          current,
          selected.id,
          !getWidgetExpanded(current, selected.id),
        ),
      )
    },
    ungroup: () => {
      if (!selected) return
      const group = getTargetGroup(layout, selected)
      if (!group) return
      const previous = getPlacement(layout, selected)
      let next = ungroupFrameTarget(layout, selected)
      const groupBounds = targetElement({
        kind: 'group',
        id: group.id,
      })?.getBoundingClientRect()
      const remaining = getTargetGroup(next, { kind: 'group', id: group.id })
      const detached = group.members.filter(
        (member) => !getTargetGroup(next, member),
      )
      const margin = view.width <= 760 ? 12 : 24
      for (const member of detached) {
        const bounds = targetElement(member)?.getBoundingClientRect()
        if (!bounds || previous.surface !== 'frame') continue
        const vertical = previous.edge === 'left' || previous.edge === 'right'
        const size = (vertical ? bounds.height : bounds.width) + 10
        const extent = vertical ? view.height : view.width
        let start = (vertical ? bounds.y : bounds.x) - 5
        if (remaining && groupBounds) {
          const after = vertical ? groupBounds.bottom : groupBounds.right
          const before = vertical ? groupBounds.top : groupBounds.left
          start =
            after + 12 + size <= extent - margin
              ? after + 12
              : before - size - 12
        }
        const position = Math.max(
          0,
          Math.min(
            1,
            (start - margin) / Math.max(1, extent - margin * 2 - size),
          ),
        )
        next = setObjectPlacement(next, member, { ...previous, position })
      }
      setLayout(next)
      if (selected.kind === 'group') setSelected(null)
    },
    setWarning,
    placement,
    place,
    forget: (target: LayoutTarget) => {
      setLayout((current) => {
        const next = ungroupFrameTarget(current, target)
        const key = targetKey(target)
        if (!Object.hasOwn(next.placements, key)) return next
        const placements = { ...next.placements }
        delete placements[key]
        return { ...next, placements }
      })
    },
    remove,
    restoreTools,
    attachSelected,
    title,
    setAllowHideTools: (allow: boolean) =>
      setLayout((current) => setAllowHideTools(current, allow)),
    events: {
      onPointerDownCapture,
      onPointerMove,
      onPointerUp,
      onPointerCancel,
      onLostPointerCapture: onPointerCancel,
    },
  }
}
