import { CLOCK_DATE_FORMATS, type ClockDateFormat } from './clock-format.ts'
import type { FrameLayout } from './frame-layout.ts'

export type LayoutItemOptionsMap = {
  'widget:clock': { dateFormat: ClockDateFormat }
}

type OptionsDefinition<T> = {
  defaults: T
  read: (value: unknown) => T | undefined
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

const definitions: {
  [Key in keyof LayoutItemOptionsMap]: OptionsDefinition<
    LayoutItemOptionsMap[Key]
  >
} = {
  'widget:clock': {
    defaults: { dateFormat: 'none' },
    read(value) {
      if (!record(value)) return undefined
      const format = CLOCK_DATE_FORMATS.find(
        (entry) => entry.id === value.dateFormat,
      )
      return format ? { dateFormat: format.id } : undefined
    },
  },
}

export function getLayoutItemOptions<Key extends keyof LayoutItemOptionsMap>(
  layout: FrameLayout,
  key: Key,
): LayoutItemOptionsMap[Key] {
  return layout.options?.[key] ?? definitions[key].defaults
}

export function setLayoutItemOptions<Key extends keyof LayoutItemOptionsMap>(
  layout: FrameLayout,
  key: Key,
  options: LayoutItemOptionsMap[Key],
): FrameLayout {
  return { ...layout, options: { ...layout.options, [key]: { ...options } } }
}

export function readLayoutItemOptions(
  value: unknown,
): Partial<LayoutItemOptionsMap> {
  const options: Partial<LayoutItemOptionsMap> = {}
  if (!record(value)) return options
  const saved = value
  function read<Key extends keyof LayoutItemOptionsMap>(key: Key) {
    if (!Object.hasOwn(saved, key)) return
    const result = definitions[key].read(saved[key])
    if (result) options[key] = result
  }
  for (const key of Object.keys(definitions) as (keyof LayoutItemOptionsMap)[])
    read(key)
  return options
}
