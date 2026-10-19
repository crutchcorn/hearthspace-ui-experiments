import {
  createElement,
  type ReactElement,
  type ReactNode,
  type SVGProps,
} from 'react'

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'> & {
  size?: number | string
}

export type IconComponent = (props: IconProps) => ReactElement

/** Shared drawing grid and stroke treatment for the Hearthspace icon set. */
export function createIcon(name: string, geometry: ReactNode): IconComponent {
  function Icon({ size = 24, strokeWidth, ...props }: IconProps) {
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
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: strokeWidth ?? opticalStroke,
        strokeLinecap: 'square',
        strokeLinejoin: 'miter',
        strokeMiterlimit: 2,
        'aria-hidden': true,
        focusable: false,
        ...props,
        'data-icon': name,
      },
      geometry,
    )
  }
  Icon.displayName = name
  return Icon
}
