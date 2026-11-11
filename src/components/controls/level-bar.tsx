import styles from './level-bar.module.css'

interface LevelBarProps {
  value: number
  label: string
  role?: 'meter' | 'progressbar'
  className?: string
}

export default function LevelBar({
  value,
  label,
  role = 'meter',
  className,
}: LevelBarProps) {
  const percentage = Number.isFinite(value)
    ? Math.max(0, Math.min(100, value))
    : 0

  return (
    <div
      className={className ? `${styles.track} ${className}` : styles.track}
      role={role}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percentage}
    >
      <span style={{ width: `${percentage}%` }} />
    </div>
  )
}
