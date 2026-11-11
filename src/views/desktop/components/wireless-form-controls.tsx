import type { ComponentPropsWithoutRef } from 'react'
import { Check, ChevronDown } from '../../../components/icons'
import styles from './wireless-dialog.module.css'

export function WirelessSelect(props: ComponentPropsWithoutRef<'select'>) {
  return (
    <span className={styles.selectControl}>
      <select {...props} />
      <ChevronDown size={16} />
    </span>
  )
}

export function WirelessCheckbox(
  props: Omit<ComponentPropsWithoutRef<'input'>, 'type'>,
) {
  return (
    <span className={styles.checkboxControl}>
      <input {...props} type="checkbox" />
      <Check size={16} />
    </span>
  )
}
