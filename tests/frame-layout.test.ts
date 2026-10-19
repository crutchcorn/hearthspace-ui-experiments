import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import {
  FRAME_LAYOUT_STORAGE_KEY,
  getFrameBounds,
  getFrameDragBounds,
  getFrameDropTarget,
  getFrameGroups,
  getPlacement,
  getPinnedWindowOffset,
  getTargetGroup,
  getWidgetExpanded,
  getWidgetFrameDropTarget,
  loadFrameLayout,
  mergeFrameTargets,
  saveFrameLayout,
  setAllowHideTools,
  setObjectPlacement,
  setWidgetExpanded,
  ungroupFrameTarget,
  type FrameLayout,
} from '../src/frame-layout.ts'

const originalStorage = Object.getOwnPropertyDescriptor(
  globalThis,
  'localStorage',
)
const storage = new Map<string, string>()
before(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    },
  })
})
after(() => {
  if (originalStorage)
    Object.defineProperty(globalThis, 'localStorage', originalStorage)
  else Reflect.deleteProperty(globalThis, 'localStorage')
})

const defaults: FrameLayout = { placements: {}, allowHideTools: false }
const tools = { kind: 'widget', id: 'tools' } as const
const notifications = { kind: 'widget', id: 'notifications' } as const
const clock = { kind: 'widget', id: 'clock' } as const
const wifi = { kind: 'widget', id: 'wifi' } as const
const volume = { kind: 'widget', id: 'volume' } as const
const battery = { kind: 'widget', id: 'battery' } as const
const apps = { kind: 'widget', id: 'apps' } as const
const defaultSystemGroup = {
  id: 'system',
  members: [clock, wifi, volume, battery],
}
const loadedDefaults: FrameLayout = {
  ...defaults,
  placements: {
    'group:system': { surface: 'frame', edge: 'top', position: 1 },
  },
  groups: { system: defaultSystemGroup },
}

test('an empty layout keeps the familiar corner controls and canvas objects', () => {
  assert.deepEqual(getPlacement(defaults, notifications), {
    surface: 'frame',
    edge: 'top',
    position: 0,
  })
  assert.deepEqual(getPlacement(defaults, tools), {
    surface: 'frame',
    edge: 'bottom',
    position: 0,
  })
  assert.deepEqual(getPlacement(defaults, { kind: 'item', id: 'browser' }), {
    surface: 'background',
  })
})

test('canvas tools stay visible until hiding them is explicitly enabled', () => {
  const protectedLayout = setObjectPlacement(defaults, tools, {
    surface: 'hidden',
  })
  assert.equal(getPlacement(protectedLayout, tools).surface, 'frame')

  const hidden = setObjectPlacement(setAllowHideTools(defaults, true), tools, {
    surface: 'hidden',
  })
  assert.equal(getPlacement(hidden, tools).surface, 'hidden')
  const restored = setAllowHideTools(hidden, false)
  assert.deepEqual(getPlacement(restored, tools), {
    surface: 'frame',
    edge: 'bottom',
    position: 0,
  })
  assert.equal(getPlacement(hidden, tools).surface, 'hidden')
})

test('removing attachments hides widgets but returns work to the canvas', () => {
  const hidden = setObjectPlacement(defaults, notifications, {
    surface: 'hidden',
  })
  assert.equal(getPlacement(hidden, notifications).surface, 'hidden')
  for (const kind of ['item', 'window', 'drawing'] as const) {
    const target = { kind, id: 'personal-work' }
    const layout = setObjectPlacement(defaults, target, { surface: 'hidden' })
    assert.deepEqual(getPlacement(layout, target), {
      surface: kind === 'item' ? 'background' : 'canvas',
    })
  }
})

test('frame and background placements survive a saved-layout round trip', () => {
  const layout: FrameLayout = {
    allowHideTools: true,
    groups: {},
    placements: {
      'widget:tools': { surface: 'hidden' },
      'widget:wifi': { surface: 'frame', edge: 'left', position: 0.7 },
      'window:notes': { surface: 'frame', edge: 'right', position: 0.25 },
      'item:projects': { surface: 'background', x: 4320, y: 3690 },
      'drawing:my:sketch': { surface: 'canvas', x: 4500, y: 3700 },
    },
  }
  saveFrameLayout(layout)
  assert.deepEqual(loadFrameLayout(), layout)
})

