import { useRef, useState, type PointerEvent } from 'react'
import { Check, Pencil, RotateCcw, Settings, X } from '../icons'
import { APP_CATALOG, type LauncherApp } from './launcher-apps'
import {
  GESTURE_WIDTH,
  GESTURE_HEIGHT,
  type GesturePoint,
  type GestureShortcut,
} from '../gestures'
import AppPicker from './AppPicker'
import { recognizeGesture } from '../gesture-recognition'
import styles from './GesturePad.module.css'

type GesturePadProps = {
  onSaveShortcut: (shortcut: GestureShortcut) => void
} & (
  | {
      mode: 'launcher'
      onLaunch: (app: LauncherApp) => void
      onCustomizeGestures: () => void
      initialEditing?: boolean
      shortcuts: GestureShortcut[]
    }
  | {
      mode: 'editor'
      initialShortcut?: GestureShortcut
    }
)

export default function GesturePad(props: GesturePadProps) {
  const initialShortcut =
    props.mode === 'editor' ? props.initialShortcut : undefined
  const initialEditing = props.mode === 'editor' || !!props.initialEditing
  const [selectedId, setSelectedId] = useState(
    initialShortcut?.appId ?? 'browser',
  )
  const [launcherEditing, setLauncherEditing] = useState(initialEditing)
  const editing = props.mode === 'editor' || launcherEditing
  const [stroke, setStroke] = useState<GesturePoint[]>(
    initialShortcut?.points ?? [],
  )
  const [drawing, setDrawing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [noMatch, setNoMatch] = useState(false)
  const settingsButton = useRef<HTMLButtonElement>(null)
  const gesture = useRef<{ pointerId: number; points: GesturePoint[] } | null>(
    null,
  )
  const selectedApp =
    APP_CATALOG.find((app) => app.id === selectedId) ?? APP_CATALOG[0]
  const hasStroke = stroke.length > 1

  function pointFromEvent(event: PointerEvent<SVGSVGElement>): GesturePoint {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(
        0,
        Math.min(
          GESTURE_WIDTH,
          ((event.clientX - rect.left) / rect.width) * GESTURE_WIDTH,
        ),
      ),
      y: Math.max(
        0,
        Math.min(
          GESTURE_HEIGHT,
          ((event.clientY - rect.top) / rect.height) * GESTURE_HEIGHT,
        ),
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
    if (
      completed &&
      props.mode === 'launcher' &&
      !editing &&
      current.points.length > 1
    ) {
      const match = recognizeGesture([current.points], props.shortcuts)
      const app = APP_CATALOG.find((item) => item.id === match?.appId)
      if (app) props.onLaunch(app)
      else setNoMatch(true)
    }
  }

  function clearStroke() {
    setStroke([])
    setSaved(false)
    setNoMatch(false)
  }

  function saveShortcut() {
    if (!hasStroke) return
    props.onSaveShortcut({ appId: selectedId, points: stroke })
    if (props.mode === 'launcher') {
      setLauncherEditing(false)
      setSaved(true)
      settingsButton.current?.focus({ preventScroll: true })
    }
  }

  return (
    <section className={styles.gesturePad} aria-label="Gesture shortcuts">
      {editing && (
        <AppPicker selectedId={selectedId} onChange={setSelectedId} />
      )}
      <div className={styles.pad} data-drawing={drawing}>
        <div className={styles.padMeta} aria-hidden="true">
          <span>Draw here</span>
        </div>
        <svg
          className={styles.drawSurface}
          viewBox={`0 0 ${GESTURE_WIDTH} ${GESTURE_HEIGHT}`}
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
            setNoMatch(false)
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
        {props.mode === 'launcher' && (
          <button
            ref={settingsButton}
            type="button"
            className={styles.settingsButton}
            aria-label="Customize gestures"
            title="Customize gestures"
            onClick={props.onCustomizeGestures}
          >
            <Settings size={18} aria-hidden="true" />
          </button>
        )}
        {!stroke.length && (
          <div className={styles.padPrompt}>
            <Pencil size={30} />
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
            {!editing && (saved || noMatch) && (
              <span className={styles.padLabel} aria-live="polite">
                {saved ? (
                  <>
                    <Check size={12} /> Shortcut saved
                  </>
                ) : (
                  'No match found'
                )}
              </span>
            )}
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
          <div className={styles.actions}>
            {props.mode === 'launcher' && (
              <button
                type="button"
                className={styles.cancelButton}
                aria-label="Cancel shortcut edit"
                onClick={() => {
                  setLauncherEditing(false)
                  clearStroke()
                  settingsButton.current?.focus({ preventScroll: true })
                }}
              >
                <X size={15} aria-hidden="true" /> Cancel
              </button>
            )}
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
