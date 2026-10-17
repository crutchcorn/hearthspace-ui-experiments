import {
  Check,
  ChevronUp,
  Hand,
  Lasso,
  Map,
  MousePointer2,
  Search,
  SquareDashedMousePointer,
} from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import type { CanvasTool, WindowSelectionShape } from '../desktop'
import styles from './CanvasTools.module.css'
import shellStyles from './ShellControls.module.css'

interface CanvasToolsProps {
  mode: CanvasTool
  onModeChange: (mode: CanvasTool) => void
  selectionShape: WindowSelectionShape
  onSelectionShapeChange: (shape: WindowSelectionShape) => void
  onOpenToolMenu: () => void
  mapOpen: boolean
  onToggleMap: () => void
  onArrange: () => void
  windowCount: number
  menusAllowed: boolean
}

const primaryTools = [
  {
    mode: 'cursor',
    label: 'Select desktop items',
    shortcut: 'V',
    Icon: MousePointer2,
  },
  { mode: 'pan', label: 'Pan canvas', shortcut: 'H', Icon: Hand },
  { mode: 'search', label: 'Search canvas', shortcut: '/', Icon: Search },
] as const

const selectionTools = [
  {
    shape: 'rectangle',
    label: 'Rectangle select',
    shortcut: 'R',
    Icon: SquareDashedMousePointer,
  },
  { shape: 'freeform', label: 'Freeform lasso', shortcut: 'L', Icon: Lasso },
] as const

type ToolMenu = 'primary' | 'selection' | 'mobile'
type ToolHint = 'primary' | 'selection' | 'map' | 'arrange'
type PrimaryTool = (typeof primaryTools)[number]['mode']

function focusMenuOption(
  menu: HTMLDivElement | null,
  option: HTMLButtonElement | null | undefined,
) {
  if (!menu || !option) return
  option.focus({ preventScroll: true })
  const menuBounds = menu.getBoundingClientRect()
  const optionBounds = option.getBoundingClientRect()
  const visibleTop = menuBounds.top + menu.clientTop
  const visibleBottom = visibleTop + menu.clientHeight
  if (optionBounds.top < visibleTop)
    menu.scrollTop += optionBounds.top - visibleTop
  else if (optionBounds.bottom > visibleBottom)
    menu.scrollTop += optionBounds.bottom - visibleBottom
}

function ArrangeIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
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
  )
}