test('invalid saved entries do not discard valid placements or hide protected tools', () => {
  storage.set(
    FRAME_LAYOUT_STORAGE_KEY,
    JSON.stringify({
      allowHideTools: 'true',
      placements: {
        'widget:tools': { surface: 'hidden' },
        'widget:system': { surface: 'frame', edge: 'right', position: 4 },
        'drawing:sketch': { surface: 'frame', edge: 'top', position: -2 },
        'window:missing-edge': { surface: 'frame', position: 0.5 },
        'window:wrong-edge': { surface: 'frame', edge: 'middle', position: 0 },
        'window:infinite': {
          surface: 'frame',
          edge: 'top',
          position: Infinity,
        },
        'item:bad-coordinate': { surface: 'background', x: '10' },
        'item:non-finite': { surface: 'canvas', y: NaN },
        'item:hidden': { surface: 'hidden' },
        'widget:unknown': { surface: 'frame', edge: 'top', position: 0 },
        'unknown:item': { surface: 'canvas' },
        'window:': { surface: 'canvas' },
      },
    }),
  )
  assert.deepEqual(loadFrameLayout(), {
    allowHideTools: false,
    placements: {
      'widget:tools': { surface: 'frame', edge: 'bottom', position: 0 },
      'group:system': { surface: 'frame', edge: 'right', position: 1 },
      'drawing:sketch': { surface: 'frame', edge: 'top', position: 0 },
      'item:hidden': { surface: 'background' },
    },
    groups: { system: defaultSystemGroup },
  })
})

test('unreadable layout data restores defaults', () => {
  storage.set(FRAME_LAYOUT_STORAGE_KEY, '{unfinished')
  assert.deepEqual(loadFrameLayout(), loadedDefaults)
  storage.set(FRAME_LAYOUT_STORAGE_KEY, 'null')
  assert.deepEqual(loadFrameLayout(), loadedDefaults)
})

test('the former system tray migrates as one movable group of independent status items', () => {
  storage.set(
    FRAME_LAYOUT_STORAGE_KEY,
    JSON.stringify({
      placements: {
        'widget:system': { surface: 'frame', edge: 'left', position: 0.7 },
      },
      allowHideTools: false,
    }),
  )
  const layout = loadFrameLayout()
  assert.deepEqual(getFrameGroups(layout), [defaultSystemGroup])
  for (const member of defaultSystemGroup.members)
    assert.deepEqual(getPlacement(layout, member), {
      surface: 'frame',
      edge: 'left',
      position: 0.7,
    })
  assert.equal(Object.hasOwn(layout.placements, 'widget:system'), false)
})

test('an older layout with an implicit system default gains the default status group', () => {
  const placement = { surface: 'frame', edge: 'left', position: 0.2 } as const
  storage.set(
    FRAME_LAYOUT_STORAGE_KEY,
    JSON.stringify({
      placements: { 'widget:tools': placement },
      allowHideTools: true,
    }),
  )
  const layout = loadFrameLayout()
  assert.deepEqual(getFrameGroups(layout), [defaultSystemGroup])
  assert.deepEqual(getPlacement(layout, clock), {
    surface: 'frame',
    edge: 'top',
    position: 1,
  })
  assert.deepEqual(getPlacement(layout, tools), placement)
  assert.equal(layout.allowHideTools, true)
})

test('a previously removed system tray stays removed after splitting its controls', () => {
  storage.set(
    FRAME_LAYOUT_STORAGE_KEY,
    JSON.stringify({
      placements: { 'widget:system': { surface: 'hidden' } },
    }),
  )
  const layout = loadFrameLayout()
  assert.deepEqual(getFrameGroups(layout), [])
  for (const member of defaultSystemGroup.members)
    assert.deepEqual(getPlacement(layout, member), { surface: 'hidden' })
})

