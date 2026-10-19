import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import type { Bounds } from '../desktop'
import { targetKey, type LayoutTarget } from '../frame-layout'
import styles from './FramePreviewSlot.module.css'

export type FramePreviewBounds = Bounds & { frame: Bounds }

interface FramePreviewSlotProps {
  target: LayoutTarget
  width: number
  height: number
  onBounds: (target: LayoutTarget, bounds: FramePreviewBounds | null) => void
  children?: ReactNode
}

export default function FramePreviewSlot({
  target,
  width,
  height,
  onBounds,
  children,
}: FramePreviewSlotProps) {
  const element = useRef<HTMLDivElement>(null)
  const lastBounds = useRef<FramePreviewBounds | null>(null)
  const { kind, id } = target
  const stableTarget = useMemo(() => ({ kind, id }), [kind, id])
  const measure = useCallback(() => {
    if (!element.current) return
    const rect = element.current.getBoundingClientRect()
    const frame =
      element.current
        .closest('[data-layout-group][data-layout-surface]')
        ?.getBoundingClientRect() ?? rect
    const bounds = {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      frame: {
        x: frame.x,
        y: frame.y,
        width: frame.width,
        height: frame.height,
      },
    }
    if (
      lastBounds.current?.x === bounds.x &&
      lastBounds.current.y === bounds.y &&
      lastBounds.current.width === bounds.width &&
      lastBounds.current.height === bounds.height &&
      lastBounds.current.frame.x === bounds.frame.x &&
      lastBounds.current.frame.y === bounds.frame.y &&
      lastBounds.current.frame.width === bounds.frame.width &&
      lastBounds.current.frame.height === bounds.frame.height
    )
      return
    lastBounds.current = bounds
    onBounds(stableTarget, bounds)
  }, [onBounds, stableTarget])

  useLayoutEffect(() => {
    measure()
    const frame = requestAnimationFrame(measure)
    return () => cancelAnimationFrame(frame)
  })

  useLayoutEffect(() => {
    const observer = new ResizeObserver(measure)
    if (element.current) {
      observer.observe(element.current)
      const group = element.current.closest(
        '[data-layout-group][data-layout-surface]',
      )
      if (group) observer.observe(group)
    }
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
      lastBounds.current = null
      onBounds(stableTarget, null)
    }
  }, [measure, onBounds, stableTarget])

  return (
    <div
      ref={element}
      className={styles.slot}
      style={{ width, height }}
      data-frame-preview-slot={targetKey(target)}
      aria-hidden="true"
    >
      {children}
    </div>
  )
}
