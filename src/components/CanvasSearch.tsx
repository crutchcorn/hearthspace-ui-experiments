import { Pencil, Search, X } from 'lucide-react'
import { useLayoutEffect, useRef, type CSSProperties } from 'react'
import { cancelHandwritingRecognition } from '../handwriting'
import HandwritingPad from './HandwritingPad'
import styles from './CanvasSearch.module.css'

interface CanvasSearchProps {
  position: { x: number; y: number; width: number }
  query: string
  onQueryChange: (query: string) => void
  onClose: () => void
  onActivate: () => void
  onNavigate: (direction: 1 | -1) => void
  empty: boolean
  resultsAbove: boolean
  handwritingOpen: boolean
  onHandwritingOpenChange: (open: boolean) => void
  handwritingHeight?: number
}

export default function CanvasSearch({
  position,
  query,
  onQueryChange,
  onClose,
  onActivate,
  onNavigate,
  empty,
  resultsAbove,
  handwritingOpen,
  onHandwritingOpenChange,
  handwritingHeight = 145,
}: CanvasSearchProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useLayoutEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  function closeSearch() {
    cancelHandwritingRecognition()
    onHandwritingOpenChange(false)
    onClose()
  }

  function activate() {
    cancelHandwritingRecognition()
    onActivate()
  }

  return (
    <form
      role="search"
      aria-label="Canvas search"
      data-canvas-search
      className={styles.search}
      data-results-above={resultsAbove}
      style={
        {
          left: position.x,
          top: position.y + (resultsAbove ? 54 : 0),
          width: position.width,
          '--handwriting-pad-height': `${Math.max(0, handwritingHeight - 1)}px`,
        } as CSSProperties
      }
      onPointerDown={(event) => event.stopPropagation()}
      onSubmit={(event) => {
        event.preventDefault()
        activate()
      }}
    >
      <div className={styles.field}>
        <Search size={20} strokeWidth={1.5} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          aria-label="Search apps, windows, files, folders, drawings, and widgets"
          placeholder="Search the canvas…"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={(event) => {
            cancelHandwritingRecognition()
            onQueryChange(event.target.value)
          }}
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
              closeSearch()
            } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
              event.preventDefault()
              event.stopPropagation()
              onNavigate(event.key === 'ArrowDown' ? 1 : -1)
            } else if (event.key === 'Enter') {
              event.preventDefault()
              event.stopPropagation()
              activate()
            }
          }}
        />
        <button
          type="button"
          className={styles.close}
          aria-label="Use handwriting"
          title="Use handwriting"
          aria-pressed={handwritingOpen}
          onClick={() => {
            const next = !handwritingOpen
            onHandwritingOpenChange(next)
            if (!next) inputRef.current?.focus({ preventScroll: true })
          }}
        >
          <Pencil size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.close}
          aria-label="Close canvas search"
          onClick={closeSearch}
        >
          <X size={18} strokeWidth={1.5} aria-hidden="true" />
        </button>
      </div>
      {handwritingOpen && (
        <div className={styles.handwriting}>
          <HandwritingPad
            query={query}
            onText={(text) =>
              onQueryChange(`${query.trimEnd()} ${text}`.trim())
            }
          />
        </div>
      )}
      {empty && (
        <p className={styles.empty} role="status">
          No matches
        </p>
      )}
    </form>
  )
}
