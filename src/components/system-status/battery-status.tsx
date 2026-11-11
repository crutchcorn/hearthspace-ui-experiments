import LevelBar from '../controls/level-bar'
import styles from './status-control.module.css'

interface BatteryStatusProps {
  percentage: number
  powerSource: string
}

export default function BatteryStatus({
  percentage,
  powerSource,
}: BatteryStatusProps) {
  return (
    <>
      <div className={styles.heading}>
        <strong>Battery</strong>
        <span>
          {percentage}
          <small>%</small>
        </span>
      </div>
      <LevelBar
        className={styles.batteryMeter}
        label="Battery charge"
        value={percentage}
      />
      <p className={styles.batteryDescription}>{powerSource}</p>
    </>
  )
}
