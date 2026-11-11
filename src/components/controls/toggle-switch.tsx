import type { ComponentProps } from 'react'
import styles from './toggle-switch.module.css'

export default function ToggleSwitch({
  className,
  role = 'switch',
  ...props
}: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <input
      {...props}
      className={className ? `${styles.toggle} ${className}` : styles.toggle}
      type="checkbox"
      role={role}
    />
  )
}
