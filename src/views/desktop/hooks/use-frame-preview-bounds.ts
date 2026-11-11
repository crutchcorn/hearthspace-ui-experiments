import { useCallback, useState } from 'react'
import type { FramePreviewBounds } from '../types/frame-preview'
import { targetKey, type LayoutTarget } from '../utils/frame-layout'

export function useFramePreviewBounds() {
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
  return { framePreviewBounds, updateFramePreviewBounds }
}
