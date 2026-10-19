import { useId, type Dispatch, type SetStateAction } from 'react'
import { CLOCK_DATE_FORMATS, formatClock } from '../clock-format'
import type { FrameLayout } from '../frame-layout'
import {
  getLayoutItemOptions,
  setLayoutItemOptions,
} from '../layout-item-options'
import styles from './ClockLayoutControls.module.css'

interface ClockLayoutControlsProps {
  layout: FrameLayout
  onChange: Dispatch<SetStateAction<FrameLayout>>
  now: Date
}

export default function ClockLayoutControls({
  layout,
  onChange,
  now,
}: ClockLayoutControlsProps) {
  const name = useId()
  const { dateFormat } = getLayoutItemOptions(layout, 'widget:clock')

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
            onChange={() =>
              onChange((current) =>
                setLayoutItemOptions(current, 'widget:clock', {
                  dateFormat: id,
                }),
              )
            }
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