test('merging dock, tools, and a status group produces one flat ordered frame group', () => {
  let layout = mergeFrameTargets(loadedDefaults, tools, apps, true)
  const dockGroup = getTargetGroup(layout, apps)!
  layout = mergeFrameTargets(
    layout,
    { kind: 'group', id: 'system' },
    { kind: 'group', id: dockGroup.id },
  )
  assert.deepEqual(getFrameGroups(layout), [
    {
      id: dockGroup.id,
      members: [tools, apps, clock, wifi, volume, battery],
    },
  ])
  for (const member of getFrameGroups(layout)[0]!.members)
    assert.deepEqual(getPlacement(layout, member), {
      surface: 'frame',
      edge: 'bottom',
      position: 1,
    })
  assert.equal(Object.hasOwn(layout.placements, 'group:system'), false)
})

test('an individual grouped status item can move independently without moving its neighbors', () => {
  const layout = setObjectPlacement(loadedDefaults, wifi, {
    surface: 'frame',
    edge: 'bottom',
    position: 0.5,
  })
  assert.deepEqual(getTargetGroup(layout, wifi), undefined)
  assert.deepEqual(getPlacement(layout, wifi), {
    surface: 'frame',
    edge: 'bottom',
    position: 0.5,
  })
  assert.deepEqual(getFrameGroups(layout)[0]!.members, [clock, volume, battery])
  assert.deepEqual(getPlacement(layout, clock), {
    surface: 'frame',
    edge: 'top',
    position: 1,
  })
  assert.deepEqual(
    getFrameGroups(loadedDefaults)[0]!.members,
    defaultSystemGroup.members,
  )
})

test('moving one status item into another frame group leaves both groups valid', () => {
  const grouped = mergeFrameTargets(loadedDefaults, tools, apps)
  const moved = mergeFrameTargets(grouped, wifi, apps, true)
  assert.deepEqual(getTargetGroup(moved, clock)?.members, [
    clock,
    volume,
    battery,
  ])
  assert.deepEqual(getTargetGroup(moved, apps)?.members, [wifi, apps, tools])
  assert.deepEqual(getPlacement(moved, wifi), {
    surface: 'frame',
    edge: 'bottom',
    position: 1,
  })
  saveFrameLayout(moved)
  assert.deepEqual(loadFrameLayout(), moved)
})

test('moving an entire group preserves its members and places them together', () => {
  const placement = { surface: 'frame', edge: 'bottom', position: 0 } as const
  const layout = setObjectPlacement(
    loadedDefaults,
    { kind: 'group', id: 'system' },
    placement,
  )
  assert.deepEqual(getFrameGroups(layout), [defaultSystemGroup])
  for (const member of defaultSystemGroup.members)
    assert.deepEqual(getPlacement(layout, member), placement)
})

test('detaching from a two-item group dissolves it while keeping the remaining attachment in place', () => {
  const grouped = mergeFrameTargets(defaults, tools, apps)
  const layout = setObjectPlacement(grouped, tools, {
    surface: 'canvas',
    x: 120,
    y: 240,
  })
  assert.deepEqual(getFrameGroups(layout), [])
  assert.deepEqual(getPlacement(layout, apps), {
    surface: 'frame',
    edge: 'bottom',
    position: 1,
  })
  assert.deepEqual(getPlacement(layout, tools), {
    surface: 'canvas',
    x: 120,
    y: 240,
  })
  assert.equal(
    Object.keys(layout.placements).some((key) => key.startsWith('group:')),
    false,
  )
})

test('members can be reordered and inserted into an existing group without duplicates', () => {
  const reordered = mergeFrameTargets(loadedDefaults, battery, clock, true)
  assert.deepEqual(getFrameGroups(reordered)[0]!.members, [
    battery,
    clock,
    wifi,
    volume,
  ])
  const item = { kind: 'item', id: 'projects' } as const
  const inserted = mergeFrameTargets(reordered, item, wifi)
  assert.deepEqual(getFrameGroups(inserted)[0]!.members, [
    battery,
    clock,
    wifi,
    item,
    volume,
  ])
  assert.deepEqual(getPlacement(inserted, item), {
    surface: 'frame',
    edge: 'top',
    position: 1,
  })
})

