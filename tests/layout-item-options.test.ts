import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFrameLayout } from '../src/frame-layout.ts'
import {
  getLayoutItemOptions,
  readLayoutItemOptions,
  setLayoutItemOptions,
} from '../src/layout-item-options.ts'

test('layouts without saved item options retain the current time-only clock', () => {
  const layout = readFrameLayout(undefined)
  assert.equal(Object.hasOwn(layout, 'options'), false)
  assert.deepEqual(getLayoutItemOptions(layout, 'widget:clock'), {
    dateFormat: 'none',
  })
})

test('invalid and unknown item options cannot discard a valid clock preference', () => {
  const options = readLayoutItemOptions({
    'widget:clock': { dateFormat: 'long', unknown: true },
    'widget:battery': { dateFormat: 'short' },
    'unknown:item': { enabled: true },
  })
  assert.deepEqual(options, { 'widget:clock': { dateFormat: 'long' } })
  assert.deepEqual(
    readLayoutItemOptions({ 'widget:clock': { dateFormat: 'custom' } }),
    {},
  )
  assert.deepEqual(readLayoutItemOptions({ 'widget:clock': ['numeric'] }), {})
  assert.deepEqual(readLayoutItemOptions(null), {})
  assert.deepEqual(
    getLayoutItemOptions(
      readFrameLayout({ options: { 'widget:clock': { dateFormat: 4 } } }),
      'widget:clock',
    ),
    { dateFormat: 'none' },
  )
})

test('changing an item preference preserves the layout and does not mutate its previous value', () => {
  const before = setLayoutItemOptions(
    readFrameLayout(undefined),
    'widget:clock',
    { dateFormat: 'weekday' },
  )
  const after = setLayoutItemOptions(before, 'widget:clock', {
    dateFormat: 'numeric',
  })
  assert.deepEqual(getLayoutItemOptions(before, 'widget:clock'), {
    dateFormat: 'weekday',
  })
  assert.deepEqual(getLayoutItemOptions(after, 'widget:clock'), {
    dateFormat: 'numeric',
  })
  assert.equal(after.placements, before.placements)
  assert.equal(after.groups, before.groups)
})
