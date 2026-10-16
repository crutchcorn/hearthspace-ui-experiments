import { useRef, useState, type PointerEvent } from 'react'
import type { Bounds, Workspace } from '../desktop'
import styles from './Minimap.module.css'

interface MinimapProps {
  workspace: Workspace
  view: Bounds
  onNavigate: (x: number, y: number) => void
}

export default function Minimap({ workspace, view, onNavigate }: MinimapProps) {
  const gesture = useRef<{
    pointerId: number
    offsetX: number
    offsetY: number
  } | null>(null)
  const [dragging, setDragging] = useState(false)

  function worldPoint(event: PointerEvent<HTMLButtonElement>) {
    const map = event.currentTarget
    const rect = map.getBoundingClientRect()
    return {
      x:
        ((event.clientX - rect.left - map.clientLeft) / map.clientWidth) *
        workspace.width,
      y:
        ((event.clientY - rect.top - map.clientTop) / map.clientHeight) *
        workspace.height,
    }
  }

  function navigate(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    const point = worldPoint(event)
    onNavigate(point.x - current.offsetX, point.y - current.offsetY)
  }

  function finish(event: PointerEvent<HTMLButtonElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return
    gesture.current = null
    setDragging(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <button
      className={styles.map}
      aria-label="Navigate the workspace map"
      data-dragging={dragging}
      onPointerDown={(event) => {
        if (event.button !== 0 || gesture.current) return
        event.preventDefault()
        const point = worldPoint(event)
        const insideViewport =
          point.x >= view.x &&
          point.x <= view.x + view.width &&
          point.y >= view.y &&
          point.y <= view.y + view.height
        // Keep the grabbed point under the pointer instead of snapping the
        // viewport's center to it when dragging the visible-area rectangle.
        gesture.current = {
          pointerId: event.pointerId,
          offsetX: insideViewport ? point.x - view.x : view.width / 2,
          offsetY: insideViewport ? point.y - view.y : view.height / 2,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        setDragging(true)
        navigate(event)
      }}
      onPointerMove={navigate}
      onPointerUp={(event) => {
        navigate(event)
        finish(event)
      }}
      onPointerCancel={finish}
      onLostPointerCapture={finish}
    >
      {workspace.windows.map((item) => (
        <span
          key={item.id}
          className={styles.window}
          style={{
            left: `${(item.x / workspace.width) * 100}%`,
            top: `${(item.y / workspace.height) * 100}%`,
            width: `${(item.width / workspace.width) * 100}%`,
            height: `${(item.height / workspace.height) * 100}%`,
          }}
        />
      ))}
      <span
        className={styles.viewport}
        style={{
          left: `${(view.x / workspace.width) * 100}%`,
          top: `${(view.y / workspace.height) * 100}%`,
          width: `${(view.width / workspace.width) * 100}%`,
          height: `${(view.height / workspace.height) * 100}%`,
        }}
      />
    </button>
  )
}
