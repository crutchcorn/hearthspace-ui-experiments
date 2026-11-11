import preview from '../../../.storybook/preview'
import * as actions from './actions'
import * as apps from './apps'
import * as canvas from './canvas'
import * as system from './system'
import type { IconComponent, IconVariant } from './create-icon'

function IconGallery({
  icons,
  variant = 'outline',
  size = 32,
}: {
  icons: Record<string, IconComponent>
  variant?: IconVariant
  size?: number
}) {
  return (
    <ul
      style={{
        width: 'min(860px, 100%)',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))',
        gap: 12,
        padding: 0,
        listStyle: 'none',
      }}
    >
      {Object.entries(icons).map(([name, Icon]) => (
        <li
          key={name}
          style={{
            display: 'grid',
            justifyItems: 'center',
            gap: 8,
            padding: 12,
            borderRadius: 'var(--radius-tile)',
            background: 'var(--material-surface)',
          }}
        >
          <Icon size={size} variant={variant} />
          <span>{name}</span>
        </li>
      ))}
    </ul>
  )
}

const meta = preview.meta({
  title: 'Shared/Icons',
  component: IconGallery,
  argTypes: { icons: { control: false } },
})

export const Actions = meta.story({ args: { icons: actions } })
export const Apps = meta.story({ args: { icons: apps } })
export const FilledApps = meta.story({
  args: { icons: apps, variant: 'filled' },
})
export const Canvas = meta.story({ args: { icons: canvas } })
export const System = meta.story({ args: { icons: system } })
