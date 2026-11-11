import { Label } from 'react-aria-components'
import LevelSlider from '../controls/level-slider'
import { Volume, VolumeMuted } from '../icons'
import styles from './status-control.module.css'

interface SoundControlProps {
  value: number
  onChange: (volume: number) => void
}

export default function SoundControl({ value, onChange }: SoundControlProps) {
  return (
    <LevelSlider
      value={value}
      onChange={onChange}
      renderLayout={(track) => (
        <>
          <div className={styles.heading}>
            <Label>Sound</Label>
            <span>
              {value}
              <small>%</small>
            </span>
          </div>
          <div className={styles.volumeRow}>
            <VolumeMuted size={16} />
            {track}
            <Volume size={17} />
          </div>
        </>
      )}
    />
  )
}
