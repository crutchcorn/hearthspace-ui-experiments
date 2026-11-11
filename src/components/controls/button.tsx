import type { ComponentProps } from 'react'
import styles from './button.module.css'

type ButtonProps = ComponentProps<'button'> & {
  variant?: 'neutral' | 'primary' | 'danger' | 'quiet'
}

export default function Button({
  variant = 'neutral',
  type = 'button',
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={className ? `${styles.button} ${className}` : styles.button}
      data-variant={variant}
    />
  )
}