test('ungrouping keeps every attachment on the same edge and remains ungrouped after reload', () => {
  const layout = ungroupFrameTarget(loadedDefaults, {
    kind: 'group',
    id: 'system',
  })
  assert.deepEqual(getFrameGroups(layout), [])
  for (const member of defaultSystemGroup.members)
    assert.deepEqual(getPlacement(layout, member), {
      surface: 'frame',
      edge: 'top',
      position: 1,
    })
  saveFrameLayout(layout)
  assert.deepEqual(loadFrameLayout(), layout)
})

test('removing a group respects the canvas tools safeguard and preserves personal items', () => {
  let layout = mergeFrameTargets(defaults, tools, apps)
  layout = mergeFrameTargets(layout, { kind: 'item', id: 'projects' }, apps)
  const group = getTargetGroup(layout, apps)!
  const removed = setObjectPlacement(
    layout,
    { kind: 'group', id: group.id },
    { surface: 'hidden' },
  )
  assert.deepEqual(getFrameGroups(removed), [])
  assert.deepEqual(getPlacement(removed, tools), {
    surface: 'frame',
    edge: 'bottom',
    position: 0,
  })
  assert.deepEqual(getPlacement(removed, apps), { surface: 'hidden' })
  assert.deepEqual(getPlacement(removed, { kind: 'item', id: 'projects' }), {
    surface: 'background',
  })
  const allowed = setObjectPlacement(
    setAllowHideTools(layout, true),
    { kind: 'group', id: group.id },
    { surface: 'hidden' },
  )
  assert.deepEqual(getPlacement(allowed, tools), { surface: 'hidden' })
})

test('windows and drawings join a frame group and retain membership after reload', () => {
  const window = { kind: 'window', id: 'notes' } as const
  const drawing = { kind: 'drawing', id: 'sketch' } as const
  let layout = mergeFrameTargets(defaults, window, apps)
  layout = mergeFrameTargets(layout, drawing, {
    kind: 'group',
    id: getTargetGroup(layout, apps)!.id,
  })
  assert.deepEqual(getTargetGroup(layout, apps)?.members, [
    apps,
    window,
    drawing,
  ])
  assert.deepEqual(getPlacement(layout, window), {
    surface: 'frame',
    edge: 'bottom',
    position: 1,
  })
  assert.deepEqual(getPlacement(layout, drawing), getPlacement(layout, apps))
  saveFrameLayout(layout)
  assert.deepEqual(loadFrameLayout(), layout)
})

test('removing a mixed group returns personal windows and drawings to the canvas', () => {
  const window = { kind: 'window', id: 'notes' } as const
  const drawing = { kind: 'drawing', id: 'sketch' } as const
  let layout = mergeFrameTargets(defaults, window, apps)
  layout = mergeFrameTargets(layout, drawing, apps)
  const removed = setObjectPlacement(
    layout,
    { kind: 'group', id: getTargetGroup(layout, apps)!.id },
    { surface: 'hidden' },
  )
  assert.deepEqual(getFrameGroups(removed), [])
  assert.deepEqual(getPlacement(removed, window), { surface: 'canvas' })
  assert.deepEqual(getPlacement(removed, drawing), { surface: 'canvas' })
  assert.deepEqual(getPlacement(removed, apps), { surface: 'hidden' })
  saveFrameLayout(removed)
  assert.deepEqual(loadFrameLayout(), removed)
})

test('detaching a grouped drawing preserves the other window attachment and its frame edge', () => {
  const window = { kind: 'window', id: 'notes' } as const
  const drawing = { kind: 'drawing', id: 'sketch' } as const
  let layout = setObjectPlacement(defaults, window, {
    surface: 'frame',
    edge: 'left',
    position: 0.4,
  })
  layout = mergeFrameTargets(layout, drawing, window)
  const detached = setObjectPlacement(layout, drawing, {
    surface: 'background',
    x: 420,
    y: 360,
  })
  assert.deepEqual(getFrameGroups(detached), [])
  assert.deepEqual(getPlacement(detached, drawing), {
    surface: 'background',
    x: 420,
    y: 360,
  })
  assert.deepEqual(getPlacement(detached, window), {
    surface: 'frame',
    edge: 'left',
    position: 0.4,
  })
  const ungrouped = ungroupFrameTarget(layout, {
    kind: 'group',
    id: getTargetGroup(layout, window)!.id,
  })
  assert.deepEqual(
    getPlacement(ungrouped, drawing),
    getPlacement(ungrouped, window),
  )
})

