import type { PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Folder, Compass } from '../icons'
import type { Bounds, DesktopItem } from '../desktop'
import type { SearchPlacement } from '../canvas-search'
import { getFrameBounds, type FrameLayout } from '../frame-layout'
import { resolveObjectLocation } from '../object-location'
import AppIcon from './AppIcon'
import { APP_CATALOG } from './launcher-apps'
import styles from './DesktopItems.module.css'
import { CANVAS_LAYERS } from '../canvas-layers'

interface DesktopItemsProps {
  items: DesktopItem[]
  selectedIds: string[]
  returningIds?: string[]
  placements?: Map<string, SearchPlacement>
  frameLayout?: FrameLayout
  view?: Bounds
  frameHost?: HTMLElement | null
  dragHost?: HTMLElement | null
  draggingId?: string
  inline?: boolean
  previewSelectedId?: string
  onPointerDown: (
    event: PointerEvent<HTMLButtonElement>,
    item: DesktopItem,
  ) => void
  onOpen: (item: DesktopItem) => void
  onSelect: (item: DesktopItem, additive: boolean) => void
}

export default function DesktopItems({
  items,
  selectedIds,
  returningIds = [],
  placements,
  frameLayout,
  view,
  frameHost,
  dragHost,
  draggingId,
  previewSelectedId,
  inline = false,
  onPointerDown,
  onOpen,
  onSelect,
}: DesktopItemsProps) {
  return (
    <div
      className={inline ? styles.inlineLayer : styles.layer}
      role="group"
      aria-label="Desktop items"
    >
      {items.map((item) => {
        const placement = placements?.get(item.id)
        const location = resolveObjectLocation(
          frameLayout,
          { kind: 'item', id: item.id },
          item,
        )
        if (location.surface === 'hidden') return null
        if (
          !placements &&
          !inline &&
          location.surface === 'frame' &&
          (!view || !frameHost)
        )
          return null
        const framed =
          !placements &&
          location.surface === 'frame' &&
          (inline || (view && frameHost))
        const openOnClick = Boolean(framed || placements)
        const canvasBounds =
          location.surface === 'canvas' || location.surface === 'background'
            ? location.bounds
            : item
        const bounds = inline
          ? { x: 0, y: 0, width: 44, height: 44 }
          : framed && location.surface === 'frame' && view
            ? getFrameBounds(location, 54, 54, view, 'padded')
            : canvasBounds
        const element = (
          <button
            key={item.id}
            type="button"
            className={styles.item}
            data-desktop-item-id={item.id}
            data-item-kind={item.kind}
            data-favorite-returning={returningIds.includes(item.id)}
            data-group-member={inline || undefined}
            data-surface={placements ? 'canvas' : location.surface}
            data-frame-attached={Boolean(framed)}
            data-preview-match={placement?.matches}
            data-preview-selected={
              placement ? previewSelectedId === item.id : undefined
            }
            inert={placement?.matches === false}
            aria-label={item.title}
            title={framed ? item.title : undefined}
            aria-pressed={selectedIds.includes(item.id)}
            style={{
              position: inline ? 'relative' : framed ? 'fixed' : undefined,
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: bounds.height,
              zIndex:
                location.surface === 'canvas'
                  ? CANVAS_LAYERS.raised
                  : CANVAS_LAYERS.background,
              transform: placement
                ? `translate(${placement.x - canvasBounds.x}px, ${placement.y - canvasBounds.y}px) scale(${placement.scale})`
                : 'translate(0px, 0px) scale(1)',
            }}
            onPointerDown={(event) => onPointerDown(event, item)}
            onDoubleClick={(event) => {
              event.stopPropagation()
              if (!openOnClick) onOpen(item)
            }}
            onClick={(event) => {
              if (event.detail === 0 || (openOnClick && event.detail === 1))
                onOpen(item)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.stopPropagation()
                onOpen(item)
              } else if (event.key === ' ') {
                event.preventDefault()
                event.stopPropagation()
                onSelect(item, event.shiftKey || event.metaKey || event.ctrlKey)
              }
            }}
          >
            <span className={styles.icon} aria-hidden="true">
              {item.kind === 'folder' ? (
                <Folder size={framed ? 30 : 46} />
              ) : item.kind === 'file' ? (
                <FileText size={framed ? 28 : 42} />
              ) : (
                <AppIcon
                  appId={item.appId}
                  icon={
                    APP_CATALOG.find((app) => app.id === item.appId)?.icon ??
                    Compass
                  }
                  size={framed ? 24 : 38}
                />
              )}
            </span>
            <span className={styles.title}>{item.title}</span>
          </button>
        )
        if (!inline && draggingId === item.id && dragHost)
          return createPortal(element, dragHost, item.id)
        return framed && !inline && frameHost
          ? createPortal(element, frameHost, item.id)
          : element
      })}
    </div>
  )
}
