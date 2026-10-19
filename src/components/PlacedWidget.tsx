import {
  useEffectEvent,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { CANVAS_LAYERS } from '../canvas-layers'
import {
  getFrameBounds,
  type FrameEdge,
  type ObjectPlacement,
} from '../frame-layout'
import type { Bounds } from '../desktop'
import { WidgetPopoverContext } from './widget-popover-context'
import styles from './PlacedWidget.module.css'

interface PlacedWidgetProps {
  canvasHost: HTMLElement | null
  popoverHost: HTMLElement | null
  id: string
  kind?: 'widget' | 'group'
  inline?: boolean
  orientationEdge?: FrameEdge
  dropTarget?: boolean
  placement: ObjectPlacement
  view: Bounds
  editing: boolean
  selected: boolean
  canvasSelected?: boolean
  onControlPointerDown?: (
    event: PointerEvent<HTMLDivElement>,
    id: string,
  ) => void
  onControlSizeChange?: (
    id: string,
    size: { width: number; height: number },
  ) => void
  hidden?: boolean
  merged?: 'top' | 'bottom'
  draggingWidget: {
    id: string
    edge?: FrameEdge
    center: { x: number; y: number }
  } | null
  children: ReactNode
}

export default function PlacedWidget({
  canvasHost,
  popoverHost,
  id,
  kind = 'widget',
  inline = false,
  orientationEdge,
  dropTarget = false,
  placement,
  view,
  editing,
  selected,
  canvasSelected = false,
  onControlPointerDown,
  onControlSizeChange,
  hidden = false,
  merged,
  draggingWidget,
  children,
}: PlacedWidgetProps) {
  const wrapper = useRef<HTMLDivElement>(null)
  const content = useRef<HTMLDivElement>(null)
  const [origin] = useState(() => ({ x: view.x + 100, y: view.y + 100 }))
  const [size, setSize] = useState({ width: 300, height: 54 })
  const [measured, setMeasured] = useState<Bounds | null>(null)
  const reportedSize = useRef<{
    id: string
    width: number
    height: number
  } | null>(null)
  const onFrame = placement.surface === 'frame'
  const canvasControl =
    kind === 'widget' &&
    !inline &&
    !hidden &&
    (placement.surface === 'canvas' || placement.surface === 'background')
  const reportControlSize = useEffectEvent((width: number, height: number) => {
    if (
      !canvasControl ||
      (reportedSize.current?.id === id &&
        reportedSize.current.width === width &&
        reportedSize.current.height === height)
    )
      return
    reportedSize.current = { id, width, height }
    onControlSizeChange?.(id, { width, height })
  })
  const dragged = draggingWidget?.id === id ? draggingWidget : null
  const edge = inline
    ? orientationEdge
    : dragged
      ? dragged.edge
      : onFrame
        ? placement.edge
        : undefined

  useLayoutEffect(() => {
    if (!canvasControl) reportedSize.current = null
    const element = content.current
    if (!element) return
    function measure() {
      if (!element || !wrapper.current) return
      const width = element.offsetWidth
      const height = element.offsetHeight
      if (!width || !height) return
      reportControlSize(width, height)
      setSize((current) =>
        current.width === width && current.height === height
          ? current
          : { width, height },
      )
      const bounds = wrapper.current.getBoundingClientRect()
      setMeasured((current) =>
        current?.x === bounds.x &&
        current.y === bounds.y &&
        current.width === bounds.width &&
        current.height === bounds.height
          ? current
          : {
              x: bounds.x,
              y: bounds.y,
              width: bounds.width,
              height: bounds.height,
            },
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    if (wrapper.current) {
      observer.observe(wrapper.current)
      if (wrapper.current.parentElement)
        observer.observe(wrapper.current.parentElement)
    }
    window.addEventListener('resize', measure)
    if (inline || merged) window.addEventListener('scroll', measure, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [
    edge,
    canvasControl,
    merged,
    inline,
    placement,
    size.width,
    size.height,
    view.x,
    view.y,
    view.width,
    view.height,
  ])

  const bounds = onFrame
    ? getFrameBounds(placement, size.width, size.height, view, 'padded')
    : {
        x:
          (placement.surface !== 'hidden' ? placement.x : undefined) ??
          origin.x,
        y:
          (placement.surface !== 'hidden' ? placement.y : undefined) ??
          origin.y,
        ...size,
      }
  const x = dragged
    ? dragged.center.x - size.width / 2
    : onFrame
      ? bounds.x
      : bounds.x - view.x
  const y = dragged
    ? dragged.center.y - size.height / 2
    : onFrame
      ? bounds.y
      : bounds.y - view.y
  const anchorX = inline || merged ? (measured?.x ?? x) : x
  const anchorY = inline || merged ? (measured?.y ?? y) : y
  const anchorHeight =
    inline || merged ? (measured?.height ?? size.height) : size.height
  const sideOpenBelow = anchorY + anchorHeight / 2 <= view.height / 2
  const sideTop = Math.max(12, Math.min(anchorY, view.height - 12))
  const sideBottom = Math.max(
    12,
    Math.min(anchorY + anchorHeight, view.height - 12),
  )
  const spaceBelow = Math.max(0, view.height - anchorY - anchorHeight - 24)
  const spaceAbove = Math.max(0, anchorY - 24)
  const openBelow = edge
    ? edge === 'top' || (edge !== 'bottom' && spaceBelow >= spaceAbove)
    : spaceBelow >= spaceAbove
  const style = {
    '--widget-position-x': `${onFrame ? x : x + view.x}px`,
    '--widget-position-y': `${onFrame ? y : y + view.y}px`,
    '--widget-x': `${anchorX}px`,
    '--widget-y': `${anchorY}px`,
    '--widget-side-top': sideOpenBelow ? `${sideTop - anchorY}px` : 'auto',
    '--widget-side-bottom': sideOpenBelow
      ? 'auto'
      : `${anchorY + anchorHeight - sideBottom}px`,
    '--widget-side-height': `${Math.max(0, sideOpenBelow ? view.height - sideTop - 12 : sideBottom - 12)}px`,
    '--widget-z': onFrame
      ? 1100
      : placement.surface === 'background'
        ? CANVAS_LAYERS.background
        : CANVAS_LAYERS.raised,
    '--widget-popover-top': openBelow ? 'calc(100% + 12px)' : 'auto',
    '--widget-popover-bottom': openBelow ? 'auto' : 'calc(100% + 12px)',
    '--widget-popover-height': `${openBelow ? spaceBelow : spaceAbove}px`,
  } as CSSProperties

  const element = (
    <div
      ref={wrapper}
      className={styles.widget}
      style={style}
      hidden={hidden || placement.surface === 'hidden'}
      data-layout-widget={kind === 'widget' ? id : undefined}
      data-layout-group={kind === 'group' ? id : undefined}
      data-group-member={inline || undefined}
      data-inline={inline || undefined}
      data-group-drop-target={dropTarget || undefined}
      data-merged={merged}
      data-layout-surface={placement.surface}
      data-layout-editing={editing}
      data-layout-selected={editing && selected}
      data-canvas-control-id={canvasControl ? id : undefined}
      data-canvas-control-selected={canvasControl && canvasSelected}
      data-frame-edge={edge}
      data-shell-controls
      onPointerDownCapture={
        canvasControl ? (event) => onControlPointerDown?.(event, id) : undefined
      }
    >
      <div
        ref={content}
        className={styles.content}
        inert={editing && kind === 'widget'}
      >
        <WidgetPopoverContext
          value={
            canvasControl
              ? {
                  id,
                  host: popoverHost,
                  style: {
                    ...style,
                    left: anchorX,
                    top: anchorY,
                    width: size.width,
                    height: anchorHeight,
                    pointerEvents: 'none',
                  },
                }
              : null
          }
        >
          {children}
        </WidgetPopoverContext>
      </div>
    </div>
  )
  if (inline || onFrame || placement.surface === 'hidden') return element
  return canvasHost ? createPortal(element, canvasHost) : null
}