test('changing the tools hiding preference does not detach visible tools from their group', () => {
  const grouped = mergeFrameTargets(defaults, tools, apps)
  const changed = setAllowHideTools(grouped, true)
  assert.deepEqual(getFrameGroups(changed), getFrameGroups(grouped))
  assert.deepEqual(
    getFrameGroups(setAllowHideTools(changed, false)),
    getFrameGroups(grouped),
  )
})

test('group and per-widget detail preferences survive a saved-layout round trip', () => {
  let layout = mergeFrameTargets(loadedDefaults, notifications, clock, true)
  layout = setWidgetExpanded(layout, 'notifications', false)
  layout = setWidgetExpanded(layout, 'battery', true)
  saveFrameLayout(layout)
  assert.deepEqual(loadFrameLayout(), layout)
  assert.equal(getWidgetExpanded(layout, 'clock'), true)
  assert.equal(getWidgetExpanded(layout, 'notifications'), false)
  assert.equal(getWidgetExpanded(layout, 'battery'), true)
  assert.equal(getWidgetExpanded(layout, 'wifi'), false)
})

test('the former battery percentage preference migrates without replacing a new detail choice', () => {
  storage.set('hearthspace-battery-percentage-v1', 'true')
  storage.set(FRAME_LAYOUT_STORAGE_KEY, JSON.stringify(defaults))
  assert.equal(getWidgetExpanded(loadFrameLayout(), 'battery'), true)
  saveFrameLayout(setWidgetExpanded(loadFrameLayout(), 'battery', false))
  assert.equal(getWidgetExpanded(loadFrameLayout(), 'battery'), false)
  storage.delete('hearthspace-battery-percentage-v1')
})

test('malformed groups cannot duplicate an attachment, nest groups, or retain invalid placements', () => {
  storage.set(
    FRAME_LAYOUT_STORAGE_KEY,
    JSON.stringify({
      placements: {
        'group:good': { surface: 'frame', edge: 'left', position: 0.5 },
        'group:other': { surface: 'frame', edge: 'bottom', position: 0.3 },
        'group:orphan': { surface: 'frame', edge: 'right', position: 0.5 },
        'group:invalid': { surface: 'frame', edge: 'middle', position: 0.5 },
      },
      groups: {
        good: {
          id: 'good',
          members: [clock, wifi, clock, { kind: 'group', id: 'other' }],
        },
        other: { id: 'other', members: [wifi, battery] },
        invalid: {
          id: 'invalid',
          members: [
            { kind: 'group', id: 'good' },
            { kind: 'widget', id: 'missing' },
          ],
        },
      },
      expanded: { battery: true, clock: 'true', missing: true },
    }),
  )
  const layout = loadFrameLayout()
  assert.deepEqual(getFrameGroups(layout), [
    { id: 'good', members: [clock, wifi] },
  ])
  assert.deepEqual(getPlacement(layout, battery), {
    surface: 'frame',
    edge: 'bottom',
    position: 0.3,
  })
  assert.deepEqual(Object.keys(layout.placements).sort(), [
    'group:good',
    'widget:battery',
  ])
  assert.deepEqual(layout.expanded, { battery: true })
})

test('edge attachment maps each position along the usable viewport span', () => {
  const viewport = { width: 1000, height: 800 }
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'top', position: 0 },
      200,
      100,
      viewport,
    ),
    { x: 24, y: 0, width: 200, height: 100 },
  )
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'bottom', position: 1 },
      200,
      100,
      viewport,
    ),
    { x: 776, y: 700, width: 200, height: 100 },
  )
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'left', position: 0.5 },
      200,
      100,
      viewport,
    ),
    { x: 0, y: 350, width: 200, height: 100 },
  )
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'right', position: 0.5 },
      200,
      100,
      viewport,
    ),
    { x: 800, y: 350, width: 200, height: 100 },
  )
})

