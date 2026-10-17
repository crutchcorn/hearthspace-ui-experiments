import type { PointerEvent } from 'react'
import { FileText, Folder, Globe } from 'lucide-react'
import type { DesktopItem } from '../desktop'
import type { SearchPlacement } from '../canvas-search'
import AppIcon from './AppIcon'
import { APP_CATALOG } from './launcher-apps'
import styles from './DesktopItems.module.css'

interface DesktopItemsProps {
  items: DesktopItem[]
  selectedIds: string[]
  placements?: Map<string, SearchPlacement>
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
  placements,
  previewSelectedId,
  onPointerDown,
  onOpen,
  onSelect,
}: DesktopItemsProps) {
  return (
    <div className={styles.layer} role="group" aria-label="Desktop items">
      {items.map((item) => {
        const placement = placements?.get(item.id)
        return (
          <button
            key={item.id}
            type="button"
            className={styles.item}
            data-desktop-item-id={item.id}
            data-item-kind={item.kind}
            data-preview-match={placement?.matches}
            data-preview-selected={
              placement ? previewSelectedId === item.id : undefined
            }
            inert={placement?.matches === false}
            aria-label={item.title}
            aria-pressed={selectedIds.includes(item.id)}
            style={{
              left: item.x,
              top: item.y,
              width: item.width,
              height: item.height,
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
                <Folder size={46} strokeWidth={1.2} />
              ) : item.kind === 'file' ? (
                <FileText size={42} strokeWidth={1.2} />
              ) : (
                <AppIcon
                  appId={item.appId}
                  icon={
                    APP_CATALOG.find((app) => app.id === item.appId)?.icon ??
                    Globe
                  }
                  size={38}
                  strokeWidth={1.4}
                />
              )}
            </span>
            <span className={styles.title}>{item.title}</span>
          </button>
        )
      })}
    </div>
  )
}
