import { useState, type ReactNode } from 'react'
import PlacedWidget from '../src/views/desktop/components/placed-widget'
import { viewport } from './fixtures'

export function CanvasSample({
  children,
  width = viewport.width,
  height = viewport.height,
}: {
  children: ReactNode
  width?: number
  height?: number
}) {
  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        contain: 'layout',
        width,
        height,
      }}
    >
      {children}
    </div>
  )
}

export function SettingsSample({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        position: 'relative',
        width: 'min(640px, calc(100vw - 48px))',
        height: 460,
        overflow: 'auto',
        background: 'var(--material-surface)',
        border: '1px solid var(--chrome-border)',
        borderRadius: 'var(--radius-panel)',
      }}
    >
      {children}
    </div>
  )
}

export function WidgetSample({
  id,
  children,
}: {
  id: string
  children: ReactNode
}) {
  const [host, setHost] = useState<HTMLDivElement | null>(null)
  return (
    <div style={{ minHeight: 320, paddingTop: 16 }}>
      <div ref={setHost} />
      <PlacedWidget
        id={id}
        inline
        orientationEdge="top"
        view={{
          ...viewport,
          width: window.innerWidth,
          height: window.innerHeight,
        }}
        placement={{ surface: 'frame', edge: 'top', position: 0 }}
        canvasHost={null}
        dragHost={null}
        popoverHost={host}
        editing={false}
        selected={false}
        draggingWidget={null}
      >
        {children}
      </PlacedWidget>
    </div>
  )
}