test('padded controls align their corner and edge spacing on desktop and mobile', () => {
  for (const { viewport, inset } of [
    { viewport: { width: 1000, height: 800 }, inset: 24 },
    { viewport: { width: 390, height: 844 }, inset: 12 },
  ]) {
    for (const edge of ['top', 'right', 'bottom', 'left'] as const) {
      const bounds = getFrameBounds(
        { surface: 'frame', edge, position: 0 },
        54,
        54,
        viewport,
        'padded',
      )
      assert.equal(
        bounds.x,
        edge === 'right' ? viewport.width - 54 - inset : inset,
      )
      assert.equal(
        bounds.y,
        edge === 'bottom' ? viewport.height - 54 - inset : inset,
      )
    }
  }
})

test('attachments fit inside a smaller viewport without losing their edge', () => {
  assert.deepEqual(
    getFrameBounds(
      { surface: 'frame', edge: 'bottom', position: 1 },
      480,
      300,
      { width: 390, height: 844 },
    ),
    { x: 12, y: 544, width: 366, height: 300 },
  )
  assert.deepEqual(
    getFrameBounds({ surface: 'frame', edge: 'right', position: 0 }, 480, 300, {
      width: 390,
      height: 200,
    }),
    { x: 24, y: 12, width: 366, height: 176 },
  )
})

test('collapsed pinned windows expose a 42px strip on their attached edge', () => {
  const viewport = { width: 1000, height: 800 }
  const bounds = { x: 24, y: 24, width: 400, height: 300 }
  const left = getPinnedWindowOffset(bounds, 'left', viewport, false)
  assert.deepEqual(left, { x: -382, y: 0 })
  assert.equal(bounds.x + left.x + bounds.width, 42)

  const right = getPinnedWindowOffset(bounds, 'right', viewport, false)
  assert.deepEqual(right, { x: 934, y: 0 })
  assert.equal(viewport.width - (bounds.x + right.x), 42)

  const top = getPinnedWindowOffset(bounds, 'top', viewport, false)
  assert.deepEqual(top, { x: 0, y: -282 })
  assert.equal(bounds.y + top.y + bounds.height, 42)

  const bottom = getPinnedWindowOffset(bounds, 'bottom', viewport, false)
  assert.deepEqual(bottom, { x: 0, y: 734 })
  assert.equal(viewport.height - (bounds.y + bottom.y), 42)
})

test('opening a pinned window restores its fitted frame bounds on every edge', () => {
  const viewport = { width: 1000, height: 800 }
  for (const edge of ['top', 'right', 'bottom', 'left'] as const) {
    const bounds = getFrameBounds(
      { surface: 'frame', edge, position: 0.5 },
      400,
      300,
      viewport,
    )
    assert.deepEqual(getPinnedWindowOffset(bounds, edge, viewport, true), {
      x: 0,
      y: 0,
    })
  }
})

test('hovering can expose more of a pinned window without opening it fully', () => {
  const bounds = { x: 24, y: 24, width: 400, height: 300 }
  const viewport = { width: 1000, height: 800 }
  const preview = getPinnedWindowOffset(bounds, 'left', viewport, false, 100)
  assert.equal(bounds.x + preview.x + bounds.width, 100)
  assert.ok(bounds.x + preview.x < 0)
  assert.deepEqual(getPinnedWindowOffset(bounds, 'left', viewport, true, 100), {
    x: 0,
    y: 0,
  })
})

test('peek distance never exposes more than the attached window dimension', () => {
  const bounds = { x: 24, y: 24, width: 80, height: 60 }
  const viewport = { width: 1000, height: 800 }
  const right = getPinnedWindowOffset(bounds, 'right', viewport, false, 100)
  assert.equal(viewport.width - bounds.x - right.x, bounds.width)
  const bottom = getPinnedWindowOffset(bounds, 'bottom', viewport, false, 100)
  assert.equal(viewport.height - bounds.y - bottom.y, bounds.height)
})

test('the dragged object can reach the frame while the pointer stays far from it', () => {
  assert.deepEqual(
    getFrameDropTarget(
      { x: 310, y: 450, width: 500, height: 300 },
      { width: 1000, height: 800 },
    ),
    {
      surface: 'frame',
      edge: 'bottom',
      position: (310 - 24) / (1000 - 48 - 500),
    },
  )
  assert.equal(
    getFrameDropTarget(
      { x: 200, y: 200, width: 200, height: 200 },
      { width: 1000, height: 800 },
    ),
    null,
  )
})

