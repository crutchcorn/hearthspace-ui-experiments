import type { PointerEvent, ReactNode } from 'react'
import {
  ArrowDownRight,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  X,
} from '../../../components/icons'
import { CANVAS_LAYERS } from '../constants/canvas-layers'
import { LAYOUT_MOTION_ID } from '../constants/layout-motion'
import type { Bounds, DesktopWindow as Window } from '../types/desktop'
import type { FramePreviewBounds } from '../types/frame-preview'
import type { SearchPlacement } from '../utils/canvas-search'
import type { FrameEdge, ObjectPlacement } from '../utils/frame-layout'
import AppIcon, { AppGlyph } from './app-icon'
import WindowHost from './window-host'
import styles from '../desktop.module.css'

interface DesktopWindowProps {
  item: Window
  index: number
  windowCount: number
  appId: string
  view: Bounds
  container: HTMLElement | null
  placement?: SearchPlacement
  surface: ObjectPlacement['surface']
  edge?: FrameEdge
  attached: boolean
  expanded: boolean
  slot?: FramePreviewBounds
  frameBounds: Bounds | null
  canvasBounds: Bounds
  offset: Pick<Bounds, 'x' | 'y'>
  editing: boolean
  layoutSelected: boolean
  drawingLaunch: boolean
  active: boolean
  focused: boolean
  otherFocused: boolean
  inFocusView: boolean
  previewLayout: boolean
  previewExiting: boolean
  previewSelected: boolean
  switcherOpen: boolean
  selected: boolean
  grouped: boolean
  contentInert: boolean
  onElement: (element: HTMLElement | null) => void
  onHover: (hovered: boolean) => void
  onFocus: () => void
  onMove: (event: PointerEvent<HTMLElement>) => void
  onMaximize: () => void
  onToggleFocus: () => void
  onClose: () => void
  onResize: (event: PointerEvent<HTMLDivElement>, edge: string) => void
  onSelectPreview: () => void
  children: ReactNode
}

const edges = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw']

