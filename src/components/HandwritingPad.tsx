import { Check, Eraser, LoaderCircle, RotateCcw } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type PointerEvent } from 'react'
import { recognizeHandwriting, type HandwritingStatus } from '../handwriting'
import {
  HANDWRITING_STROKE_WIDTH,
  handwritingImage,
  type HandwritingPoint,
} from '../handwriting-image'
import styles from './HandwritingPad.module.css'

interface HandwritingPadProps {
  query: string
  onText: (text: string) => void
}

export default function HandwritingPad({ query, onText }: HandwritingPadProps) {
  const [strokes, setStrokes] = useState<HandwritingPoint[][]>([])
  const [drawing, setDrawing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<HandwritingStatus | null>(null)
  const [error, setError] = useState('')
  const ink = useRef<HandwritingPoint[][]>([])
  const activeStroke = useRef<{
    pointerId: number
    points: HandwritingPoint[]
  } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const recognition = useRef<AbortController | null>(null)

  useLayoutEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
      timer.current = null
      recognition.current?.abort()
    },
    [query],
  )

  function stopRecognition() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    recognition.current?.abort()
    recognition.current = null
    setBusy(false)
    setStatus(null)
    setError('')
  }

  async function readInk() {
    if (activeStroke.current || !ink.current.length) return
    stopRecognition()
    const controller = new AbortController()
    recognition.current = controller
    setBusy(true)

    try {
      const image = handwritingImage(ink.current)
      if (!image) return
      const text = await recognizeHandwriting(image, {
        signal: controller.signal,
        onStatus: (next) => {
          if (!controller.signal.aborted && recognition.current === controller)
            setStatus(next)
        },
      })
      if (controller.signal.aborted || recognition.current !== controller)
        return
      if (!text) {
        setError('Could not read that. Try writing it again.')
        return
      }

      ink.current = []
      setStrokes([])
      onText(text)
    } catch (reason) {
      if (controller.signal.aborted || recognition.current !== controller)
        return
      if (reason instanceof Error && reason.name === 'AbortError') return
      setError(
        reason instanceof Error
          ? reason.message
          : 'Could not read that. Try again.',
      )
    } finally {
      if (recognition.current === controller) {
        recognition.current = null
        setBusy(false)
        setStatus(null)
      }
    }
  }

  function pointFromEvent(event: PointerEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
      y: Math.max(0, Math.min(rect.height, event.clientY - rect.top)),
    }
  }

  function extendStroke(event: PointerEvent<SVGSVGElement>) {
    const active = activeStroke.current
    if (!active || active.pointerId !== event.pointerId) return
    const point = pointFromEvent(event)
    const previous = active.points.at(-1)!
    if (Math.hypot(point.x - previous.x, point.y - previous.y) < 0.6) return
    if (active.points.length < 4096) active.points.push(point)
    setStrokes([...ink.current])
  }

  function finishStroke(event: PointerEvent<SVGSVGElement>, completed = false) {
    if (activeStroke.current?.pointerId !== event.pointerId) return
    activeStroke.current = null
    setDrawing(false)
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId)

    if (completed) {
      timer.current = setTimeout(() => {
        void readInk()
      }, 800)
    } else {
      ink.current = ink.current.slice(0, -1)
      setStrokes([...ink.current])
    }
  }

  const message =
    error ||
    (busy
      ? status?.phase === 'downloading'
        ? `Downloading handwriting${status.progress === undefined ? '…' : ` · ${Math.round(status.progress)}%`}`
        : 'Reading handwriting…'
      : '')

  return (
    <div className={styles.handwriting} aria-label="Handwriting search">
      <div className={styles.padRow}>
        <svg
          className={styles.surface}
          role="img"
          aria-label="Write one line to add to search"
          onPointerDown={(event) => {
            if (event.button !== 0 || activeStroke.current) return
            event.preventDefault()
            stopRecognition()
            if (ink.current.length >= 64) {
              setError('Clear the pad to write another line.')
              return
            }
            const points = [pointFromEvent(event)]
            activeStroke.current = { pointerId: event.pointerId, points }
            ink.current = [...ink.current, points]
            event.currentTarget.setPointerCapture(event.pointerId)
            setStrokes([...ink.current])
            setDrawing(true)
          }}
          onPointerMove={extendStroke}
          onPointerUp={(event) => {
            extendStroke(event)
            finishStroke(event, true)
          }}
          onPointerCancel={finishStroke}
          onLostPointerCapture={finishStroke}
        >
          {strokes.map((stroke, index) =>
            stroke.length === 1 ? (
              <circle
                key={index}
                cx={stroke[0].x}
                cy={stroke[0].y}
                r={HANDWRITING_STROKE_WIDTH / 2}
                fill="currentColor"
              />
            ) : (
              <polyline
                key={index}
                points={stroke
                  .map((point) => `${point.x},${point.y}`)
                  .join(' ')}
                fill="none"
                stroke="currentColor"
                strokeWidth={HANDWRITING_STROKE_WIDTH}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ),
          )}
        </svg>
        <div className={styles.controls}>
          <button
            type="button"
            aria-label="Clear handwriting"
            title="Clear handwriting"
            disabled={!strokes.length || drawing}
            onClick={() => {
              stopRecognition()
              ink.current = []
              setStrokes([])
            }}
          >
            <Eraser size={18} strokeWidth={1.5} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={
              error ? 'Retry handwriting recognition' : 'Recognize handwriting'
            }
            title={
              error ? 'Retry handwriting recognition' : 'Recognize handwriting'
            }
            disabled={!strokes.length || drawing || busy}
            onClick={() => {
              void readInk()
            }}
          >
            {busy ? (
              <LoaderCircle
                className={styles.spinner}
                size={18}
                strokeWidth={1.5}
                aria-hidden="true"
              />
            ) : error ? (
              <RotateCcw size={18} strokeWidth={1.5} aria-hidden="true" />
            ) : (
              <Check size={18} strokeWidth={1.5} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <div
        className={styles.status}
        data-error={!!error}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </div>
  )
}
