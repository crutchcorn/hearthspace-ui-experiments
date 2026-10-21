import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
  type PointerEvent,
} from 'react'
import type { Workspace, Bounds } from './desktop'
import type { SceneActions } from './useScene'
import {
  getPlacement,
  setAllowHideTools,
  targetKey,
  getFrameDropTarget,
  getFrameCornerAtPointer,
  getFrameDragBounds,
  getFrameBounds,
  getWidgetFrameDropTarget,
  type LayoutTarget,
  type ObjectPlacement,
  type FrameEdge,
  type FrameGuideZone,
  FRAME_WIDGETS,
  getTargetGroup,
  getFrameGroups,
  mergeFrameTargets,
  ungroupFrameTarget,
  getWidgetExpanded,
  setWidgetExpanded,
  type FrameLayout,
} from './frame-layout'
import { mergeOverlappingFrameItems } from './frame-collisions'
import { snapFramePlacement } from './frame-grid'
import { snapCanvasCoordinate } from './canvas-grid'

type ToolbarGrip = { along: number; across: number }

export const LAYOUT_MOTION_ID = 'layout-placement'

function gripPoint(
  bounds: Pick<Bounds, 'width' | 'height'>,
  grip?: ToolbarGrip,
) {
  if (!grip) return { x: bounds.width / 2, y: bounds.height / 2 }
  return bounds.height > bounds.width
    ? { x: (1 - grip.across) * bounds.width, y: grip.along * bounds.height }
    : { x: grip.along * bounds.width, y: grip.across * bounds.height }
}

function rotation(element: HTMLElement) {
  const style = getComputedStyle(element)
  const [x, y] = style.transformOrigin.split(' ').map(Number.parseFloat)
  const angle = ((Number.parseFloat(style.rotate) || 0) * Math.PI) / 180
  return { x, y, cos: Math.cos(angle), sin: Math.sin(angle) }
}