export default function DesktopWindow({
  item,
  index,
  windowCount,
  appId,
  view,
  container,
  placement,
  surface,
  edge,
  attached,
  expanded,
  slot,
  frameBounds,
  canvasBounds,
  offset,
  editing,
  layoutSelected,
  drawingLaunch,
  active,
  focused,
  otherFocused,
  inFocusView,
  previewLayout,
  previewExiting,
  previewSelected,
  switcherOpen,
  selected,
  grouped,
  contentInert,
  onElement,
  onHover,
  onFocus,
  onMove,
  onMaximize,
  onToggleFocus,
  onClose,
  onResize,
  onSelectPreview,
  children,
}: DesktopWindowProps) {
  return (
    <WindowHost container={container}>
      <section
        ref={onElement}
        tabIndex={-1}
        aria-label={item.title}
        data-window-id={item.id}
        data-app-id={appId}
        data-surface={surface}
        data-frame-edge={attached ? edge : undefined}
        data-pinned-collapsed={attached && !expanded}
        onPointerEnter={(event) => {
          if (
            attached &&
            !editing &&
            event.pointerType !== 'touch' &&
            !event.currentTarget
              .getAnimations()
              .some((animation) => animation.id === LAYOUT_MOTION_ID)
          )
            onHover(true)
        }}
        onPointerLeave={() => {
          if (attached) onHover(false)
        }}
        data-layout-selected={layoutSelected}
        data-drawing-launch={!previewLayout && !previewExiting && drawingLaunch}
        data-external={appId !== 'settings' && !appId.startsWith('workspace-')}
        data-active={!previewLayout && active}
        data-focus-mode={focused}
        data-preview-match={placement?.matches}
        data-preview-selected={placement ? previewSelected : undefined}
        inert={otherFocused || placement?.matches === false}
        data-selected={!previewLayout && selected}
        data-grouped={grouped}
        className={styles.window}
        style={{
          clipPath:
            slot && frameBounds && attached && !expanded
              ? edge === 'top' || edge === 'bottom'
                ? `inset(0px ${Math.max(0, frameBounds.x + frameBounds.width - slot.frame.x - slot.frame.width)}px 0px ${Math.max(0, slot.frame.x - frameBounds.x)}px)`
                : `inset(${Math.max(0, slot.frame.y - frameBounds.y)}px 0px ${Math.max(0, frameBounds.y + frameBounds.height - slot.frame.y - slot.frame.height)}px 0px)`
              : undefined,
          position: focused || attached ? 'fixed' : undefined,
          left: focused ? 0 : (frameBounds?.x ?? canvasBounds.x),
          top: focused ? 0 : (frameBounds?.y ?? canvasBounds.y),
          width: focused ? view.width : (frameBounds?.width ?? item.width),
          height: focused ? view.height : (frameBounds?.height ?? item.height),
          transform: placement
            ? `translate(${placement.x - item.x}px, ${placement.y - item.y}px) scale(${placement.scale})`
            : `translate(${offset.x}px, ${offset.y}px) scale(1)`,
          zIndex: focused
            ? CANVAS_LAYERS.window + windowCount
            : attached
              ? 1100 + index
              : surface === 'background'
                ? CANVAS_LAYERS.backgroundWindow
                : CANVAS_LAYERS.window + index,
        }}
        onFocusCapture={() => {
          if (!previewLayout) onFocus()
        }}
        onPointerDown={(event) => {
          if (!previewLayout && !(event.target as Element).closest('button'))
            onFocus()
        }}
      >
        <header
          inert={previewLayout || (attached && !expanded)}
          className={styles.titlebar}
          onPointerDown={(event) => {
            if (!attached && !(event.target as HTMLElement).closest('button'))
              onMove(event)
          }}
          onDoubleClick={(event) => {
            if (!(event.target as HTMLElement).closest('button')) onMaximize()
          }}
        >
          {appId === 'files' && (
            <span className={styles.nativeNavigation} aria-hidden="true">
              <ChevronLeft size={17} />
              <ChevronRight size={17} />
            </span>
          )}
          <span className={styles.windowTitle}>
            <span className={styles.windowAppIcon}>
              <AppIcon appId={appId} size={15} />
            </span>
            <span className={styles.windowName}>{item.title}</span>
          </span>
          <div className={styles.windowActions}>
            <button
              title={
                attached
                  ? 'Tuck into frame'
                  : inFocusView
                    ? 'Leave focused view'
                    : 'Maximize window'
              }
              aria-label={`${attached ? 'Tuck into frame' : inFocusView ? 'Leave focused view for' : 'Maximize'} ${item.title}`}
              onClick={onToggleFocus}
            >
              {attached || inFocusView ? (
                <Minimize size={12} />
              ) : (
                <Maximize size={12} />
              )}
            </button>
            <button
              title="Close window"
              aria-label={`Close ${item.title}`}
              onClick={onClose}
            >
              <X size={15} />
            </button>
          </div>
        </header>
        <div
          className={styles.windowBody}
          inert={previewLayout || (attached && !expanded) || contentInert}
        >
          {appId === 'notes' && (
            <div className={styles.nativeMenu} aria-hidden="true">
              <span>File</span>
              <span>Edit</span>
              <span>View</span>
              <span>Search</span>
            </div>
          )}
          {children}
        </div>
        {!previewLayout &&
          !attached &&
          !item.restore &&
          edges.map((edge) => (
            <div
              key={edge}
              data-resize={edge}
              className={`${styles.resizeHandle} ${styles[`resize${edge}`]}`}
              onPointerDown={(event) => onResize(event, edge)}
            />
          ))}
        {!previewLayout && !attached && !item.restore && (
          <ArrowDownRight className={styles.resizeHint} size={12} />
        )}
        {placement?.matches && (
          <button
            type="button"
            id={switcherOpen ? `switcher-${item.id}` : undefined}
            role={switcherOpen ? 'option' : undefined}
            aria-selected={switcherOpen ? previewSelected : undefined}
            tabIndex={switcherOpen ? -1 : 0}
            className={styles.previewWindowTarget}
            aria-label={`Open ${item.title} window`}
            onPointerDown={(event) => event.preventDefault()}
            onClick={onSelectPreview}
          />
        )}
        {attached && !expanded && (
          <button
            className={styles.pinnedReveal}
            aria-label={`Open pinned ${item.title}`}
            onClick={() => onFocus()}
          >
            <span>
              <AppGlyph appId={appId} size={18} />
              <span>{item.title}</span>
            </span>
          </button>
        )}
      </section>
    </WindowHost>
  )
}
