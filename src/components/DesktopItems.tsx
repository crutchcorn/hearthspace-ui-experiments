import type { PointerEvent } from 'react'
import { createPortal } from 'react-dom'
import { FileText, Folder, Globe } from 'lucide-react'
import type { Bounds, DesktopItem } from '../desktop'
import type { SearchPlacement } from '../canvas-search'
import { getFrameBounds, getPlacement, type FrameLayout } from '../frame-layout'
import AppIcon from './AppIcon'
import { APP_CATALOG } from './launcher-apps'
import styles from './DesktopItems.module.css'

interface DesktopItemsProps {
  items: DesktopItem[]
  selectedIds: string[]
  returningIds?: string[]
  placements?: Map<string, SearchPlacement>
  frameLayout?: FrameLayout
  view?: Bounds
  frameHost?: HTMLElement | null
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
        const layout = frameLayout
          ? getPlacement(frameLayout, { kind: 'item', id: item.id })
          : { surface: 'background' as const }
        const framed =
          !placements &&
          (inline || (layout.surface === 'frame' && view && frameHost))
        const bounds = inline
          ? { x: 0, y: 0, width: 44, height: 44 }
          : framed && layout.surface === 'frame' && view
            ? getFrameBounds(layout, 54, 54, view, 'padded')
            : item
        const element = (
          <button
            key={item.id}
            type="button"
            className={styles.item}
            data-desktop-item-id={item.id}
            data-item-kind={item.kind}
            data-favorite-returning={returningIds.includes(item.id)}
            data-group-member={inline || undefined}
            data-surface={placements ? 'canvas' : layout.surface}
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
              zIndex: layout.surface === 'canvas' ? 500 : 0,
              transform: placement
                ? `translate(${placement.x - item.x}px, ${placement.y - item.y}px) scale(${placement.scale})`
                : 'translate(0px, 0px) scale(1)',
            }}
            onPointerDown={(event) => onPointerDown(event, item)}
            onDoubleClick={(event) => {
              event.stopPropagation()
              onOpen(item)
            }}
            onClick={(event) => {
              if (placements || event.detail === 0) onOpen(item)
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
                <Folder size={framed ? 32 : 46} strokeWidth={1.2} />
              ) : item.kind === 'file' ? (
                <FileText size={framed ? 30 : 42} strokeWidth={1.2} />
              ) : (
                <AppIcon
                  appId={item.appId}
                  icon={
                    APP_CATALOG.find((app) => app.id === item.appId)?.icon ??
                    Globe
                  }
                  size={framed ? 32 : 38}
                  strokeWidth={1.4}
                />
              )}
            </span>
            <span className={styles.title}>{item.title}</span>
          </button>
        )
        return framed && !inline && frameHost
          ? createPortal(element, frameHost, item.id)
          : element
      })}
    </div>
  )
}
