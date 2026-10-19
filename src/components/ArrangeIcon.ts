import { createElement } from 'react'
import type { LucideProps } from 'lucide-react'

export default function ArrangeIcon({
  size = 20,
  strokeWidth = 1.6,
  ...props
}: LucideProps) {
  return createElement(
    'svg',
    {
      width: size,
      height: size,
      viewBox: '0 0 24 24',
      fill: 'none',
      stroke: 'currentColor',
      strokeWidth,
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      'aria-hidden': true,
      focusable: false,
      ...props,
    },
    createElement('rect', { x: 2, y: 3, width: 9, height: 18, rx: 1.5 }),
    createElement('rect', { x: 15, y: 3, width: 7, height: 7, rx: 1.5 }),
    createElement('rect', { x: 15, y: 14, width: 7, height: 7, rx: 1.5 }),
  )
}
