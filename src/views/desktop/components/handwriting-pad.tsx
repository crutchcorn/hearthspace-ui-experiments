import type { PointerEventHandler } from 'react'
import { Check, Eraser, Hourglass, RotateCcw } from '../../../components/icons'
import { HANDWRITING_STROKE_WIDTH } from '../constants/handwriting'
import type { HandwritingPoint } from '../types/handwriting'
import styles from './handwriting-pad.module.css'

interface HandwritingPadProps {
  strokes: HandwritingPoint[][]
  drawing: boolean
  busy: boolean
  error: string
  message: string
  clear: () => void
  readInk: () => Promise<void>
  onPointerDown: PointerEventHandler<SVGSVGElement>
  onPointerMove: PointerEventHandler<SVGSVGElement>
  onPointerUp: PointerEventHandler<SVGSVGElement>
  onPointerCancel: PointerEventHandler<SVGSVGElement>
}

export default function HandwritingPad({
  strokes,
  drawing,
  busy,
  error,
  message,
  clear,
  readInk,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}: HandwritingPadProps) {
  return (
    <div className={styles.handwriting} aria-label="Handwriting search">
      <div className={styles.padRow}>
        <svg
          className={styles.surface}
          role="img"
          aria-label="Write one line to add to search"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onPointerCancel}
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
            onClick={clear}
          >
            <Eraser size={18} aria-hidden="true" />
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
              <Hourglass
                className={styles.spinner}
                size={18}
                aria-hidden="true"
              />
            ) : error ? (
              <RotateCcw size={18} aria-hidden="true" />
            ) : (
              <Check size={18} aria-hidden="true" />
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