export default function CanvasTools({
  mode,
  onModeChange,
  selectionShape,
  onSelectionShapeChange,
  onOpenToolMenu,
  mapOpen,
  onToggleMap,
  onArrange,
  windowCount,
  menusAllowed,
}: CanvasToolsProps) {
  const hintId = useId()
  const toolMenuId = useId()
  const selectionMenuId = useId()
  const mobileMenuId = useId()
  const containerRef = useRef<HTMLDivElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const selectionPickerRef = useRef<HTMLDivElement>(null)
  const selectionTriggerRef = useRef<HTMLButtonElement>(null)
  const selectionMenuRef = useRef<HTMLDivElement>(null)
  const mobilePickerRef = useRef<HTMLDivElement>(null)
  const mobileTriggerRef = useRef<HTMLButtonElement>(null)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const [openToolMenu, setOpenToolMenu] = useState<ToolMenu | null>(null)
  const [primaryMode, setPrimaryMode] = useState<PrimaryTool>('cursor')
  const [visibleHint, setVisibleHint] = useState<ToolHint | null>(null)
  const hintTimeout = useRef<number | undefined>(undefined)

  if (mode !== 'select' && mode !== primaryMode) setPrimaryMode(mode)
  if (!menusAllowed && openToolMenu) setOpenToolMenu(null)

  const visibleMenu = menusAllowed ? openToolMenu : null
  const primaryTool = primaryTools.find((tool) => tool.mode === primaryMode)!
  const PrimaryIcon = primaryTool.Icon
  const selectionTool = selectionTools.find(
    (tool) => tool.shape === selectionShape,
  )!
  const SelectionIcon = selectionTool.Icon
  const currentTool = mode === 'select' ? selectionTool : primaryTool
  const CurrentIcon = currentTool.Icon
  const hints = {
    primary: { label: primaryTool.label, shortcut: primaryTool.shortcut },
    selection: { label: selectionTool.label, shortcut: selectionTool.shortcut },
    map: { label: 'Toggle canvas map', shortcut: 'M' },
    arrange: { label: 'Arrange windows in a grid', shortcut: 'A' },
  }
  const hint = !visibleMenu && visibleHint ? hints[visibleHint] : null

  useEffect(() => () => window.clearTimeout(hintTimeout.current), [])

  useEffect(() => {
    const media = window.matchMedia('(width <= 760px)')
    function closeOnLayoutChange(event: MediaQueryListEvent) {
      setOpenToolMenu(null)
      window.clearTimeout(hintTimeout.current)
      setVisibleHint(null)
      if (!containerRef.current?.contains(document.activeElement)) return
      const nextTrigger = event.matches
        ? mobileTriggerRef
        : mode === 'select'
          ? selectionTriggerRef
          : triggerRef
      nextTrigger.current?.focus({ preventScroll: true })
    }
    media.addEventListener('change', closeOnLayoutChange)
    return () => media.removeEventListener('change', closeOnLayoutChange)
  }, [mode])

  useEffect(() => {
    if (!visibleMenu) return
    const activePickerRef =
      visibleMenu === 'mobile'
        ? mobilePickerRef
        : visibleMenu === 'primary'
          ? pickerRef
          : selectionPickerRef
    const activeTriggerRef =
      visibleMenu === 'mobile'
        ? mobileTriggerRef
        : visibleMenu === 'primary'
          ? triggerRef
          : selectionTriggerRef
    const activeMenuRef =
      visibleMenu === 'mobile'
        ? mobileMenuRef
        : visibleMenu === 'primary'
          ? menuRef
          : selectionMenuRef
    const selectedValue =
      visibleMenu === 'primary' ||
      (visibleMenu === 'mobile' && mode !== 'select')
        ? primaryMode
        : selectionShape
    focusMenuOption(
      activeMenuRef.current,
      activeMenuRef.current?.querySelector<HTMLButtonElement>(
        `[data-value="${selectedValue}"]`,
      ),
    )

    function dismissOutside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !activePickerRef.current?.contains(event.target)
      )
        setOpenToolMenu(null)
    }

    function dismissOnEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return
      event.preventDefault()
      event.stopPropagation()
      setOpenToolMenu(null)
      activeTriggerRef.current?.focus({ preventScroll: true })
    }

    document.addEventListener('pointerdown', dismissOutside, true)
    document.addEventListener('keydown', dismissOnEscape, true)
    return () => {
      document.removeEventListener('pointerdown', dismissOutside, true)
      document.removeEventListener('keydown', dismissOnEscape, true)
    }
  }, [visibleMenu, mode, primaryMode, selectionShape])

  function openMenu(menu: ToolMenu) {
    hideHint()
    onOpenToolMenu()
    setOpenToolMenu(menu)
  }

  function selectTool(nextMode: PrimaryTool) {
    hideHint()
    onModeChange(nextMode)
    setOpenToolMenu(null)
    const activeTriggerRef =
      visibleMenu === 'mobile' ? mobileTriggerRef : triggerRef
    activeTriggerRef.current?.focus({ preventScroll: true })
  }

  function selectShape(shape: WindowSelectionShape) {
    hideHint()
    onSelectionShapeChange(shape)
    setOpenToolMenu(null)
    const activeTriggerRef =
      visibleMenu === 'mobile' ? mobileTriggerRef : selectionTriggerRef
    activeTriggerRef.current?.focus({ preventScroll: true })
  }

  function selectMobileAction(action: 'map' | 'arrange') {
    hideHint()
    setOpenToolMenu(null)
    if (action === 'map') onToggleMap()
    else onArrange()
    mobileTriggerRef.current?.focus({ preventScroll: true })
  }

  function hideHint() {
    window.clearTimeout(hintTimeout.current)
    setVisibleHint(null)
  }

  function showHint(nextHint: ToolHint) {
    if (visibleMenu) return
    window.clearTimeout(hintTimeout.current)
    setVisibleHint(nextHint)
    hintTimeout.current = window.setTimeout(() => setVisibleHint(null), 2500)
  }

  function hintProps(toolHint: ToolHint) {
    return {
      'aria-describedby': hint && visibleHint === toolHint ? hintId : undefined,
      onPointerEnter: () => showHint(toolHint),
      onPointerLeave: hideHint,
      onFocus: () => showHint(toolHint),
      onBlur: hideHint,
    }
  }

  function navigateMenu(event: KeyboardEvent<HTMLDivElement>, menu: ToolMenu) {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    event.stopPropagation()
    const shortcut = event.key.toLowerCase()
    if (menu === 'primary' || menu === 'mobile') {
      const tool = primaryTools.find(
        (option) => option.shortcut.toLowerCase() === shortcut,
      )
      if (tool) {
        event.preventDefault()
        selectTool(tool.mode)
        return
      }
    }
    if (menu === 'selection' || menu === 'mobile') {
      const tool = selectionTools.find(
        (option) => option.shortcut.toLowerCase() === shortcut,
      )
      if (tool) {
        event.preventDefault()
        selectShape(tool.shape)
        return
      }
    }
    if (
      menu === 'mobile' &&
      (shortcut === 'm' || (shortcut === 'a' && windowCount))
    ) {
      event.preventDefault()
      selectMobileAction(shortcut === 'm' ? 'map' : 'arrange')
      return
    }
    if (event.key === 'Tab') {
      setOpenToolMenu(null)
      const activeTriggerRef =
        menu === 'mobile'
          ? mobileTriggerRef
          : menu === 'primary'
            ? triggerRef
            : selectionTriggerRef
      activeTriggerRef.current?.focus({ preventScroll: true })
      return
    }
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const options = Array.from(
      event.currentTarget.querySelectorAll<HTMLButtonElement>(
        'button:not(:disabled)',
      ),
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
    focusMenuOption(event.currentTarget, options[nextIndex])
  }

  return (
    <div ref={containerRef} className={styles.container}>
      <div
        ref={mobilePickerRef}
        className={styles.mobileDock}
        role="group"
        aria-label="Canvas tools"
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget))
            setOpenToolMenu(null)
        }}
      >
        <button
          ref={mobileTriggerRef}
          type="button"
          className={`${styles.tool} ${styles.expandable} ${shellStyles.control}`}
          aria-label={`${currentTool.label}, choose canvas tool`}
          aria-haspopup="menu"
          aria-expanded={visibleMenu === 'mobile'}
          aria-controls={visibleMenu === 'mobile' ? mobileMenuId : undefined}
          onClick={() => {
            if (visibleMenu === 'mobile') setOpenToolMenu(null)
            else openMenu('mobile')
          }}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
            event.preventDefault()
            openMenu('mobile')
          }}
        >
          <CurrentIcon size={20} strokeWidth={1.5} aria-hidden="true" />
          <ChevronUp
            className={styles.expandIndicator}
            size={9}
            strokeWidth={2}
            aria-hidden="true"
          />
        </button>
        {visibleMenu === 'mobile' && (
          <div
            ref={mobileMenuRef}
            id={mobileMenuId}
            className={`${styles.toolMenu} ${styles.mobileMenu}`}
            role="menu"
            aria-label="Canvas tools"
            onKeyDown={(event) => navigateMenu(event, 'mobile')}
          >
            {primaryTools.map(({ mode: optionMode, label, shortcut, Icon }) => (
              <button
                key={optionMode}
                type="button"
                role="menuitemradio"
                aria-checked={mode === optionMode}
                data-value={optionMode}
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
            ))}
            {selectionTools.map(({ shape, label, shortcut, Icon }) => (
              <button
                key={shape}
                type="button"
                role="menuitemradio"
                aria-checked={mode === 'select' && selectionShape === shape}
                data-value={shape}
                className={styles.menuOption}
                tabIndex={-1}
                onClick={() => selectShape(shape)}
              >
                <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                <span>{label}</span>
                <kbd>{shortcut}</kbd>
                {mode === 'select' && selectionShape === shape && (
                  <Check
                    size={14}
                    className={styles.check}
                    aria-hidden="true"
                  />
                )}
              </button>
            ))}
            <button
              type="button"
              role="menuitemcheckbox"
              aria-checked={mapOpen}
              className={styles.menuOption}
              tabIndex={-1}
              onClick={() => selectMobileAction('map')}
            >
              <Map size={18} aria-hidden="true" />
              <span>Overview</span>
              <kbd>M</kbd>
              {mapOpen && (
                <Check size={14} className={styles.check} aria-hidden="true" />
              )}
            </button>
            <button
              type="button"
              role="menuitem"
              className={styles.menuOption}
              disabled={windowCount === 0}
              tabIndex={-1}
              onClick={() => selectMobileAction('arrange')}
            >
              <ArrangeIcon size={18} />
              <span>Arrange windows</span>
              <kbd>A</kbd>
            </button>
          </div>
        )}
      </div>
      <div
        className={`${styles.dock} ${shellStyles.surface}`}
        role="group"
        aria-label="Canvas tools"
      >
        <div className={styles.toolGrid}>
          <div
            ref={pickerRef}
            className={styles.picker}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setOpenToolMenu(null)
            }}
          >
            <button
              ref={triggerRef}
              type="button"
              className={`${styles.tool} ${styles.expandable} ${shellStyles.control}`}
              aria-pressed={mode !== 'select'}
              aria-label={`${primaryTool.label}, choose canvas tool`}
              aria-haspopup="menu"
              aria-expanded={visibleMenu === 'primary'}
              aria-controls={visibleMenu === 'primary' ? toolMenuId : undefined}
              {...hintProps('primary')}
              onClick={() => {
                hideHint()
                if (mode === 'select') {
                  selectTool(primaryMode)
                  return
                }
                if (visibleMenu === 'primary') setOpenToolMenu(null)
                else openMenu('primary')
              }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                event.preventDefault()
                openMenu('primary')
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
            {visibleMenu === 'primary' && (
              <div
                ref={menuRef}
                id={toolMenuId}
                className={styles.toolMenu}
                role="menu"
                aria-label="Canvas interaction tool"
                onKeyDown={(event) => navigateMenu(event, 'primary')}
              >
                {primaryTools.map(
                  ({ mode: optionMode, label, shortcut, Icon }) => (
                    <button
                      key={optionMode}
                      type="button"
                      role="menuitemradio"
                      aria-checked={mode === optionMode}
                      data-value={optionMode}
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
          <div
            ref={selectionPickerRef}
            className={styles.picker}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget))
                setOpenToolMenu(null)
            }}
          >
            <button
              ref={selectionTriggerRef}
              type="button"
              className={`${styles.tool} ${styles.expandable} ${shellStyles.control}`}
              aria-pressed={mode === 'select'}
              aria-label={`${selectionTool.label}, choose window selection tool`}
              aria-haspopup="menu"
              aria-expanded={visibleMenu === 'selection'}
              aria-controls={
                visibleMenu === 'selection' ? selectionMenuId : undefined
              }
              {...hintProps('selection')}
              onClick={() => {
                hideHint()
                if (mode !== 'select') {
                  selectShape(selectionShape)
                  return
                }
                if (visibleMenu === 'selection') setOpenToolMenu(null)
                else openMenu('selection')
              }}
              onKeyDown={(event) => {
                if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
                event.preventDefault()
                openMenu('selection')
              }}
            >
              <SelectionIcon size={20} strokeWidth={1.5} aria-hidden="true" />
              <ChevronUp
                className={styles.expandIndicator}
                size={9}
                strokeWidth={2}
                aria-hidden="true"
              />
            </button>
            {visibleMenu === 'selection' && (
              <div
                ref={selectionMenuRef}
                id={selectionMenuId}
                className={styles.toolMenu}
                role="menu"
                aria-label="Window selection tool"
                onKeyDown={(event) => navigateMenu(event, 'selection')}
              >
                {selectionTools.map(({ shape, label, shortcut, Icon }) => (
                  <button
                    key={shape}
                    type="button"
                    role="menuitemradio"
                    aria-checked={mode === 'select' && selectionShape === shape}
                    data-value={shape}
                    className={styles.menuOption}
                    tabIndex={-1}
                    onClick={() => selectShape(shape)}
                  >
                    <Icon size={18} strokeWidth={1.5} aria-hidden="true" />
                    <span>{label}</span>
                    <kbd>{shortcut}</kbd>
                    {mode === 'select' && selectionShape === shape && (
                      <Check
                        size={14}
                        className={styles.check}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <span className={styles.divider} aria-hidden="true" />
          <button
            type="button"
            className={`${styles.tool} ${shellStyles.control}`}
            aria-pressed={mapOpen}
            aria-label="Toggle canvas map"
            {...hintProps('map')}
            onClick={() => {
              hideHint()
              onToggleMap()
            }}
          >
            <Map size={18} aria-hidden="true" />
          </button>
          <div>
            <button
              type="button"
              className={`${styles.tool} ${shellStyles.control}`}
              aria-label="Arrange all windows"
              {...hintProps('arrange')}
              onClick={() => {
                hideHint()
                onArrange()
              }}
              disabled={windowCount === 0}
            >
              <ArrangeIcon />
            </button>
          </div>
        </div>
      </div>
      {hint && (
        <span id={hintId} className={styles.tooltip} role="tooltip">
          {hint.label} <kbd>{hint.shortcut}</kbd>
        </span>
      )}
    </div>
  )
}