export default function useObjectLayout(
  workspace: Workspace,
  sceneActions: SceneActions,
  layout: FrameLayout,
  setLayout: Dispatch<SetStateAction<FrameLayout>>,
  view: Bounds,
  editing: boolean,
  beforeSettle: (target: LayoutTarget) => void,
  favorites?: {
    hover: (itemId: string | null, x: number, y: number) => boolean
    drop: (itemId: string, x: number, y: number) => boolean
  },
) {
  const [selected, setSelected] = useState<LayoutTarget | null>(null)
  const [draggingTarget, setDraggingTarget] = useState<LayoutTarget | null>(
    null,
  )
  const [groupDropTarget, setGroupDropTarget] = useState<LayoutTarget | null>(
    null,
  )
  const [warning, setWarning] = useState(false)
  const [draggingWidget, setDraggingWidget] = useState<{
    id: string
    edge?: FrameEdge
    center: { x: number; y: number }
  } | null>(null)
  const [dropTarget, setDropTarget] = useState<
    | (Extract<ObjectPlacement, { surface: 'frame' }> & {
        zone: FrameGuideZone
      })
    | null
  >(null)
  const drag = useRef<{
    pointerId: number
    target: LayoutTarget
    x: number
    y: number
    clientX: number
    clientY: number
    altKey: boolean
    edge?: FrameEdge
    grip?: ToolbarGrip
    bounds: Bounds
    moved: boolean
    captureTarget: HTMLElement
    originalLayout: FrameLayout
    originalObject?:
      | Workspace['windows'][number]
      | Workspace['items'][number]
      | Workspace['drawings'][number]
  } | null>(null)
  const pendingSnap = useRef<{
    target: LayoutTarget
    from: Bounds
    anchor: { x: number; y: number }
    grip?: ToolbarGrip
    preview: boolean
  } | null>(null)
  const pendingFrameGrid = useRef<{
    target: LayoutTarget
    size: { width: number; height: number }
  } | null>(null)
  const motionFrame = useRef<number | null>(null)
  const snapAnimation = useRef<Animation | null>(null)
  const turnAnimation = useRef<Animation | null>(null)
  const cancelMotion = useCallback(() => {
    if (motionFrame.current !== null) cancelAnimationFrame(motionFrame.current)
    motionFrame.current = null
    pendingSnap.current = null
    pendingFrameGrid.current = null
    snapAnimation.current?.cancel()
    turnAnimation.current?.cancel()
  }, [])
  useEffect(() => cancelMotion, [cancelMotion])
  useLayoutEffect(() => {
    const pending = pendingFrameGrid.current
    if (!pending) return
    pendingFrameGrid.current = null
    const placement = getPlacement(layout, pending.target)
    if (placement.surface !== 'frame') return
    // Turning or ungrouping a toolbar changes its final size after the drop.
    const next = snapFramePlacement(
      placement,
      frameSize(pending.target, pending.size),
      view,
      true,
      frameSpacing(pending.target),
    )
    if (next.position !== placement.position)
      sceneActions.place(pending.target, next, { settle: false })
  })
  useLayoutEffect(() => {
    if (!pendingSnap.current || motionFrame.current !== null) return
    if (!isToolbar(pendingSnap.current.target)) {
      const snap = pendingSnap.current
      pendingSnap.current = null
      const element = targetElement(snap.target)
      snapAnimation.current?.cancel()
      if (
        !element ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches
      )
        return

      // Hosts and pinned-window offsets change together. Measure the new layout
      // before paint, without a CSS transition or the recessed transform, then
      // start at the actual screen bounds captured before the change.
      const transition = element.style.transition
      const transform = element.style.transform || 'none'
      element.style.transition = 'none'
      element.style.transform = 'none'
      const to = element.getBoundingClientRect()
      element.style.transform = transform
      const destination = element.getBoundingClientRect()
      element.style.transition = transition
      const from = snap.from
      if (
        !to.width ||
        !to.height ||
        (Math.abs(from.x - destination.x) < 0.5 &&
          Math.abs(from.y - destination.y) < 0.5 &&
          Math.abs(from.width - destination.width) < 0.5 &&
          Math.abs(from.height - destination.height) < 0.5)
      )
        return
      snapAnimation.current = element.animate(
        [
          {
            transformOrigin: 'top left',
            transform: `translate(${from.x - to.x}px, ${from.y - to.y}px) scale(${from.width / to.width}, ${from.height / to.height})`,
          },
          { transformOrigin: 'top left', transform },
        ],
        { duration: 300, easing: 'cubic-bezier(0.2,0.7,0.1,1)' },
      )
      snapAnimation.current.id = LAYOUT_MOTION_ID
      return
    }
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
      const pivot = gripPoint(to, snap.grip)
      const dx = snap.anchor.x - (to.x + pivot.x)
      const dy = snap.anchor.y - (to.y + pivot.y)
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
          const transformOrigin = `${pivot.x}px ${pivot.y}px`
          turnAnimation.current = element.animate(
            [
              { transformOrigin, rotate: `${startAngle}deg` },
              { transformOrigin, rotate: '0deg' },
            ],
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
      }
    })
  })

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
              target.kind === 'window' ? 'flush' : 'padded',
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
      sceneActions.mergeFrameOverlaps(entries)
      setSelected((previous) => {
        // Resizing an edited item may merge its frame neighbors. Keep editing
        // that item; only a selected group needs its merged identity resolved.
        if (previous?.kind !== 'group') return previous
        const representative = getTargetGroup(layout, previous)?.members[0]
        const group = representative
          ? getTargetGroup(next, representative)
          : undefined
        return group ? { kind: 'group', id: group.id } : previous
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [layout, view, workspace.items, workspace.windows, sceneActions])

  function motionBounds(element: HTMLElement, widget: boolean): Bounds {
    const rect = element.getBoundingClientRect()
    if (!widget) return rect
    // Recover layout bounds from the rotated box, including any translation.
    // A turn around the grip moves the visual center even when the grip stays put.
    const turn = rotation(element)
    const cx = element.offsetWidth / 2 - turn.x
    const cy = element.offsetHeight / 2 - turn.y
    return {
      x: rect.x + rect.width / 2 - turn.x - (turn.cos * cx - turn.sin * cy),
      y: rect.y + rect.height / 2 - turn.y - (turn.sin * cx + turn.cos * cy),
      width: element.offsetWidth,
      height: element.offsetHeight,
    }
  }

  function queueMotion(target: LayoutTarget, preview = false) {
    const element = targetElement(target)
    if (!element) return
    const from = motionBounds(element, isToolbar(target))
    const current = drag.current
    const grip =
      current && targetKey(current.target) === targetKey(target)
        ? current.grip
        : undefined
    const pivot = gripPoint(from, grip)
    const anchor = { x: from.x + pivot.x, y: from.y + pivot.y }
    const pending = pendingSnap.current
    if (pending && targetKey(pending.target) === targetKey(target)) {
      pending.preview &&= preview
      if (!preview) pending.anchor = anchor
      return
    }
    pendingSnap.current = {
      target,
      from,
      anchor,
      grip,
      preview,
    }
  }

  function isToolbar(target: LayoutTarget) {
    return target.kind === 'widget' || target.kind === 'group'
  }

  function findGroupDrop(source: LayoutTarget, x: number, y: number) {
    if (source.kind === 'drawing') return null
    const members =
      source.kind === 'group'
        ? (getFrameGroups(layout).find((group) => group.id === source.id)
            ?.members ?? [])
        : [source]
    const elements = document.querySelectorAll<HTMLElement>(
      '[data-layout-widget], [data-desktop-item-id], [data-layout-group], [data-window-id]',
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
    const element =
      current.moved &&
      (current.target.kind === 'window' || current.target.kind === 'item')
        ? targetElement(current.target)
        : null
    const from = element?.getBoundingClientRect()
    if (current.moved) cancelMotion()
    else if (snapAnimation.current?.playState === 'paused')
      snapAnimation.current.play()
    if (from)
      pendingSnap.current = {
        target: current.target,
        from,
        anchor: { x: from.x + from.width / 2, y: from.y + from.height / 2 },
        preview: false,
      }
    setDraggingTarget(null)
    setDraggingWidget(null)
    setDropTarget(null)
    setGroupDropTarget(null)
    if (current.captureTarget.hasPointerCapture(current.pointerId))
      current.captureTarget.releasePointerCapture(current.pointerId)
    if (!current.moved) return
    sceneActions.restoreDrag({
      target: current.target,
      layout: current.originalLayout,
      object: current.originalObject,
    })
  }, [sceneActions, cancelMotion])

  useEffect(() => {
    if (!editing) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') cancelDrag()
      else updateDragModifier(event)
    }
    window.addEventListener('keydown', onKeyDown, true)
    window.addEventListener('keyup', updateDragModifier, true)
    window.addEventListener('blur', cancelDrag)
    return () => {
      window.removeEventListener('keydown', onKeyDown, true)
      window.removeEventListener('keyup', updateDragModifier, true)
      window.removeEventListener('blur', cancelDrag)
      cancelDrag()
    }
  }, [editing, cancelDrag])

  const updateDragModifier = useEffectEvent((event: KeyboardEvent) => {
    const current = drag.current
    if (!current?.moved || current.altKey === event.altKey) return
    updateDrag(current.clientX, current.clientY, event.altKey)
  })

  const refreshDragOrientation = useEffectEvent(() => {
    const current = drag.current
    if (current?.moved && current.altKey)
      updateDrag(current.clientX, current.clientY, true)
  })
  useLayoutEffect(() => {
    refreshDragOrientation()
  }, [draggingWidget?.edge])

  function placement(target: LayoutTarget): ObjectPlacement {
    const saved = getPlacement(layout, target)
    if (
      target.kind === 'drawing' &&
      !layout.placements[targetKey(target)] &&
      !getTargetGroup(layout, target)
    )
      return { surface: 'background' }
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
          member.kind === 'window'
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
      beforeSettle(target)
      sceneActions.releaseGroup(target, surface, destinations)
      setSelected(null)
      return
    }
    if (
      (next.surface === 'canvas' || next.surface === 'background') &&
      isToolbar(target)
    ) {
      const bounds = widgetBounds(target, next)!
      next = { surface: next.surface, ...bounds }
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
    if (settle) beforeSettle(target)
    sceneActions.place(target, next, {
      settle,
      bounds: widgetBounds(target, next),
    })
  }
  function move(target: LayoutTarget, x: number, y: number) {
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
    sceneActions.move(target, x, y)
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
    let grip: ToolbarGrip | undefined
    if (isToolbar(target)) {
      // Undo any in-flight turn before finding the grabbed point in the bar.
      const turn = rotation(movingElement)
      const px = event.clientX - bounds.x - turn.x
      const py = event.clientY - bounds.y - turn.y
      const x = turn.x + turn.cos * px + turn.sin * py
      const y = turn.y - turn.sin * px + turn.cos * py
      grip =
        bounds.height > bounds.width
          ? { along: y / bounds.height, across: 1 - x / bounds.width }
          : { along: x / bounds.width, across: y / bounds.height }
      bounds.x = event.clientX - x
      bounds.y = event.clientY - y
    }
    if (isToolbar(target)) cancelMotion()
    else if (
      snapAnimation.current &&
      movingElement.getAnimations().includes(snapAnimation.current)
    )
      // Keep the grabbed visual in place until movement or release. Canceling
      // here would reveal the destination underneath an unfinished animation.
      snapAnimation.current.pause()
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
      clientX: event.clientX,
      clientY: event.clientY,
      altKey: event.altKey,
      edge:
        currentPlacement.surface === 'frame'
          ? currentPlacement.edge
          : undefined,
      grip,
      bounds,
      moved: false,
      captureTarget: event.currentTarget,
      originalLayout: layout,
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
    updateDrag(event.clientX, event.clientY, event.altKey)
  }
  function updateDrag(clientX: number, clientY: number, altKey: boolean) {
    const current = drag.current
    if (!current) return
    if (!editing) {
      cancelDrag()
      return
    }
    current.clientX = clientX
    current.clientY = clientY
    current.altKey = altKey
    const dx = clientX - current.x,
      dy = clientY - current.y
    if (!current.moved && Math.hypot(dx, dy) < 6) return
    if (!current.moved) {
      setDraggingTarget(current.target)
      if (
        !isToolbar(current.target) &&
        snapAnimation.current?.playState === 'paused'
      )
        queueMotion(current.target)
    }
    current.moved = true
    const { bounds: movingBounds, drop } = frameDrag(current, dx, dy, altKey)
    const favorite = favorites?.hover(
      current.target.kind === 'item' ? current.target.id : null,
      clientX,
      clientY,
    )
    setGroupDropTarget(
      favorite
        ? null
        : (findGroupDrop(current.target, clientX, clientY)?.target ?? null),
    )
    // Reaching an edge's clamped endpoint is not itself a corner-square hit.
    setDropTarget(
      drop
        ? {
            ...drop,
            zone:
              getFrameCornerAtPointer({ x: clientX, y: clientY }, view) ??
              drop.edge,
          }
        : null,
    )
    if (isToolbar(current.target)) {
      const previousEdge = current.edge
      const nextEdge = drop?.edge ?? previousEdge
      const isVertical = (edge?: FrameEdge) =>
        edge === 'left' || edge === 'right'
      if (isVertical(previousEdge) !== isVertical(nextEdge)) {
        queueMotion(current.target, true)
      }
      current.edge = nextEdge
      setDraggingWidget({
        id: current.target.id,
        edge: nextEdge,
        center: {
          x: movingBounds.x + movingBounds.width / 2,
          y: movingBounds.y + movingBounds.height / 2,
        },
      })
    }
    const previous = placement(current.target)
    if (previous.surface === 'pinned') {
      place(
        current.target,
        { surface: 'pinned', x: movingBounds.x, y: movingBounds.y },
        false,
      )
      return
    }
    if (previous.surface === 'frame') {
      if (!isToolbar(current.target)) queueMotion(current.target)
      place(current.target, { surface: 'canvas' }, false)
    }
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
    const { bounds, drop } = frameDrag(current, dx, dy, event.altKey)
    let movingBounds = bounds
    if (current.moved || Math.hypot(dx, dy) >= 6) {
      if (placement(current.target).surface === 'pinned') {
        place(current.target, { surface: 'pinned', x: bounds.x, y: bounds.y })
        finishDrag(event)
        return
      }
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
        const group = getTargetGroup(next, joining.target)
        if (group) setSelected({ kind: 'group', id: group.id })
        beforeSettle(current.target)
        sceneActions.group(current.target, joining.target, joining.before)
        finishDrag(event)
        return
      }
      if (drop) {
        if (event.altKey && drop.position > 0 && drop.position < 1)
          pendingFrameGrid.current = {
            target: current.target,
            size: movingBounds,
          }
        place(current.target, drop)
      } else if (current.target.kind === 'group') {
        place(current.target, { surface: 'canvas' })
      } else {
        queueMotion(current.target)
        if (isToolbar(current.target)) {
          // Return to a row around the same grabbed point.
          movingBounds = dragBounds(current, dx, dy, 'top')
        }
        const previous = placement(current.target)
        const surface =
          previous.surface === 'background' ? 'background' : 'canvas'
        const nextPlacement: ObjectPlacement = isToolbar(current.target)
          ? {
              surface,
              ...movingBounds,
              x: view.x + movingBounds.x,
              y: view.y + movingBounds.y,
            }
          : { ...previous, surface }
        beforeSettle(current.target)
        sceneActions.place(current.target, nextPlacement, {
          position: {
            x: view.x + movingBounds.x,
            y: view.y + movingBounds.y,
          },
          bounds: isToolbar(current.target)
            ? {
                ...movingBounds,
                x: view.x + movingBounds.x,
                y: view.y + movingBounds.y,
              }
            : undefined,
        })
      }
    }
    finishDrag(event)
  }
  function finishDrag(event: PointerEvent<HTMLElement>) {
    if (!drag.current?.moved && snapAnimation.current?.playState === 'paused')
      snapAnimation.current.play()
    drag.current = null
    setDraggingTarget(null)
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
    edge = current.edge,
  ): Bounds {
    const element = isToolbar(current.target)
      ? targetElement(current.target)
      : null
    let width = element?.offsetWidth ?? current.bounds.width
    let height = element?.offsetHeight ?? current.bounds.height
    if (current.grip) {
      const vertical = edge === 'left' || edge === 'right'
      if (vertical !== height > width) [width, height] = [height, width]
      const pivot = gripPoint({ width, height }, current.grip)
      return {
        x: current.x + dx - pivot.x,
        y: current.y + dy - pivot.y,
        width,
        height,
      }
    }
    return {
      x: current.bounds.x + dx + (current.bounds.width - width) / 2,
      y: current.bounds.y + dy + (current.bounds.height - height) / 2,
      width,
      height,
    }
  }
  function frameSpacing(target: LayoutTarget) {
    return target.kind === 'window' ? ('flush' as const) : ('padded' as const)
  }
  function frameSize(
    target: LayoutTarget,
    fallback: { width: number; height: number },
  ) {
    if (target.kind === 'item') return { width: 54, height: 54 }
    if (target.kind === 'window')
      return workspace.windows.find((item) => item.id === target.id) ?? fallback
    if (target.kind === 'drawing')
      return (
        workspace.drawings.find((item) => item.id === target.id) ?? fallback
      )
    const element = targetElement(target)
    return {
      width: element?.offsetWidth || fallback.width,
      height: element?.offsetHeight || fallback.height,
    }
  }
  function frameDrag(
    current: NonNullable<typeof drag.current>,
    dx: number,
    dy: number,
    snap: boolean,
  ) {
    let bounds = dragBounds(current, dx, dy)
    if (current.target.kind === 'drawing') {
      if (snap)
        bounds = {
          ...bounds,
          x:
            snapCanvasCoordinate(
              view.x + bounds.x,
              0,
              workspace.width - bounds.width,
            ) - view.x,
          y:
            snapCanvasCoordinate(
              view.y + bounds.y,
              0,
              workspace.height - bounds.height,
            ) - view.y,
        }
      return { bounds, drop: null }
    }
    const pointer = { x: current.x + dx, y: current.y + dy }
    const drop = isToolbar(current.target)
      ? getWidgetFrameDropTarget(bounds, view, 72, current.edge, pointer)
      : getFrameDropTarget(bounds, view, 72, pointer)
    if (drop && isToolbar(current.target)) {
      bounds = dragBounds(current, dx, dy, drop.edge)
    }
    if (!drop || !snap || drop.position === 0 || drop.position === 1)
      return { bounds, drop }
    const size = frameSize(current.target, bounds)
    const spacing = frameSpacing(current.target)
    const snapped = snapFramePlacement(drop, size, view, true, spacing)
    const aligned = getFrameBounds(
      snapped,
      size.width,
      size.height,
      view,
      spacing,
    )
    if (drop.edge === 'top' || drop.edge === 'bottom') bounds.x = aligned.x
    else bounds.y = aligned.y
    return { bounds, drop: snapped }
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
    const element = targetElement(target)
    const previous = placement(target)
    const canvas =
      previous.surface === 'canvas' || previous.surface === 'background'
        ? previous
        : undefined
    return {
      x: next.x ?? view.x + 100,
      y: next.y ?? view.y + 120,
      width: next.width ?? (element?.offsetWidth || canvas?.width || 54),
      height: next.height ?? (element?.offsetHeight || canvas?.height || 54),
    }
  }
  function attachSelected() {
    if (
      !selected ||
      placement(selected).surface === 'frame' ||
      placement(selected).surface === 'pinned'
    )
      return
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
    if (selected.kind === 'drawing') {
      const { x, y } = element.getBoundingClientRect()
      place(selected, { surface: 'pinned', x, y })
      return
    }
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
    draggingTarget,
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
      const next = ungroupFrameTarget(layout, selected)
      const groupBounds = targetElement({
        kind: 'group',
        id: group.id,
      })?.getBoundingClientRect()
      const remaining = getTargetGroup(next, { kind: 'group', id: group.id })
      const detached = group.members.filter(
        (member) => !getTargetGroup(next, member),
      )
      const placements: {
        target: LayoutTarget
        placement: ObjectPlacement
      }[] = []
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
        placements.push({
          target: member,
          placement: { ...previous, position },
        })
      }
      sceneActions.ungroup(selected, placements)
      if (selected.kind === 'group') setSelected(null)
    },
    setWarning,
    placement,
    place,
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
