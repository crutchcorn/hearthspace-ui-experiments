import { Search, X } from 'lucide-react'
import { useLayoutEffect, useRef } from 'react'
import styles from './CanvasSearch.module.css'

interface CanvasSearchProps {
  position: { x: number; y: number; width: number }
  query: string
  onQueryChange: (query: string) => void
  onClose: () => void
  onActivate: () => void
  onNavigate: (direction: 1 | -1) => void
  empty: boolean
}

export default function CanvasSearch({
  position,
  query,
  onQueryChange,
  onClose,
  onActivate,
  onNavigate,
  empty,
}: CanvasSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <form
      role="search"
      aria-label="Canvas search"
      data-canvas-search
      className={styles.search}
      style={{ left: position.x, top: position.y, width: position.width }}
      onPointerDown={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault()
        onActivate()
      }}
    >
      <div className={styles.field}>
        <Search size={20} strokeWidth={1.5} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          aria-label="Search apps, windows, files and folders"
          placeholder="Search apps, windows, files…"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          onKeyDown={(event) => {
            if (
              event.ctrlKey ||
              event.metaKey ||
              event.altKey ||
              event.nativeEvent.isComposing
            )
              return
            if (event.key === 'Escape') {
              event.preventDefault()
              event.stopPropagation()
              onClose()
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              event.stopPropagation()
              onNavigate(event.key === 'ArrowDown' ? 1 : -1)
            } else if (event.key === 'Enter') {
              event.preventDefault()
              event.stopPropagation()
              onActivate()
            }
          }}
        />
        <button
          type="button"
          className={styles.close}
          aria-label="Close canvas search"
          onClick={onClose}
        >
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      {empty && (
        <p className={styles.empty} role="status">
          No matches
        </p>
      )}
    </form>
  )
}
