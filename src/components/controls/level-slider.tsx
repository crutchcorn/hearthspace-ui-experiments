import type { ReactNode } from 'react'
import {
  Slider,
  SliderFill,
  SliderThumb,
  SliderTrack,
} from 'react-aria-components'
import styles from './level-slider.module.css'

interface LevelSliderProps {
  'aria-label'?: string
  disabled?: boolean
  value: number
  onChange: (value: number) => void
  renderLayout?: (track: ReactNode) => ReactNode
}

export default function LevelSlider({
  'aria-label': label,
  disabled,
  value,
  onChange,
  renderLayout,
}: LevelSliderProps) {
  const track = (
    <SliderTrack className={styles.track}>
      <div className={styles.rail} aria-hidden="true">
        <SliderFill className={styles.fill} />
      </div>
      <SliderThumb className={styles.thumb} />
    </SliderTrack>
  )

  return (
    <Slider
      aria-label={label}
      className={styles.slider}
      isDisabled={disabled}
      minValue={0}
      maxValue={100}
      step={1}
      value={value}
      onChange={onChange}
    >
      {renderLayout ? renderLayout(track) : track}
    </Slider>
  )
}
