import {
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import {
  getFrameBounds,
  type FrameEdge,
  type ObjectPlacement,
} from '../frame-layout'
import type { Bounds } from '../desktop'
import styles from './PlacedWidget.module.css'

interface PlacedWidgetProps {
  id: string
  placement: ObjectPlacement
  view: Bounds
  editing: boolean
  selected: boolean
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
  id,
  placement,
  view,
  editing,
  selected,
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
  const onFrame = placement.surface === 'frame'
  const dragged = draggingWidget?.id === id ? draggingWidget : null
  const edge = dragged ? dragged.edge : onFrame ? placement.edge : undefined

  useLayoutEffect(() => {
    const element = content.current
    if (!element) return
    function measure() {
      if (!element || !wrapper.current) return
      const width = element.offsetWidth
      const height = element.offsetHeight
      if (!width || !height) return
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
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [edge, merged])

  const bounds = onFrame
    ? getFrameBounds(placement, size.width, size.height, view)
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
  const sideOpenBelow = y + bounds.height / 2 <= view.height / 2
  const sideTop = Math.max(12, Math.min(y, view.height - 12))
  const sideBottom = Math.max(12, Math.min(y + bounds.height, view.height - 12))
  const spaceBelow = Math.max(0, view.height - y - bounds.height - 24)
  const spaceAbove = Math.max(0, y - 24)
  const openBelow = onFrame
    ? placement.edge === 'top' ||
      (placement.edge !== 'bottom' && spaceBelow >= spaceAbove)
    : spaceBelow >= spaceAbove
  const style = {
    '--widget-x': `${x}px`,
    '--widget-y': `${y}px`,
    '--widget-side-top': sideOpenBelow ? `${sideTop - y}px` : 'auto',
    '--widget-side-bottom': sideOpenBelow
      ? 'auto'
      : `${y + bounds.height - sideBottom}px`,
    '--widget-side-height': `${Math.max(0, sideOpenBelow ? view.height - sideTop - 12 : sideBottom - 12)}px`,
    '--widget-z': onFrame ? 1100 : placement.surface === 'background' ? 2 : 900,
    '--widget-measured-x': `${measured?.x ?? x}px`,
    '--widget-merged-popover-height': `${
      merged === 'top'
        ? Math.max(
            0,
            view.height -
              (measured?.y ?? y) -
              (measured?.height ?? size.height) -
              24,
          )
        : Math.max(0, (measured?.y ?? y) - 24)
    }px`,
    '--widget-popover-top': openBelow ? 'calc(100% + 12px)' : 'auto',
    '--widget-popover-bottom': openBelow ? 'auto' : 'calc(100% + 12px)',
    '--widget-unmerged-popover-height': `${openBelow ? spaceBelow : spaceAbove}px`,
  } as CSSProperties

  return (
    <div
      ref={wrapper}
      className={styles.widget}
      style={style}
      hidden={hidden || placement.surface === 'hidden'}
      data-layout-widget={id}
      data-merged={merged}
      data-layout-surface={placement.surface}
      data-layout-editing={editing}
      data-layout-selected={editing && selected}
      data-frame-edge={edge}
      data-shell-controls
    >
      <div ref={content} className={styles.content} inert={editing}>
        {children}
      </div>
    </div>
  )
}
