import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Check, Pencil, RotateCcw, Settings, X } from 'lucide-react'
import { APP_CATALOG, type LauncherApp } from './launcher-apps'
import styles from './GesturePad.module.css'

interface GesturePadProps {
  onLaunch: (app: LauncherApp) => void
  onCustomizeGestures: () => void
  initialEditing?: boolean
}

type Point = { x: number; y: number }
type Shortcut = { appId: string; points: Point[] }

const STORAGE_KEY = 'hearthspace-gesture-shortcuts-v1'
const WIDTH = 440
const HEIGHT = 190
const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    appId: 'browser',
    points: [
      { x: 178, y: 150 },
      { x: 178, y: 40 },
      { x: 215, y: 40 },
      { x: 240, y: 48 },
      { x: 246, y: 64 },
      { x: 238, y: 82 },
      { x: 211, y: 94 },
      { x: 178, y: 94 },
      { x: 218, y: 94 },
      { x: 246, y: 104 },
      { x: 254, y: 122 },
      { x: 245, y: 140 },
      { x: 218, y: 150 },
      { x: 178, y: 150 },
    ],
  },
  {
    appId: 'terminal',
    points: [
      { x: 172, y: 58 },
      { x: 254, y: 58 },
      { x: 180, y: 130 },
      { x: 263, y: 130 },
    ],
  },
  {
    appId: 'notes',
    points: [
      { x: 179, y: 143 },
      { x: 179, y: 46 },
      { x: 256, y: 143 },
      { x: 256, y: 46 },
    ],
  },
]

function loadShortcuts(): Shortcut[] {
  try {
    const stored: unknown = JSON.parse(
      localStorage.getItem(STORAGE_KEY) ?? 'null',
    )
    if (!Array.isArray(stored)) return DEFAULT_SHORTCUTS
    const ids = new Set<string>()
    const valid = stored.filter((item): item is Shortcut => {
      if (
        !item ||
        typeof item !== 'object' ||
        !APP_CATALOG.some((app) => app.id === item.appId) ||
        ids.has(item.appId) ||
        !Array.isArray(item.points) ||
        item.points.length < 2 ||
        item.points.length > 2048 ||
        !item.points.every(
          (point: Point) =>
            point &&
            Number.isFinite(point.x) &&
            Number.isFinite(point.y) &&
            point.x >= 0 &&
            point.x <= WIDTH &&
            point.y >= 0 &&
            point.y <= HEIGHT,
        )
      )
        return false
      ids.add(item.appId)
      return true
    })
    return valid.length ? valid : DEFAULT_SHORTCUTS
  } catch {
    return DEFAULT_SHORTCUTS
  }
}

