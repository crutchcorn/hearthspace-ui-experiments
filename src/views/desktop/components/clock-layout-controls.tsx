import { useId } from 'react'
import {
  CLOCK_DATE_FORMATS,
  formatClock,
  type ClockDateFormat,
} from '../utils/clock-format'
import styles from './clock-layout-controls.module.css'

interface ClockLayoutControlsProps {
  dateFormat: ClockDateFormat
  onDateFormatChange: (format: ClockDateFormat) => void
  now: Date
}

export default function ClockLayoutControls({
  dateFormat,
  onDateFormatChange,
  now,
}: ClockLayoutControlsProps) {
  const name = useId()

  return (
    <fieldset className={styles.formats}>
      <legend>Date format</legend>
      {CLOCK_DATE_FORMATS.map(({ id, label }) => (
        <label key={id} className={styles.choice}>
          <input
            type="radio"
            name={name}
            value={id}
            checked={dateFormat === id}
            onChange={() => onDateFormatChange(id)}
          />
          <span className={styles.copy}>
            <span>{label}</span>
            <span className={styles.preview}>{formatClock(now, id)}</span>
          </span>
        </label>
      ))}
    </fieldset>
  )
}
