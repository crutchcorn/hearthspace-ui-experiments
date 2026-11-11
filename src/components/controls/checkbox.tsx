import type { ComponentProps } from 'react'
import { Check } from '../icons'
import styles from './checkbox.module.css'

export default function Checkbox(props: Omit<ComponentProps<'input'>, 'type'>) {
  return (
    <span className={styles.checkbox}>
      <input {...props} type="checkbox" />
      <Check size={16} />
    </span>
  )
}