export default function GesturePad({
  onLaunch,
  onCustomizeGestures,
  initialEditing = false,
}: GesturePadProps) {
  const [shortcuts, setShortcuts] = useState(loadShortcuts)
  const [selectedId, setSelectedId] = useState('browser')
  const [editing, setEditing] = useState(initialEditing)
  const [stroke, setStroke] = useState<Point[]>([])
  const [drawing, setDrawing] = useState(false)
  const [saved, setSaved] = useState(false)
  const appSelect = useRef<HTMLSelectElement>(null)
  const settingsButton = useRef<HTMLButtonElement>(null)
  const gesture = useRef<{ pointerId: number; points: Point[] } | null>(null)
  const selectedApp =
    APP_CATALOG.find((app) => app.id === selectedId) ?? APP_CATALOG[0]
  const hasStroke = stroke.length > 1

  useEffect(() => {
    if (initialEditing) appSelect.current?.focus({ preventScroll: true })
  }, [initialEditing])

  function pointFromEvent(event: PointerEvent<SVGSVGElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(
        0,
        Math.min(WIDTH, ((event.clientX - rect.left) / rect.width) * WIDTH),
      ),
      y: Math.max(
        0,
        Math.min(HEIGHT, ((event.clientY - rect.top) / rect.height) * HEIGHT),
      ),
    }
  }

  function extendStroke(event: PointerEvent<SVGSVGElement>) {
    const current = gesture.current
    if (!current || current.pointerId !== event.pointerId) return
    const point = pointFromEvent(event)
    const previous = current.points.at(-1)!
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < 1) return
    if (current.points.length < 2048) current.points.push(point)
    setStroke([...current.points])
  }

  function finishStroke(event: PointerEvent<SVGSVGElement>, completed = false) {
    const current = gesture.current
    if (current?.pointerId !== event.pointerId) return
    gesture.current = null
    setDrawing(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
    if (completed && !editing && current.points.length > 1) {
      // Until gesture matching exists, every completed stroke opens Browser.
      const app = APP_CATALOG.find((item) => item.id === 'browser')
      if (app) onLaunch(app)
    }
  }

  function clearStroke() {
    setStroke([])
    setSaved(false)
  }

  function saveShortcut() {
    if (!hasStroke) return
    const next = [
      { appId: selectedId, points: stroke },
      ...shortcuts.filter((shortcut) => shortcut.appId !== selectedId),
    ]
    setShortcuts(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // The shortcut remains available in this open launcher without storage.
    }
    setEditing(false)
    setSaved(true)
    settingsButton.current?.focus({ preventScroll: true })
  }

  return (
    <section className={styles.gesturePad} aria-label="Gesture shortcuts">
      <div className={styles.pad} data-drawing={drawing}>
        <div className={styles.padMeta} aria-hidden="true">
          <span>Draw here</span>
        </div>
        <svg
          className={styles.drawSurface}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={
            editing
              ? `Draw a shortcut for ${selectedApp.name}`
              : 'Draw a gesture to launch an app'
          }
          onPointerDown={(event) => {
            if (event.button !== 0 || gesture.current) return
            event.preventDefault()
            const point = pointFromEvent(event)
            gesture.current = { pointerId: event.pointerId, points: [point] }
            event.currentTarget.setPointerCapture(event.pointerId)
            setStroke([point])
            setDrawing(true)
            setSaved(false)
          }}
          onPointerMove={extendStroke}
          onPointerUp={(event) => {
            extendStroke(event)
            finishStroke(event, true)
          }}
          onPointerCancel={finishStroke}
          onLostPointerCapture={finishStroke}
        >
          {stroke.length > 0 && (
            <polyline
              className={styles.stroke}
              points={stroke.map((point) => `${point.x},${point.y}`).join(' ')}
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>
        <button
          ref={settingsButton}
          type="button"
          className={styles.settingsButton}
          aria-label="Customize gestures"
          title="Customize gestures"
          onClick={onCustomizeGestures}
        >
          <Settings size={18} aria-hidden="true" />
        </button>
        {!stroke.length && (
          <div className={styles.padPrompt}>
            <Pencil size={30} strokeWidth={1.3} />
            <strong>{editing ? 'Record a gesture' : 'Draw a gesture'}</strong>
            <span>
              {editing
                ? `One continuous stroke for ${selectedApp.name}.`
                : 'Release to open.'}
            </span>
          </div>
        )}
        {!!stroke.length && (
          <>
            <span className={styles.padLabel} aria-live="polite">
              {saved ? (
                <>
                  <Check size={12} /> Shortcut saved
                </>
              ) : editing ? (
                'Recorded stroke'
              ) : (
                'Draw a gesture'
              )}
            </span>
            <button
              type="button"
              className={styles.retryButton}
              onClick={clearStroke}
              aria-label="Clear drawing and retry"
            >
              <RotateCcw size={13} /> Retry
            </button>
          </>
        )}
      </div>

      {editing && (
        <div className={styles.footer}>
          <div className={styles.assignment}>
            <label htmlFor="gesture-app">Open this app</label>
            <select
              ref={appSelect}
              id="gesture-app"
              value={selectedId}
              onChange={(event) => {
                setSelectedId(event.target.value)
                clearStroke()
              }}
            >
              {APP_CATALOG.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelButton}
              aria-label="Cancel shortcut edit"
              onClick={() => {
                setEditing(false)
                clearStroke()
                settingsButton.current?.focus({ preventScroll: true })
              }}
            >
              <X size={15} aria-hidden="true" /> Cancel
            </button>
            <button
              type="button"
              className={styles.saveButton}
              disabled={!hasStroke || drawing}
              onClick={saveShortcut}
            >
              <Check size={15} /> Save shortcut
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
