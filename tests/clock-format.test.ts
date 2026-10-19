import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatClock } from '../src/clock-format.ts'

const now = new Date(2026, 9, 18, 14, 5)

test('the default clock keeps local 24-hour time and pads midnight', () => {
  assert.equal(formatClock(now, 'none', 'en-US'), '14:05')
  assert.equal(
    formatClock(new Date(2026, 9, 18, 0, 7), 'none', 'en-US'),
    '00:07',
  )
})

test('clock date choices prepend the selected date detail', () => {
  assert.equal(formatClock(now, 'weekday', 'en-US'), 'Sun · 14:05')
  assert.equal(formatClock(now, 'short', 'en-US'), 'Oct 18 · 14:05')
  assert.equal(formatClock(now, 'numeric', 'en-US'), '10/18/2026 · 14:05')
  assert.equal(formatClock(now, 'long', 'en-US'), 'October 18, 2026 · 14:05')
})

test('dates follow the requested locale instead of a hardcoded month-first order', () => {
  assert.equal(formatClock(now, 'short', 'en-GB'), '18 Oct · 14:05')
  assert.equal(formatClock(now, 'numeric', 'en-GB'), '18/10/2026 · 14:05')
  assert.equal(formatClock(now, 'long', 'en-GB'), '18 October 2026 · 14:05')
})
