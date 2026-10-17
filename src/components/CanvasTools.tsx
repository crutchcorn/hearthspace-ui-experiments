import {
  Check,
  ChevronUp,
  Hand,
  LassoSelect,
  Map,
  MousePointer2,
} from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { CanvasTool } from '../desktop'
import styles from './CanvasTools.module.css'

interface CanvasToolsProps {
  mode: CanvasTool
  onModeChange: (mode: CanvasTool) => void
  onOpenToolMenu: () => void
  mapOpen: boolean
  onToggleMap: () => void
  onArrange: () => void
  windowCount: number
  selectedCount: number
  showHint: boolean
}

const primaryTools = [
  { mode: 'pan', label: 'Pan canvas', shortcut: 'H', Icon: Hand },
  {
    mode: 'cursor',
    label: 'Select desktop items',
    shortcut: 'V',
    Icon: MousePointer2,
  },
] as const

export default function CanvasTools({
  mode,
  onModeChange,
  onOpenToolMenu,
  mapOpen,
  onToggleMap,
  onArrange,
  windowCount,
  selectedCount,
  showHint,
}: CanvasToolsProps) {
  const arrangeHintId = useId()
  const toolMenuId = useId()
  const pickerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [primaryMode, setPrimaryMode] = useState<'pan' | 'cursor'>('cursor')

  if (mode !== 'lasso' && mode !== primaryMode) setPrimaryMode(mode)
  if (!showHint && menuOpen) setMenuOpen(false)

  const menuVisible = menuOpen && showHint
  const primaryTool = primaryTools.find((tool) => tool.mode === primaryMode)!
  const PrimaryIcon = primaryTool.Icon

  useEffect(() => {
    if (!menuVisible) return
    menuRef.current
      ?.querySelector<HTMLButtonElement>(`[data-mode="${primaryMode}"]`)
      ?.focus({ preventScroll: true })

    function dismissOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !pickerRef.current?.contains(event.target)
      )
        setMenuOpen(false)
    }

    function dismissOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setMenuOpen(false)
      triggerRef.current?.focus({ preventScroll: true })
    }

    document.addEventListener('pointerdown', dismissOutside, true)
    document.addEventListener('keydown', dismissOnEscape, true)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside, true)
      document.removeEventListener('keydown', dismissOnEscape, true)
    }
  }, [menuVisible, primaryMode])

  function openMenu() {
    onOpenToolMenu()
    setMenuOpen(true)
  }

  function selectTool(nextMode: 'pan' | 'cursor') {
    onModeChange(nextMode)
    setMenuOpen(false)
    triggerRef.current?.focus({ preventScroll: true })
  }

  function navigateMenu(event: KeyboardEvent<HTMLDivElement>) {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    event.stopPropagation()
    const shortcutTool = primaryTools.find(
      (tool) => tool.shortcut.toLowerCase() === event.key.toLowerCase(),
    )
    if (shortcutTool) {
      event.preventDefault()
      selectTool(shortcutTool.mode)
      return
    }
    if (event.key === 'Tab') {
      setMenuOpen(false)
      triggerRef.current?.focus({ preventScroll: true })
      return
    }
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const options = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>('button'),
    )
    const index = options.findIndex(
      (option) => option === document.activeElement,
    )
    const nextIndex =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) %
            options.length
    options[nextIndex]?.focus({ preventScroll: true })
  }

  return (
    <div className={styles.container}>
      {showHint && !menuVisible && mode === 'lasso' && (
        <div className={styles.selectionHint} role="status">
          <span>
            {selectedCount > 0
              ? `${selectedCount} ${selectedCount === 1 ? 'window' : 'windows'} selected`
              : 'Drag around windows'}
          </span>
        </div>
      )}
      <div className={styles.dock} role="group" aria-label="Canvas tools">
        <div className={styles.toolGrid}>
          <div
            ref={pickerRef}
            className={styles.picker}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setMenuOpen(false)
            }}
          >
            <button
              ref={triggerRef}
              type="button"
              className={`${styles.tool} ${styles.move}`}
              aria-pressed={mode !== 'lasso'}
              aria-label={`${primaryTool.label}, choose canvas tool`}
              aria-haspopup="menu"
              aria-expanded={menuVisible}
              aria-controls={menuVisible ? toolMenuId : undefined}
              title={`${primaryTool.label} (${primaryTool.shortcut}) · Choose tool`}
              onClick={() => {
                if (menuVisible) setMenuOpen(false)
                else openMenu()
              }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                event.preventDefault()
                openMenu()
              }}
            >
              <PrimaryIcon size={20} strokeWidth={1.5} aria-hidden="true" />
              <ChevronUp
                className={styles.expandIndicator}
                size={9}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
            {menuVisible && (
              <div
                ref={menuRef}
                id={toolMenuId}
                className={styles.toolMenu}
                role="menu"
                aria-label="Canvas interaction tool"
                onKeyDown={navigateMenu}
              >
                {primaryTools.map(
                  ({ mode: optionMode, label, shortcut, Icon }) => (
                    <button
                      key={optionMode}
                      type="button"
                      role="menuitemradio"
                      aria-checked={mode === optionMode}
                      data-mode={optionMode}
                      className={styles.menuOption}
                      tabIndex={-1}
                      onClick={() => selectTool(optionMode)}
                    >
                      <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                      <span>{label}</span>
                      <kbd>{shortcut}</kbd>
                      {mode === optionMode && (
                        <Check
                          size={14}
                          className={styles.check}
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  ),
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            className={styles.tool}
            aria-pressed={mode === 'lasso'}
            aria-label="Select windows"
            title="Select windows (L)"
            onClick={() => onModeChange('lasso')}
          >
            <LassoSelect size={18} aria-hidden="true" />
          </button>
          <span className={styles.divider} aria-hidden="true" />
          <button
            type="button"
            className={styles.tool}
            aria-pressed={mapOpen}
            aria-label="Toggle canvas map"
            title="Toggle canvas map (M)"
            onClick={onToggleMap}
          >
            <Map size={18} aria-hidden="true" />
          </button>
          <div className={styles.organize}>
            <button
              type="button"
              className={styles.tool}
              aria-label="Arrange all windows"
              aria-describedby={arrangeHintId}
              onClick={onArrange}
              disabled={windowCount === 0}
            >
              <svg
                width={20}
                height={20}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                <rect x={2} y={3} width={9} height={18} rx={1.5} />
                <rect x={15} y={3} width={7} height={7} rx={1.5} />
                <rect x={15} y={14} width={7} height={7} rx={1.5} />
              </svg>
            </button>
            <span id={arrangeHintId} className={styles.tooltip} role="tooltip">
              Arrange windows in a grid <kbd>A</kbd>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