test('frame drops prefer the closest object edge and snap near the corners', () => {
  assert.deepEqual(
    getFrameDropTarget(
      { x: 100, y: 35, width: 200, height: 150 },
      { width: 1000, height: 800 },
    ),
    { surface: 'frame', edge: 'top', position: 0 },
  )
  assert.deepEqual(
    getFrameDropTarget(
      { x: 730, y: 35, width: 200, height: 150 },
      { width: 1000, height: 800 },
    ),
    { surface: 'frame', edge: 'top', position: 1 },
  )
  assert.deepEqual(
    getFrameDropTarget(
      { x: -20, y: 120, width: 200, height: 150 },
      { width: 1000, height: 800 },
    ),
    { surface: 'frame', edge: 'left', position: (120 - 24) / (800 - 48 - 150) },
  )
  assert.deepEqual(
    getFrameDropTarget(
      { x: 790, y: 560, width: 200, height: 150 },
      { width: 1000, height: 800 },
    ),
    { surface: 'frame', edge: 'right', position: 1 },
  )
})

test('full-width mobile attachments produce a finite centered drop position', () => {
  assert.deepEqual(
    getFrameDropTarget(
      { x: 12, y: -10, width: 366, height: 54 },
      { width: 390, height: 844 },
    ),
    { surface: 'frame', edge: 'top', position: 0.5 },
  )
})

test('the Frame action finds the nearest edge even outside the drag attachment distance', () => {
  const bounds = { x: 260, y: 240, width: 200, height: 160 }
  const viewport = { width: 1000, height: 800 }
  assert.equal(getFrameDropTarget(bounds, viewport), null)
  assert.deepEqual(getFrameDropTarget(bounds, viewport, Infinity), {
    surface: 'frame',
    edge: 'top',
    position: (260 - 24) / (1000 - 48 - 200),
  })
})

test('turning a widget near the left edge does not switch its target to the top edge', () => {
  const viewport = { width: 1000, height: 800 }
  const horizontal = {
    x: 90 - 299 / 2,
    y: 160 - 54 / 2,
    width: 299,
    height: 54,
  }
  const vertical = { x: 90 - 54 / 2, y: 160 - 299 / 2, width: 54, height: 299 }
  const target = getWidgetFrameDropTarget(horizontal, viewport)
  assert.equal(target?.edge, 'left')
  assert.deepEqual(getWidgetFrameDropTarget(vertical, viewport), target)
})

test('turning a widget near the top edge does not switch its target to the left edge', () => {
  const viewport = { width: 1000, height: 800 }
  const horizontal = {
    x: 160 - 299 / 2,
    y: 90 - 54 / 2,
    width: 299,
    height: 54,
  }
  const vertical = { x: 160 - 54 / 2, y: 90 - 299 / 2, width: 54, height: 299 }
  const target = getWidgetFrameDropTarget(horizontal, viewport)
  assert.equal(target?.edge, 'top')
  assert.deepEqual(getWidgetFrameDropTarget(vertical, viewport), target)
})

test('a widget keeps its corner snap through an orientation change', () => {
  const viewport = { width: 1000, height: 800 }
  const horizontal = { x: 90 - 299 / 2, y: 90 - 54 / 2, width: 299, height: 54 }
  const vertical = { x: 90 - 54 / 2, y: 90 - 299 / 2, width: 54, height: 299 }
  const target = { surface: 'frame', edge: 'top', position: 0 }
  assert.deepEqual(getWidgetFrameDropTarget(horizontal, viewport), target)
  assert.deepEqual(getWidgetFrameDropTarget(vertical, viewport), target)
})

