import { useId, useLayoutEffect, useRef, type CSSProperties } from 'react'
import { PanelsTopLeft, StickyNote } from 'lucide-react'
import type { DesktopWindow } from '../desktop'
import AppIcon from './AppIcon'
import { APP_CATALOG } from './launcher-apps'
import styles from './WindowSwitcher.module.css'

interface WindowSwitcherProps {
  windows: DesktopWindow[]
  selectedId: string
  onSelect: (id: string) => void
  onCancel: () => void
}

export default function WindowSwitcher({
  windows,
  selectedId,
  onSelect,
  onCancel,
}: WindowSwitcherProps) {
  const instanceId = useId()
  const listRef = useRef<HTMLDivElement>(null)
  const options = useRef(new Map<string, HTMLButtonElement>())
  const selectedWindow = windows.find((item) => item.id === selectedId)

  useLayoutEffect(() => {
    listRef.current?.focus({ preventScroll: true })
  }, [])

  useLayoutEffect(() => {
    const list = listRef.current
    const selected = options.current.get(selectedId)
    if (!list || !selected) return
    const panel = list.getBoundingClientRect()
    const option = selected.getBoundingClientRect()
    const inset = 12
    // Scroll only the switcher; the canvas stays still until a window is chosen.
    if (option.top < panel.top + inset)
      list.scrollTop += option.top - panel.top - inset
    else if (option.bottom > panel.bottom - inset)
      list.scrollTop += option.bottom - panel.bottom + inset
  }, [selectedId, windows])

  return (
    <div
      className={styles.backdrop}
      data-window-switcher
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel()
      }}
    >
      <div
        className={styles.panel}
        style={
          {
            '--switcher-columns': Math.min(windows.length, 4),
            '--switcher-mobile-columns': Math.min(windows.length, 2),
          } as CSSProperties
        }
      >
        <div
          ref={listRef}
          className={styles.windows}
          role="listbox"
          aria-label="Switch windows"
          aria-activedescendant={`${instanceId}-${selectedId}`}
          tabIndex={-1}
        >
          {windows.map((item, index) => {
            const app = APP_CATALOG.find((entry) => entry.id === item.appId)
            const appId =
              app?.id ??
              (item.kind === 'notes'
                ? 'notes'
                : item.kind === 'welcome'
                  ? 'workspace-welcome'
                  : 'workspace-windows')
            const Icon =
              app?.icon ?? (item.kind === 'notes' ? StickyNote : PanelsTopLeft)

            return (
              <button
                key={item.id}
                ref={(element) => {
                  if (element) options.current.set(item.id, element)
                  else options.current.delete(item.id)
                }}
                id={`${instanceId}-${item.id}`}
                type="button"
                role="option"
                className={styles.window}
                aria-label={`${item.title}, window ${index + 1} of ${windows.length}`}
                aria-selected={item.id === selectedId}
                tabIndex={-1}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => onSelect(item.id)}
              >
                <span className={styles.preview} aria-hidden="true">
                  <span className={styles.titlebar}>
                    <span />
                    <span />
                  </span>
                  <span className={styles.identity}>
                    <AppIcon appId={appId} icon={Icon} size={32} />
                  </span>
                </span>
              </button>
            )
          })}
        </div>
        <div className={styles.title} aria-hidden="true">
          {selectedWindow?.title}
        </div>
      </div>
    </div>
  )
}
