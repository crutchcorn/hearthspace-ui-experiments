import { Pencil, Search, X } from '../../../components/icons'
import {
  useLayoutEffect,
  useRef,
  type ComponentType,
  type CSSProperties,
} from 'react'
import styles from './canvas-search.module.css'

interface CanvasSearchProps {
  position: { x: number; y: number; width: number }
  query: string
  onQueryChange: (query: string) => void
  onRecognizedText: (text: string) => void
  onClose: () => void
  onActivate: () => void
  onNavigate: (direction: 1 | -1) => void
  empty: boolean
  resultsAbove: boolean
  handwritingOpen: boolean
  onHandwritingOpenChange: (open: boolean) => void
  handwritingHeight?: number
  Handwriting: ComponentType<{ query: string; onText: (text: string) => void }>
}

export default function CanvasSearch({
  position,
  query,
  onQueryChange,
  onRecognizedText,
  onClose,
  onActivate,
  onNavigate,
  empty,
  resultsAbove,
  handwritingOpen,
  onHandwritingOpenChange,
  handwritingHeight = 145,
  Handwriting,
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
        onActivate()
      }}
    >
      <div className={styles.field}>
        <Search size={20} aria-hidden="true" />
        <input
          ref={inputRef}
          type="text"
          role="searchbox"
          aria-label="Search apps, windows, files, folders, drawings, tools, and widgets"
          placeholder="Search the canvas…"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={(event) => {
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
          aria-label="Use handwriting"
          title="Use handwriting"
          aria-pressed={handwritingOpen}
          onClick={() => {
            const next = !handwritingOpen
            onHandwritingOpenChange(next)
            if (!next) inputRef.current?.focus({ preventScroll: true })
          }}
        >
          <Pencil size={18} aria-hidden="true" />
        </button>
        <button
          type="button"
          className={styles.close}
          aria-label="Close canvas search"
          onClick={onClose}
        >
          <X size={18} aria-hidden="true" />
        </button>
      </div>
      {handwritingOpen && (
        <div className={styles.handwriting}>
          <Handwriting query={query} onText={onRecognizedText} />
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
