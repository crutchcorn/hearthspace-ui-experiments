import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from 'react'

type Position = { x: number; y: number }
type Surface = HTMLElement | SVGSVGElement

export default function usePeekMotion(
  viewport: RefObject<HTMLDivElement | null>,
  enabled: boolean,
) {
  const [request, setRequest] = useState(0)
  const origins = useRef(new Map<Surface, Position>())
  const animations = useRef<Animation[]>([])

  const cancel = useCallback(() => {
    origins.current.clear()
    animations.current.forEach((animation) => animation.cancel())
    animations.current = []
  }, [])

  const prepare = useCallback(
    ({
      excludedWindowId,
      backgroundOnly = false,
      drawingOrigin,
    }: {
      excludedWindowId?: string
      backgroundOnly?: boolean
      drawingOrigin?: Position & { id: string }
    } = {}) => {
      cancel()
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      for (const element of viewport.current?.querySelectorAll<Surface>(
        backgroundOnly
          ? '[data-desktop-item-id], [data-drawing-id], [data-canvas-control-id]'
          : '[data-window-id], [data-desktop-item-id], [data-drawing-id], [data-canvas-control-id]',
      ) ?? []) {
        if (
          element.dataset.surface === 'frame' ||
          element.dataset.layoutSurface === 'frame'
        )
          continue
        if (element.dataset.windowId === excludedWindowId && excludedWindowId)
          continue
        // Extending ink can rebase its SVG bounds without moving the artwork.
        if (drawingOrigin && element.dataset.drawingId === drawingOrigin.id) {
          origins.current.set(element, drawingOrigin)
          continue
        }
        const style = getComputedStyle(element)
        origins.current.set(element, {
          x: Number.parseFloat(style.left),
          y: Number.parseFloat(style.top),
        })
      }
      setRequest((current) => current + 1)
    },
    [cancel, viewport],
  )

  useLayoutEffect(() => {
    if (!enabled) {
      cancel()
      return
    }
    const moves = [...origins.current].flatMap(([element, origin]) => {
      if (!element.isConnected) return []
      const style = getComputedStyle(element)
      const x = origin.x - Number.parseFloat(style.left)
      const y = origin.y - Number.parseFloat(style.top)
      return Number.isFinite(x) && Number.isFinite(y) && Math.hypot(x, y) > 0.5
        ? [{ element, x, y }]
        : []
    })
    origins.current.clear()
    // Individual translate leaves the existing search/launch transform intact.
    const running = moves.map(({ element, x, y }) =>
      element.animate(
        [{ translate: `${x}px ${y}px` }, { translate: '0px 0px' }],
        { duration: 300, easing: 'cubic-bezier(0.22, 0.61, 0.36, 1)' },
      ),
    )
    animations.current = running
    void Promise.allSettled(
      running.map((animation) => animation.finished),
    ).then(() => {
      running.forEach((animation) => animation.cancel())
      if (animations.current === running) animations.current = []
    })
  }, [request, enabled, cancel])

  useLayoutEffect(() => cancel, [cancel])

  return { prepare, cancel }
}
