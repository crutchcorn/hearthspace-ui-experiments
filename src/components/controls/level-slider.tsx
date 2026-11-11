import type { ComponentProps } from 'react'
import styles from './level-slider.module.css'

type LevelSliderProps = Pick<
  ComponentProps<'input'>,
  'id' | 'aria-label' | 'disabled'
> & {
  value: number
  onChange: (value: number) => void
}

export default function LevelSlider({
  value,
  onChange,
  ...props
}: LevelSliderProps) {
  return (
    <input
      {...props}
      className={styles.slider}
      type="range"
      min="0"
      max="100"
      value={value}
      onChange={(event) => onChange(event.currentTarget.valueAsNumber)}
    />
  )
}
