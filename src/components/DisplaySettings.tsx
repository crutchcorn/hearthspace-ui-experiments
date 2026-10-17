import { Laptop, Monitor } from 'lucide-react'
import { useId, useRef, useState, type PointerEvent } from 'react'
import {
  DISPLAY_LAYOUT_HEIGHT,
  DISPLAY_LAYOUT_WIDTH,
  centerDisplayLayout,
  clampDisplayPosition,
  snapDisplayToNeighbor,
  type DisplayRect,
} from '../display-layout'
import styles from './DisplaySettings.module.css'

export interface DisplayPreferences {
  resolution: string
  scale: string
  refreshRate: string
}

interface DisplaySettingsProps {
  layout: [DisplayRect, DisplayRect]
  onLayoutChange: (layout: [DisplayRect, DisplayRect]) => void
  preferences: [DisplayPreferences, DisplayPreferences]
  onPreferencesChange: (
    preferences: [DisplayPreferences, DisplayPreferences],
  ) => void
}

const DISPLAYS = [
  {
    name: 'Built-in display',
    connection: 'eDP-1',
    icon: Laptop,
    resolutions: ['1920 × 1200', '1680 × 1050', '1440 × 900'],
    refreshRates: ['60 Hz', '90 Hz'],
  },
  {
    name: 'External display',
    connection: 'DP-1',
    icon: Monitor,
    resolutions: ['2560 × 1440', '1920 × 1080', '1600 × 900'],
    refreshRates: ['60 Hz', '120 Hz', '144 Hz'],
  },
] as const

type DisplayIndex = 0 | 1
interface DisplayDrag {
  index: DisplayIndex
  pointerId: number
  startX: number
  startY: number
  scaleX: number
  scaleY: number
  original: [DisplayRect, DisplayRect]
  latest: DisplayRect
  moved: boolean
}