for (const corner of [
  { name: 'top-left', x: 90, y: 90, horizontal: 'top', vertical: 'left' },
  { name: 'top-right', x: 910, y: 90, horizontal: 'top', vertical: 'right' },
  {
    name: 'bottom-left',
    x: 90,
    y: 710,
    horizontal: 'bottom',
    vertical: 'left',
  },
  {
    name: 'bottom-right',
    x: 910,
    y: 710,
    horizontal: 'bottom',
    vertical: 'right',
  },
] as const) {
  test(`a horizontal toolbar stays horizontal when previewed and dropped in the ${corner.name} corner`, () => {
    const viewport = { width: 1000, height: 800 }
    const bounds = {
      x: corner.x - 299 / 2,
      y: corner.y - 54 / 2,
      width: 299,
      height: 54,
    }
    const expected = {
      surface: 'frame',
      edge: corner.horizontal,
      position: corner.vertical === 'left' ? 0 : 1,
    }
    for (const currentEdge of ['top', 'bottom'] as const) {
      assert.deepEqual(
        getWidgetFrameDropTarget(bounds, viewport, 72, currentEdge),
        expected,
      )
      assert.deepEqual(
        getWidgetFrameDropTarget(bounds, viewport, Infinity, currentEdge),
        expected,
      )
    }
  })

  test(`a vertical toolbar stays vertical when previewed and dropped in the ${corner.name} corner`, () => {
    const viewport = { width: 1000, height: 800 }
    const bounds = {
      x: corner.x - 54 / 2,
      y: corner.y - 299 / 2,
      width: 54,
      height: 299,
    }
    const expected = {
      surface: 'frame',
      edge: corner.vertical,
      position: corner.horizontal === 'top' ? 0 : 1,
    }
    for (const currentEdge of ['left', 'right'] as const) {
      assert.deepEqual(
        getWidgetFrameDropTarget(bounds, viewport, 72, currentEdge),
        expected,
      )
      assert.deepEqual(
        getWidgetFrameDropTarget(bounds, viewport, Infinity, currentEdge),
        expected,
      )
    }
  })
}

test('a toolbar still changes orientation when entering an edge away from a corner', () => {
  const viewport = { width: 1000, height: 800 }
  assert.deepEqual(
    getWidgetFrameDropTarget(
      { x: 90 - 299 / 2, y: 400 - 54 / 2, width: 299, height: 54 },
      viewport,
      72,
      'top',
    ),
    { surface: 'frame', edge: 'left', position: 0.5 },
  )
  assert.deepEqual(
    getWidgetFrameDropTarget(
      { x: 500 - 54 / 2, y: 90 - 299 / 2, width: 54, height: 299 },
      viewport,
      72,
      'left',
    ),
    { surface: 'frame', edge: 'top', position: 0.5 },
  )
})

test('interior widgets stay on the canvas unless explicitly attached to the nearest edge', () => {
  const viewport = { width: 1000, height: 800 }
  const horizontal = {
    x: 250 - 299 / 2,
    y: 350 - 54 / 2,
    width: 299,
    height: 54,
  }
  const vertical = { x: 250 - 54 / 2, y: 350 - 299 / 2, width: 54, height: 299 }
  assert.equal(getWidgetFrameDropTarget(horizontal, viewport), null)
  assert.equal(getWidgetFrameDropTarget(vertical, viewport), null)
  const target = getWidgetFrameDropTarget(horizontal, viewport, Infinity)
  assert.equal(target?.edge, 'left')
  assert.deepEqual(
    getWidgetFrameDropTarget(vertical, viewport, Infinity),
    target,
  )
})

test('collapsed windows detach using their exposed strip instead of their offscreen body', () => {
  const viewport = { width: 1000, height: 800 }
  const previews = [
    { x: -308, y: 200, width: 350, height: 360 },
    { x: 958, y: 200, width: 350, height: 360 },
    { x: 300, y: -318, width: 350, height: 360 },
    { x: 300, y: 758, width: 350, height: 360 },
  ]
  for (const preview of previews) {
    const grabbed = getFrameDragBounds(preview, viewport)
    assert.equal(Math.min(grabbed.width, grabbed.height), 42)
    const interior = { ...grabbed, x: 300, y: 200 }
    assert.equal(getFrameDropTarget(interior, viewport), null)
    assert.equal(
      getFrameDropTarget({ ...interior, x: 20 }, viewport)?.edge,
      'left',
    )
  }
})
