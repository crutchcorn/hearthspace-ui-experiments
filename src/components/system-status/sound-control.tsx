import { useId } from 'react'
import LevelSlider from '../controls/level-slider'
import { Volume, VolumeMuted } from '../icons'
import styles from './status-control.module.css'

interface SoundControlProps {
  value: number
  onChange: (volume: number) => void
}

export default function SoundControl({ value, onChange }: SoundControlProps) {
  const id = useId()

  return (
    <>
      <div className={styles.heading}>
        <label htmlFor={id}>Sound</label>
        <span>
          {value}
          <small>%</small>
        </span>
      </div>
      <div className={styles.volumeRow}>
        <VolumeMuted size={16} />
        <LevelSlider id={id} value={value} onChange={onChange} />
        <Volume size={17} />
      </div>
    </>
  )
}
