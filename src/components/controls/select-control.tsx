import type { ComponentProps } from 'react'
import { ChevronDown } from '../icons'
import styles from './select-control.module.css'

export default function SelectControl(props: ComponentProps<'select'>) {
  return (
    <span className={styles.control}>
      <select {...props} />
      <ChevronDown size={16} />
    </span>
  )
}
