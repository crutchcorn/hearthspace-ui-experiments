import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mergeOverlappingFrameItems } from '../src/frame-collisions.ts'
import {
  getFrameGroups,
  getPlacement,
  getTargetGroup,
  mergeFrameTargets,
  setObjectPlacement,
  type FrameLayout,
  type LayoutTarget,
} from '../src/frame-layout.ts'

const apps: LayoutTarget = { kind: 'widget', id: 'apps' }
const tools: LayoutTarget = { kind: 'widget', id: 'tools' }
const wifi: LayoutTarget = { kind: 'widget', id: 'wifi' }
const battery: LayoutTarget = { kind: 'widget', id: 'battery' }
const frame = { surface: 'frame', edge: 'bottom', position: 0.5 } as const
const layout: FrameLayout = {
  allowHideTools: false,
  groups: {},
  placements: {
    'widget:apps': frame,
    'widget:tools': { ...frame, position: 0.6 },
    'widget:wifi': { ...frame, position: 0.7 },
    'widget:battery': { ...frame, position: 0.8 },
  },
}
const measured = (
  target: LayoutTarget,
  x: number,
  y = 640,
  width = 100,
  height = 54,
) => ({
  target,
  bounds: { x, y, width, height },
})

test('overlapping frame attachments form one group at the first attachment placement', () => {
  const merged = mergeOverlappingFrameItems(layout, [
    measured(apps, 200),
    measured(tools, 250),
  ])
  assert.deepEqual(getTargetGroup(merged, apps)?.members, [apps, tools])
  assert.deepEqual(getPlacement(merged, tools), frame)
  assert.deepEqual(getFrameGroups(layout), [])
})

test('touching edges and separated attachments remain independent', () => {
  assert.equal(
    mergeOverlappingFrameItems(layout, [
      measured(apps, 200),
      measured(tools, 300),
      measured(wifi, 200, 694),
      measured(battery, 500),
    ]),
    layout,
  )
})

test('a chain of overlaps merges in one pass even when its ends do not intersect', () => {
  const merged = mergeOverlappingFrameItems(layout, [
    measured(apps, 200),
    measured(tools, 350),
    measured(wifi, 275),
  ])
  assert.deepEqual(getTargetGroup(merged, apps)?.members, [apps, tools, wifi])
  assert.equal(getFrameGroups(merged).length, 1)
})

test('independent overlap clusters produce separate groups', () => {
  const merged = mergeOverlappingFrameItems(layout, [
    measured(apps, 200),
    measured(tools, 250),
    measured(wifi, 500),
    measured(battery, 550),
  ])
  assert.deepEqual(
    getFrameGroups(merged).map((group) => group.members),
    [
      [apps, tools],
      [wifi, battery],
    ],
  )
})

test('colliding groups flatten without duplicating separately measured child entries', () => {
  let grouped = mergeFrameTargets(layout, tools, apps)
  grouped = mergeFrameTargets(grouped, battery, wifi)
  const dock = { kind: 'group', id: getTargetGroup(grouped, apps)!.id } as const
  const status = {
    kind: 'group',
    id: getTargetGroup(grouped, wifi)!.id,
  } as const
  const merged = mergeOverlappingFrameItems(grouped, [
    measured(dock, 200, 640, 180),
    measured(apps, 200),
    measured(status, 350),
    measured(status, 350),
    measured(battery, 350),
  ])
  assert.deepEqual(getFrameGroups(merged), [
    { id: dock.id, members: [apps, tools, wifi, battery] },
  ])
  assert.deepEqual(getPlacement(merged, battery), frame)
})

test('frame shortcuts, windows, and drawings group while canvas and hidden controls are ignored', () => {
  const item = { kind: 'item', id: 'projects' } as const
  let mixed = setObjectPlacement(layout, item, frame)
  mixed = setObjectPlacement(mixed, wifi, { surface: 'canvas', x: 200, y: 640 })
  mixed = setObjectPlacement(mixed, battery, { surface: 'hidden' })
  const window = { kind: 'window', id: 'notes' } as const
  const drawing = { kind: 'drawing', id: 'sketch' } as const
  mixed = setObjectPlacement(mixed, window, frame)
  mixed = setObjectPlacement(mixed, drawing, frame)
  const merged = mergeOverlappingFrameItems(mixed, [
    measured(apps, 200),
    measured(item, 220),
    measured(wifi, 200),
    measured(battery, 200),
    measured(window, 200),
    measured(drawing, 200),
  ])
  assert.deepEqual(getTargetGroup(merged, apps)?.members, [
    apps,
    item,
    window,
    drawing,
  ])
  assert.equal(getTargetGroup(merged, wifi), undefined)
  assert.deepEqual(getPlacement(merged, window), frame)
  assert.deepEqual(getPlacement(merged, drawing), frame)
})

test('items on different frame edges still group if they intersect at the corner', () => {
  const corner = setObjectPlacement(layout, tools, {
    surface: 'frame',
    edge: 'left',
    position: 1,
  })
  const merged = mergeOverlappingFrameItems(corner, [
    measured(apps, 24),
    measured(tools, 24, 620),
  ])
  assert.deepEqual(getTargetGroup(merged, apps)?.members, [apps, tools])
  assert.deepEqual(getPlacement(merged, tools), frame)
})

test('empty and invalid measurements cannot create a group', () => {
  assert.equal(
    mergeOverlappingFrameItems(layout, [
      measured(apps, 200),
      measured(tools, 200, 640, 0),
      measured(wifi, Number.NaN),
      measured(battery, 200, 640, 100, Number.POSITIVE_INFINITY),
    ]),
    layout,
  )
})
