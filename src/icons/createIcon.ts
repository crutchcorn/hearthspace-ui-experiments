import {
  createElement,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from 'react'

export type IconVariant = 'outline' | 'filled'

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: number | string
  variant?: IconVariant
}

export type IconComponent = (props: IconProps) => ReactElement

/** Shared drawing grid and stroke treatment for the Hearthspace icon set. */
export function createIcon(
  name: string,
  geometry: ReactNode,
  filledGeometry?: ReactNode,
): IconComponent {
  function Icon({
    size = 24,
    strokeWidth,
    variant = 'outline',
    ...props
  }: IconProps) {
    const filled = variant === 'filled' && filledGeometry !== undefined
    const opticalStroke =
      typeof size === 'number'
        ? size <= 16
          ? 1.75
          : size >= 32
            ? 1.25
            : 1.5
        : 1.5
    return createElement(
      'svg',
      {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: filled ? 'currentColor' : 'none',
        stroke: filled ? 'none' : 'currentColor',
        strokeWidth: strokeWidth ?? opticalStroke,
        strokeLinecap: 'square',
        strokeLinejoin: 'miter',
        strokeMiterlimit: 2,
        'aria-hidden': true,
        focusable: false,
        ...props,
        'data-icon': name,
        'data-icon-variant': filled ? 'filled' : 'outline',
      },
      filled ? filledGeometry : geometry,
    )
  }
  Icon.displayName = name
  return Icon
}
