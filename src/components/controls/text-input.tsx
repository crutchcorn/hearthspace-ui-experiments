import type { ComponentProps } from 'react'
import styles from './text-input.module.css'

type TextInputProps = Omit<ComponentProps<'input'>, 'type'> & {
  type?: 'text' | 'password' | 'email' | 'search' | 'tel' | 'url'
}

export default function TextInput({
  type = 'text',
  className,
  ...props
}: TextInputProps) {
  return (
    <input
      {...props}
      type={type}
      className={className ? `${styles.input} ${className}` : styles.input}
    />
  )
}
