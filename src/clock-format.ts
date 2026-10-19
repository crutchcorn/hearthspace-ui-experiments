export type ClockDateFormat = 'none' | 'weekday' | 'short' | 'numeric' | 'long'

export const CLOCK_DATE_FORMATS = [
  { id: 'none', label: 'Time only' },
  { id: 'weekday', label: 'Weekday' },
  { id: 'short', label: 'Short date' },
  { id: 'numeric', label: 'Numeric date' },
  { id: 'long', label: 'Long date' },
] as const satisfies readonly { id: ClockDateFormat; label: string }[]

const dateOptions: Record<
  Exclude<ClockDateFormat, 'none'>,
  Intl.DateTimeFormatOptions
> = {
  weekday: { weekday: 'short' },
  short: { month: 'short', day: 'numeric' },
  numeric: { year: 'numeric', month: '2-digit', day: '2-digit' },
  long: { year: 'numeric', month: 'long', day: 'numeric' },
}

export function formatClock(
  now: Date,
  dateFormat: ClockDateFormat = 'none',
  locale?: string,
): string {
  const time = now.toLocaleTimeString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
  if (dateFormat === 'none') return time
  return `${now.toLocaleDateString(locale, dateOptions[dateFormat])} · ${time}`
}