export default function DisplaySettings({
  layout,
  onLayoutChange,
  preferences,
  onPreferencesChange,
}: DisplaySettingsProps) {
  const [selected, setSelected] = useState<DisplayIndex>(0)
  const [dragging, setDragging] = useState<DisplayIndex | null>(null)
  const board = useRef<HTMLDivElement>(null)
  const drag = useRef<DisplayDrag | null>(null)
  const settingsId = useId()
  const selectedDisplay = DISPLAYS[selected]
  const SelectedIcon = selectedDisplay.icon

  function updatePosition(
    index: DisplayIndex,
    rectangle: DisplayRect,
    base = layout,
    settle = true,
  ) {
    const next: [DisplayRect, DisplayRect] = [...base]
    next[index] = rectangle
    onLayoutChange(settle ? centerDisplayLayout(next) : next)
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>, cancel = false) {
    const current = drag.current
    if (!current || current.pointerId !== event.pointerId) return
    event.stopPropagation()
    drag.current = null
    setDragging(null)
    if (cancel) onLayoutChange(current.original)
    else if (current.moved) {
      updatePosition(
        current.index,
        snapDisplayToNeighbor(
          current.latest,
          current.original[current.index === 0 ? 1 : 0],
        ),
        current.original,
      )
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
  }

  function changePreference(key: keyof DisplayPreferences, value: string) {
    const next: [DisplayPreferences, DisplayPreferences] = [...preferences]
    next[selected] = { ...next[selected], [key]: value }
    onPreferencesChange(next)
  }

  return (
    <section className={styles.displays} aria-label="Display configuration">
      <div ref={board} className={styles.layout} aria-label="Monitor layout">
        {layout.map((rectangle, index) => {
          const displayIndex = index as DisplayIndex
          return (
            <button
              key={index}
              type="button"
              className={styles.monitor}
              data-monitor={index + 1}
              data-dragging={dragging === index}
              aria-label={`Display ${index + 1}: ${DISPLAYS[index].name}`}
              aria-pressed={selected === index}
              aria-describedby={`${settingsId}-instructions`}
              style={{
                left: `${(rectangle.x / DISPLAY_LAYOUT_WIDTH) * 100}%`,
                top: `${(rectangle.y / DISPLAY_LAYOUT_HEIGHT) * 100}%`,
                width: `${(rectangle.width / DISPLAY_LAYOUT_WIDTH) * 100}%`,
                height: `${(rectangle.height / DISPLAY_LAYOUT_HEIGHT) * 100}%`,
              }}
              onClick={() => setSelected(displayIndex)}
              onPointerDown={(event) => {
                if (event.button !== 0 || !event.isPrimary || drag.current)
                  return
                const bounds = board.current?.getBoundingClientRect()
                if (!bounds?.width || !bounds.height) return
                event.preventDefault()
                event.stopPropagation()
                event.currentTarget.focus({ preventScroll: true })
                event.currentTarget.setPointerCapture(event.pointerId)
                setSelected(displayIndex)
                drag.current = {
                  index: displayIndex,
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startY: event.clientY,
                  scaleX: DISPLAY_LAYOUT_WIDTH / bounds.width,
                  scaleY: DISPLAY_LAYOUT_HEIGHT / bounds.height,
                  original: layout,
                  latest: rectangle,
                  moved: false,
                }
              }}
              onPointerMove={(event) => {
                const current = drag.current
                if (!current || current.pointerId !== event.pointerId) return
                event.stopPropagation()
                const dx = event.clientX - current.startX
                const dy = event.clientY - current.startY
                if (!current.moved && Math.hypot(dx, dy) < 4) return
                current.moved = true
                setDragging(current.index)
                current.latest = clampDisplayPosition({
                  ...current.original[current.index],
                  x: current.original[current.index].x + dx * current.scaleX,
                  y: current.original[current.index].y + dy * current.scaleY,
                })
                updatePosition(
                  current.index,
                  current.latest,
                  current.original,
                  false,
                )
              }}
              onPointerUp={(event) => finishDrag(event)}
              onPointerCancel={(event) => finishDrag(event, true)}
              onLostPointerCapture={(event) => finishDrag(event, true)}
              onKeyDown={(event) => {
                if (!event.key.startsWith('Arrow') || drag.current) return
                event.preventDefault()
                event.stopPropagation()
                const neighbor = layout[displayIndex === 0 ? 1 : 0]
                const position = { ...rectangle }
                if (event.key === 'ArrowLeft') {
                  position.x = neighbor.x - rectangle.width
                  position.y = neighbor.y
                } else if (event.key === 'ArrowRight') {
                  position.x = neighbor.x + neighbor.width
                  position.y = neighbor.y
                } else if (event.key === 'ArrowUp') {
                  position.x = neighbor.x
                  position.y = neighbor.y - rectangle.height
                } else if (event.key === 'ArrowDown') {
                  position.x = neighbor.x
                  position.y = neighbor.y + neighbor.height
                }
                updatePosition(
                  displayIndex,
                  snapDisplayToNeighbor(position, neighbor),
                )
                setSelected(displayIndex)
              }}
            >
              <span className={styles.monitorNumber}>{index + 1}</span>
            </button>
          )
        })}
      </div>
      <p className={styles.keyboardHint} id={`${settingsId}-instructions`}>
        Use arrow keys to place the focused display on another side.
      </p>
      <div className={styles.selectedDisplay}>
        <span className={styles.displayIdentity} aria-hidden="true">
          <SelectedIcon size={21} strokeWidth={1.5} />
        </span>
        <div>
          <h3>{selectedDisplay.name}</h3>
          <p>
            Display {selected + 1} · {selectedDisplay.connection}
          </p>
        </div>
      </div>
      <div className={styles.controls}>
        <label className={styles.setting}>
          <span>Resolution</span>
          <select
            value={preferences[selected].resolution}
            onChange={(event) =>
              changePreference('resolution', event.target.value)
            }
          >
            {selectedDisplay.resolutions.map((resolution) => (
              <option key={resolution}>{resolution}</option>
            ))}
          </select>
        </label>
        <label className={styles.setting}>
          <span>Scale</span>
          <select
            value={preferences[selected].scale}
            onChange={(event) => changePreference('scale', event.target.value)}
          >
            {['100%', '125%', '150%', '175%', '200%'].map((scale) => (
              <option key={scale}>{scale}</option>
            ))}
          </select>
        </label>
        <label className={styles.setting}>
          <span>Refresh rate</span>
          <select
            value={preferences[selected].refreshRate}
            onChange={(event) =>
              changePreference('refreshRate', event.target.value)
            }
          >
            {selectedDisplay.refreshRates.map((rate) => (
              <option key={rate}>{rate}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  )
}
