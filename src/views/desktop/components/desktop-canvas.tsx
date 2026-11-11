import type { ComponentProps, CSSProperties, ReactNode, Ref } from 'react'
import { CANVAS_LAYERS } from '../constants/canvas-layers'
import { CANVAS_GRID_SIZE } from '../utils/desktop'
import type { BackgroundPhoto } from '../types/background'
import type { Bounds, CanvasTool } from '../types/desktop'
import type { SelectionPoint } from '../utils/selection'
import DesktopItems from './desktop-items'
import DrawingLayer from './drawing-layer'
import FrameGuides from './frame-guides'
import SearchControlPreview from './search-control-preview'
import styles from '../desktop.module.css'

interface DesktopCanvasProps {
  viewport: Ref<HTMLDivElement>
  setCanvasHost: Ref<HTMLDivElement>
  view: Bounds
  world: Pick<Bounds, 'width' | 'height'>
  photo: BackgroundPhoto | null
  tool: CanvasTool
  focusView: boolean
  previewLayout: boolean
  spaceHeld: boolean
  dragging: boolean
  switcherOpen: boolean
  switcherId: string | null
  windowCount: number
  selection:
    (Bounds & { target: 'windows' | 'items'; points?: SelectionPoint[] }) | null
  events: Pick<
    ComponentProps<'div'>,
    'onScroll' | 'onPointerDownCapture' | 'onPointerDown'
  >
  items: ComponentProps<typeof DesktopItems>
  ink: Omit<ComponentProps<typeof DrawingLayer>, 'layer'> | null
  guide: ComponentProps<typeof FrameGuides>['target']
  controls: {
    key: string
    kind: 'widget' | 'tool'
    id: string
    selected: boolean
    position: { x: number; y: number; scale: number }
    onClick: () => void
    preview: ComponentProps<typeof SearchControlPreview>
  }[]
  children: ReactNode
}

export default function DesktopCanvas({
  viewport,
  setCanvasHost,
  view,
  world,
  photo,
  tool,
  focusView,
  previewLayout,
  spaceHeld,
  dragging,
  switcherOpen,
  switcherId,
  windowCount,
  selection,
  events,
  items,
  ink,
  guide,
  controls,
  children,
}: DesktopCanvasProps) {
  return (
    <div
      ref={viewport}
      tabIndex={-1}
      role={switcherOpen ? 'listbox' : undefined}
      aria-label={switcherOpen ? 'Switch windows' : undefined}
      aria-activedescendant={
        switcherOpen ? `switcher-${switcherId}` : undefined
      }
      className={`${styles.viewport} ${previewLayout || (!focusView && (tool === 'cursor' || tool === 'search')) ? styles.cursorReady : ''} ${!focusView && spaceHeld ? styles.panReady : ''} ${!focusView && dragging ? styles.dragging : ''} ${!focusView && !previewLayout && (tool === 'select' || tool === 'draw') && !spaceHeld ? styles.selecting : ''}`}
      data-canvas-viewport
      {...events}
      onAuxClick={(event) => event.preventDefault()}
    >
      <div
        ref={setCanvasHost}
        className={`${styles.world} ${photo ? styles.customBackground : ''}`}
        data-canvas-world
        data-background-fit={photo?.fit === 'repeat' ? 'repeat' : undefined}
        style={
          {
            '--canvas-grid-size': `${CANVAS_GRID_SIZE}px`,
            width: world.width,
            height: world.height,
            backgroundImage:
              photo?.fit === 'repeat' ? `url("${photo.url}")` : undefined,
          } as CSSProperties
        }
      >
        {tool === 'layout' && (
          <FrameGuides target={guide} viewport={view} layer="fill" />
        )}
        <div inert={focusView || switcherOpen}>
          <DesktopItems {...items} />
        </div>
        {ink && (
          <div className={styles.drawingLayer} style={{ zIndex: 0 }}>
            <DrawingLayer {...ink} layer="below" />
          </div>
        )}
        {children}
        {ink && (
          <div
            className={styles.drawingLayer}
            style={{ zIndex: CANVAS_LAYERS.raised }}
          >
            <DrawingLayer {...ink} layer="above" />
          </div>
        )}
        {controls.map(
          ({ key, kind, id, selected, position, preview, onClick }) => (
            <button
              key={key}
              type="button"
              className={styles.widgetResult}
              data-search-result-kind={kind}
              data-search-result-id={id}
              data-preview-selected={selected}
              style={{
                left: position.x,
                top: position.y,
                width: 240,
                height: 72,
                transform: `scale(${position.scale})`,
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onClick}
            >
              <SearchControlPreview {...preview} />
            </button>
          ),
        )}
        {selection?.points ? (
          <svg
            className={styles.freeformSelection}
            aria-hidden="true"
            viewBox={`${selection.x - 2} ${selection.y - 2} ${selection.width + 4} ${selection.height + 4}`}
            style={{
              left: selection.x - 2,
              top: selection.y - 2,
              width: selection.width + 4,
              height: selection.height + 4,
              zIndex: CANVAS_LAYERS.window + windowCount,
            }}
          >
            <polygon
              points={selection.points.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
            <polyline
              points={selection.points.map(({ x, y }) => `${x},${y}`).join(' ')}
            />
            <path
              d={`M${selection.points.at(-1)!.x},${selection.points.at(-1)!.y} L${selection.points[0].x},${selection.points[0].y}`}
              strokeDasharray="3 4"
            />
          </svg>
        ) : (
          selection && (
            <div
              className={styles.selection}
              style={{
                left: selection.x,
                top: selection.y,
                width: selection.width,
                height: selection.height,
                zIndex:
                  selection.target === 'items'
                    ? 0
                    : CANVAS_LAYERS.window + windowCount,
              }}
            />
          )
        )}
      </div>
    </div>
  )
}
