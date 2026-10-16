import { useRef, useState, type PointerEvent } from 'react'
import { ArrowUpRight, Check, Pencil, RotateCcw, X } from 'lucide-react'
import { APP_CATALOG, type LauncherApp } from './launcher-apps'
import styles from './GesturePad.module.css'

interface GesturePadProps {
  onLaunch: (app: LauncherApp) => void
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

function previewBox(points: Point[]) {
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return `${x - 12} ${y - 12} ${Math.max(...xs) - x + 24} ${Math.max(...ys) - y + 24}`
}

export default function GesturePad({ onLaunch }: GesturePadProps) {
  const [shortcuts, setShortcuts] = useState(loadShortcuts)
  const [selectedId, setSelectedId] = useState('browser')
  const [editing, setEditing] = useState(false)
  const [stroke, setStroke] = useState<Point[]>([])
  const [drawing, setDrawing] = useState(false)
  const [saved, setSaved] = useState(false)
  const gesture = useRef<{ pointerId: number; points: Point[] } | null>(null)
  const selectedApp =
    APP_CATALOG.find((app) => app.id === selectedId) ?? APP_CATALOG[0]
  const SelectedIcon = selectedApp.icon
  const hasStroke = stroke.length > 1

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

  function finishStroke(event: PointerEvent<SVGSVGElement>) {
    if (gesture.current?.pointerId !== event.pointerId) return
    gesture.current = null
    setDrawing(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)
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
  }

  return (
    <section className={styles.gesturePad} aria-label="Gesture shortcuts">
      <div className={styles.heading}>
        <div>
          <h2>Gesture shortcuts</h2>
          <p>
            {editing
              ? 'Select an application and record one stroke.'
              : 'Select a shortcut, then draw in the pad.'}
          </p>
        </div>
        <button
          type="button"
          className={styles.editButton}
          aria-label={editing ? 'Cancel shortcut edit' : 'Edit shortcuts'}
          onClick={() => {
            setEditing(!editing)
            clearStroke()
          }}
        >
          {editing ? <X size={14} /> : <Pencil size={13} />}
          {editing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      <div className={styles.pad} data-drawing={drawing}>
        <div className={styles.padMeta} aria-hidden="true">
          <span>Draw here</span>
          <span>{selectedApp.name}</span>
        </div>
        <svg
          className={styles.drawSurface}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          preserveAspectRatio="none"
          role="img"
          aria-label={
            editing
              ? `Draw a shortcut for ${selectedApp.name}`
              : `Draw a preview for ${selectedApp.name}`
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
            finishStroke(event)
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
        {!stroke.length && (
          <div className={styles.padPrompt}>
            <Pencil size={30} strokeWidth={1.3} />
            <strong>{editing ? 'Record a gesture' : 'Draw a gesture'}</strong>
            <span>
              {editing
                ? `One continuous stroke for ${selectedApp.name}.`
                : `${selectedApp.name} selected. Drag to draw.`}
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
                'Gesture preview'
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

      <div className={styles.controls}>
        {editing ? (
          <div className={styles.assignment}>
            <label htmlFor="gesture-app">Open this app</label>
            <select
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
        ) : null}

        {!editing && (
          <div className={styles.shortcuts}>
            <span className={styles.sectionLabel}>Saved shortcuts</span>
            <div className={styles.shortcutList}>
              {shortcuts.map((shortcut) => {
                const app = APP_CATALOG.find(
                  (entry) => entry.id === shortcut.appId,
                )!
                return (
                  <button
                    type="button"
                    key={shortcut.appId}
                    className={styles.shortcut}
                    aria-pressed={selectedId === shortcut.appId}
                    onClick={() => {
                      setSelectedId(shortcut.appId)
                      clearStroke()
                    }}
                  >
                    <svg
                      viewBox={previewBox(shortcut.points)}
                      aria-hidden="true"
                    >
                      <path
                        d={shortcut.points
                          .map(
                            (point, index) =>
                              `${index ? 'L' : 'M'}${point.x} ${point.y}`,
                          )
                          .join(' ')}
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                    {app.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className={styles.footer}>
          <div className={styles.target}>
            <span className={styles.appIcon}>
              <SelectedIcon size={19} strokeWidth={1.7} />
            </span>
            <div>
              <strong>{selectedApp.name}</strong>
              <span>
                {editing
                  ? 'Gesture assignment'
                  : 'Manual launch · recognition preview'}
              </span>
            </div>
          </div>
          {editing ? (
            <button
              type="button"
              className={styles.openButton}
              disabled={!hasStroke || drawing}
              onClick={saveShortcut}
            >
              <Check size={15} /> Save shortcut
            </button>
          ) : (
            <button
              type="button"
              className={styles.openButton}
              onClick={() => onLaunch(selectedApp)}
            >
              Open {selectedApp.name} <ArrowUpRight size={15} />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
