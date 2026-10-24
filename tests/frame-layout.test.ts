import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getFrameBounds,
  getFrameCornerAtPointer,
  getFrameDragBounds,
  getFrameDropTarget,
  getFrameGroups,
  getPlacement,
  getPinnedWindowOffset,
  getTargetGroup,
  getWidgetExpanded,
  getWidgetFrameDropTarget,
  readFrameLayout,
  mergeFrameTargets,
  setAllowHideTools,
  setObjectPlacement,
  setWidgetExpanded,
  ungroupFrameTarget,
  type FrameLayout,
  type ObjectPlacement,
} from '../src/frame-layout.ts'

const defaults: FrameLayout = { placements: {}, allowHideTools: false }
const tools = { kind: 'widget', id: 'tools' } as const
const notifications = { kind: 'widget', id: 'notifications' } as const
const clock = { kind: 'widget', id: 'clock' } as const
const wifi = { kind: 'widget', id: 'wifi' } as const
const bluetooth = { kind: 'widget', id: 'bluetooth' } as const
const volume = { kind: 'widget', id: 'volume' } as const
const battery = { kind: 'widget', id: 'battery' } as const
const power = { kind: 'widget', id: 'power' } as const
const apps = { kind: 'widget', id: 'apps' } as const
const defaultSystemGroup = {
  id: 'system',
  members: [clock, wifi, bluetooth, volume, battery, power],
}
const loadedDefaults: FrameLayout = {
  ...defaults,
  placements: {
    'group:system': { surface: 'frame', edge: 'top', position: 1 },
  },
  groups: { system: defaultSystemGroup },
}
const legacySystemGroup = {
  id: 'system',
  members: [clock, wifi, volume, battery],
}
const legacyDefaults: FrameLayout = {
  ...loadedDefaults,
  groups: { system: legacySystemGroup },
}
const powerSystemGroup = {
  id: 'system',
  members: [clock, wifi, volume, battery, power],
}
const powerDefaults: FrameLayout = {
  ...loadedDefaults,
  groups: { system: powerSystemGroup },
}

test('moving a detached toolbar retains its measured body while discarding the prior peek home', () => {
  const before = setObjectPlacement(defaults, tools, {
    surface: 'canvas',
    x: 150,
    y: 120,
    width: 307,
    height: 64,
    peekOrigin: { x: 180, y: 180 },
  })
  const first = setObjectPlacement(before, tools, {
    surface: 'canvas',
    x: 500,
    y: 400,
  })
  const second = setObjectPlacement(first, tools, {
    surface: 'canvas',
    x: 520,
    y: 420,
  })
  assert.deepEqual(getPlacement(second, tools), {
    surface: 'canvas',
    x: 520,
    y: 420,
    width: 307,
    height: 64,
  })
  const turned = setObjectPlacement(second, tools, {
    surface: 'canvas',
    x: 520,
    y: 420,
    width: 64,
    height: 307,
  })
  assert.deepEqual(getPlacement(turned, tools), {
    surface: 'canvas',
    x: 520,
    y: 420,
    width: 64,
    height: 307,
  })
})

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
      surface: kind === 'window' ? 'canvas' : 'background',
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
      'drawing:my:sketch': { surface: 'background', x: 4500, y: 3700 },
    },
  }
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(layout))), layout)
})

test('invalid entries do not discard valid placements or hide protected tools', () => {
  const layout = readFrameLayout({
    allowHideTools: 'true',
    placements: {
      'widget:tools': { surface: 'hidden' },
      'widget:wifi': { surface: 'frame', edge: 'right', position: 4 },
      'drawing:sketch': { surface: 'frame', edge: 'top', position: -2 },
      'window:missing-edge': { surface: 'frame', position: 0.5 },
      'window:wrong-edge': { surface: 'frame', edge: 'middle', position: 0 },
      'window:infinite': { surface: 'frame', edge: 'top', position: Infinity },
      'item:bad-coordinate': { surface: 'background', x: '10' },
      'item:non-finite': { surface: 'canvas', y: NaN },
      'item:hidden': { surface: 'hidden' },
      'widget:unknown': { surface: 'frame', edge: 'top', position: 0 },
      'unknown:item': { surface: 'canvas' },
      'window:': { surface: 'canvas' },
    },
    groups: {},
  })
  assert.deepEqual(layout, {
    allowHideTools: false,
    placements: {
      'widget:tools': { surface: 'frame', edge: 'bottom', position: 0 },
      'widget:wifi': { surface: 'frame', edge: 'right', position: 1 },
      'item:hidden': { surface: 'background' },
    },
    groups: {},
  })
})

test('absent or invalid layout data restores the default status group', () => {
  assert.deepEqual(readFrameLayout(undefined), loadedDefaults)
  assert.deepEqual(readFrameLayout(null), loadedDefaults)
  assert.deepEqual(readFrameLayout('invalid'), loadedDefaults)
  const layout = readFrameLayout(undefined)
  assert.deepEqual(getFrameGroups(layout), [defaultSystemGroup])
  for (const member of defaultSystemGroup.members)
    assert.deepEqual(getPlacement(layout, member), {
      surface: 'frame',
      edge: 'top',
      position: 1,
    })
})

test('the old four-item default status group gains Bluetooth and Power once and preserves its saved options', () => {
  const layout = readFrameLayout({
    ...legacyDefaults,
    expanded: { clock: false, battery: true },
  })
  assert.deepEqual(layout, {
    ...loadedDefaults,
    expanded: { clock: false, battery: true },
  })
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(layout))), layout)
  assert.deepEqual(legacyDefaults.groups?.system, legacySystemGroup)
})

test('the five-item default status group gains Bluetooth once and preserves its saved options', () => {
  const layout = readFrameLayout({
    ...powerDefaults,
    expanded: { clock: false, battery: true },
    options: { 'widget:clock': { dateFormat: 'weekday' } },
  })
  assert.deepEqual(layout, {
    ...loadedDefaults,
    expanded: { clock: false, battery: true },
    options: { 'widget:clock': { dateFormat: 'weekday' } },
  })
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(layout))), layout)
  assert.deepEqual(powerDefaults.groups?.system, powerSystemGroup)
})

test('customized old status groups stay intact with Bluetooth and Power separately at distinct top positions', () => {
  const variants: FrameLayout[] = [
    { ...legacyDefaults, groups: {} },
    {
      ...legacyDefaults,
      groups: {
        system: { id: 'system', members: [wifi, clock, volume, battery] },
      },
    },
    {
      ...legacyDefaults,
      groups: { system: { id: 'system', members: [clock, wifi, volume] } },
    },
    {
      ...legacyDefaults,
      groups: {
        system: {
          id: 'system',
          members: [clock, wifi, volume, battery, notifications],
        },
      },
    },
    {
      ...legacyDefaults,
      groups: { custom: { id: 'custom', members: legacySystemGroup.members } },
      placements: { 'group:custom': legacyDefaults.placements['group:system'] },
    },
    {
      ...legacyDefaults,
      placements: {
        'group:system': { surface: 'frame', edge: 'bottom', position: 1 },
      },
    },
    {
      ...legacyDefaults,
      placements: {
        'group:system': { surface: 'frame', edge: 'top', position: 0.7 },
      },
    },
  ]
  for (const saved of variants) {
    const layout = readFrameLayout(saved)
    assert.deepEqual(layout.groups, saved.groups)
    assert.equal(getTargetGroup(layout, power), undefined)
    assert.deepEqual(getPlacement(layout, power), {
      surface: 'frame',
      edge: 'top',
      position: 0.5,
    })
    assert.equal(getTargetGroup(layout, bluetooth), undefined)
    assert.deepEqual(getPlacement(layout, bluetooth), {
      surface: 'frame',
      edge: 'top',
      position: 0.35,
    })
    assert.deepEqual(
      readFrameLayout(JSON.parse(JSON.stringify(layout))),
      layout,
    )
  }
})

test('customized five-item status groups preserve their order, membership, identity, and position', () => {
  const variants: FrameLayout[] = [
    { ...powerDefaults, groups: {}, placements: {} },
    {
      ...powerDefaults,
      groups: {
        system: {
          id: 'system',
          members: [wifi, clock, volume, battery, power],
        },
      },
    },
    {
      ...powerDefaults,
      groups: {
        system: { id: 'system', members: [clock, wifi, volume, power] },
      },
    },
    {
      ...powerDefaults,
      groups: {
        system: {
          id: 'system',
          members: [...powerSystemGroup.members, notifications],
        },
      },
    },
    {
      ...powerDefaults,
      groups: { custom: { id: 'custom', members: powerSystemGroup.members } },
      placements: { 'group:custom': powerDefaults.placements['group:system'] },
    },
    {
      ...powerDefaults,
      placements: {
        'group:system': { surface: 'frame', edge: 'bottom', position: 1 },
      },
    },
    {
      ...powerDefaults,
      placements: {
        'group:system': { surface: 'frame', edge: 'top', position: 0.7 },
      },
    },
  ]
  for (const saved of variants) {
    const layout = readFrameLayout(saved)
    assert.deepEqual(layout, saved)
    assert.equal(getTargetGroup(layout, bluetooth), undefined)
    assert.deepEqual(getPlacement(layout, bluetooth), {
      surface: 'frame',
      edge: 'top',
      position: 0.35,
    })
    assert.deepEqual(
      readFrameLayout(JSON.parse(JSON.stringify(layout))),
      layout,
    )
  }
})

test('normalizing incomplete or malformed groups does not qualify them for the default migration', () => {
  for (const saved of [
    { ...legacyDefaults, placements: {} },
    {
      ...legacyDefaults,
      placements: {
        'group:system': { surface: 'frame', edge: 'top', position: 4 },
      },
    },
    {
      ...legacyDefaults,
      groups: {
        system: {
          id: 'system',
          members: [...legacySystemGroup.members, clock],
        },
      },
    },
    {
      ...legacyDefaults,
      groups: {
        system: {
          id: 'system',
          members: [
            ...legacySystemGroup.members,
            { kind: 'widget', id: 'unknown' },
          ],
        },
      },
    },
  ]) {
    const layout = readFrameLayout(saved)
    assert.deepEqual(getFrameGroups(layout), [legacySystemGroup])
    assert.equal(getTargetGroup(layout, power), undefined)
    assert.equal(getTargetGroup(layout, bluetooth), undefined)
  }
})

test('normalizing an incomplete or malformed five-item group does not add Bluetooth', () => {
  for (const saved of [
    { ...powerDefaults, placements: {} },
    {
      ...powerDefaults,
      placements: {
        'group:system': { surface: 'frame', edge: 'top', position: 4 },
      },
    },
    {
      ...powerDefaults,
      groups: {
        system: { id: 'system', members: [...powerSystemGroup.members, clock] },
      },
    },
    {
      ...powerDefaults,
      groups: {
        system: {
          id: 'system',
          members: [
            ...powerSystemGroup.members,
            { kind: 'widget', id: 'unknown' },
          ],
        },
      },
    },
  ]) {
    const layout = readFrameLayout(saved)
    assert.deepEqual(getFrameGroups(layout), [powerSystemGroup])
    assert.equal(getTargetGroup(layout, bluetooth), undefined)
  }
})

test('an explicit Bluetooth placement stays separate from the five-item default after reloading', () => {
  const placements: ObjectPlacement[] = [
    { surface: 'hidden' },
    { surface: 'frame', edge: 'left', position: 0.3 },
    { surface: 'canvas', x: 120, y: 240, width: 96, height: 54 },
    { surface: 'background', x: 320, y: 440 },
  ]
  for (const placement of placements) {
    const saved: FrameLayout = {
      ...powerDefaults,
      placements: {
        ...powerDefaults.placements,
        'widget:bluetooth': placement,
      },
    }
    const layout = readFrameLayout(saved)
    assert.deepEqual(layout, saved)
    assert.equal(getTargetGroup(layout, bluetooth), undefined)
    assert.deepEqual(getPlacement(layout, bluetooth), placement)
    const moved = setObjectPlacement(
      readFrameLayout(undefined),
      bluetooth,
      placement,
    )
    assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(moved))), moved)
  }
})

test('Bluetooth in another saved group stays there regardless of group order', () => {
  const custom = { id: 'custom', members: [apps, bluetooth] }
  for (const groups of [
    { system: powerSystemGroup, custom },
    { custom, system: powerSystemGroup },
  ]) {
    const saved: FrameLayout = {
      ...powerDefaults,
      groups,
      placements: {
        ...powerDefaults.placements,
        'group:custom': { surface: 'frame', edge: 'bottom', position: 0.4 },
      },
    }
    const layout = readFrameLayout(saved)
    assert.deepEqual(layout, saved)
    assert.deepEqual(getTargetGroup(layout, bluetooth), custom)
    assert.deepEqual(
      readFrameLayout(JSON.parse(JSON.stringify(layout))),
      layout,
    )
  }
})

test('an explicit hidden Bluetooth control still allows the old Power migration', () => {
  const layout = readFrameLayout({
    ...legacyDefaults,
    placements: {
      ...legacyDefaults.placements,
      'widget:bluetooth': { surface: 'hidden' },
    },
  })
  assert.deepEqual(getFrameGroups(layout), [powerSystemGroup])
  assert.deepEqual(getPlacement(layout, bluetooth), { surface: 'hidden' })
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(layout))), layout)
})

test('an explicit Power placement keeps it out of the old default group after reloading', () => {
  const placements: ObjectPlacement[] = [
    { surface: 'hidden' },
    { surface: 'frame', edge: 'left', position: 0.3 },
    { surface: 'canvas', x: 120, y: 240 },
  ]
  for (const placement of placements) {
    const saved: FrameLayout = {
      ...legacyDefaults,
      placements: { ...legacyDefaults.placements, 'widget:power': placement },
    }
    const layout = readFrameLayout(saved)
    assert.deepEqual(layout, saved)
    assert.equal(getTargetGroup(layout, power), undefined)
    assert.deepEqual(getPlacement(layout, power), placement)
    const moved = setObjectPlacement(
      readFrameLayout(legacyDefaults),
      power,
      placement,
    )
    assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(moved))), moved)
  }
})

test('Power in another saved group stays there regardless of group order', () => {
  const custom = { id: 'custom', members: [apps, power] }
  for (const groups of [
    { system: legacySystemGroup, custom },
    { custom, system: legacySystemGroup },
  ]) {
    const saved: FrameLayout = {
      ...legacyDefaults,
      groups,
      placements: {
        ...legacyDefaults.placements,
        'group:custom': { surface: 'frame', edge: 'bottom', position: 1 },
      },
    }
    const layout = readFrameLayout(saved)
    assert.deepEqual(layout, saved)
    assert.deepEqual(getTargetGroup(layout, power), custom)
  }
})

test('restoring missing groups respects an explicitly hidden Power control', () => {
  const layout = readFrameLayout({
    placements: { 'widget:power': { surface: 'hidden' } },
  })
  assert.deepEqual(getFrameGroups(layout), [
    { id: 'system', members: [clock, wifi, bluetooth, volume, battery] },
  ])
  assert.equal(getTargetGroup(layout, power), undefined)
  assert.deepEqual(getPlacement(layout, power), { surface: 'hidden' })
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(layout))), layout)
})

test('restoring missing groups respects an explicitly hidden Bluetooth control', () => {
  const layout = readFrameLayout({
    placements: { 'widget:bluetooth': { surface: 'hidden' } },
  })
  assert.deepEqual(getFrameGroups(layout), [powerSystemGroup])
  assert.equal(getTargetGroup(layout, bluetooth), undefined)
  assert.deepEqual(getPlacement(layout, bluetooth), { surface: 'hidden' })
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(layout))), layout)
})

test('restoring missing groups preserves both hidden Bluetooth and Power controls', () => {
  const layout = readFrameLayout({
    placements: {
      'widget:bluetooth': { surface: 'hidden' },
      'widget:power': { surface: 'hidden' },
    },
  })
  assert.deepEqual(getFrameGroups(layout), [legacySystemGroup])
  assert.deepEqual(getPlacement(layout, bluetooth), { surface: 'hidden' })
  assert.deepEqual(getPlacement(layout, power), { surface: 'hidden' })
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(layout))), layout)
})

test('Bluetooth detail starts collapsed and persists explicit expanded and collapsed choices', () => {
  assert.equal(getWidgetExpanded(loadedDefaults, 'bluetooth'), false)
  const expanded = setWidgetExpanded(loadedDefaults, 'bluetooth', true)
  assert.equal(getWidgetExpanded(expanded, 'bluetooth'), true)
  assert.deepEqual(
    readFrameLayout(JSON.parse(JSON.stringify(expanded))),
    expanded,
  )
  const collapsed = setWidgetExpanded(expanded, 'bluetooth', false)
  assert.equal(getWidgetExpanded(collapsed, 'bluetooth'), false)
  assert.deepEqual(
    readFrameLayout(JSON.parse(JSON.stringify(collapsed))),
    collapsed,
  )
})

test('Power remains icon-only when expanded detail preferences are requested or loaded', () => {
  assert.equal(getWidgetExpanded(loadedDefaults, 'power'), false)
  assert.equal(setWidgetExpanded(loadedDefaults, 'power', true), loadedDefaults)
  const layout = readFrameLayout({
    ...loadedDefaults,
    expanded: { power: true },
  })
  assert.equal(getWidgetExpanded(layout, 'power'), false)
  assert.deepEqual(layout.expanded, {})
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
      members: [tools, apps, clock, wifi, bluetooth, volume, battery, power],
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
  assert.deepEqual(getFrameGroups(layout)[0]!.members, [
    clock,
    bluetooth,
    volume,
    battery,
    power,
  ])
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
    bluetooth,
    volume,
    battery,
    power,
  ])
  assert.deepEqual(getTargetGroup(moved, apps)?.members, [wifi, apps, tools])
  assert.deepEqual(getPlacement(moved, wifi), {
    surface: 'frame',
    edge: 'bottom',
    position: 1,
  })
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(moved))), moved)
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
    bluetooth,
    volume,
    power,
  ])
  const item = { kind: 'item', id: 'projects' } as const
  const inserted = mergeFrameTargets(reordered, item, wifi)
  assert.deepEqual(getFrameGroups(inserted)[0]!.members, [
    battery,
    clock,
    wifi,
    item,
    bluetooth,
    volume,
    power,
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
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(layout))), layout)
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

test('drawings cannot join or receive frame groups, while windows still can', () => {
  const window = { kind: 'window', id: 'notes' } as const
  const drawing = { kind: 'drawing', id: 'sketch' } as const
  const grouped = mergeFrameTargets(defaults, window, apps)
  const pinned = setObjectPlacement(grouped, drawing, {
    surface: 'pinned',
    x: 240,
    y: 180,
  })
  assert.equal(mergeFrameTargets(pinned, drawing, apps), pinned)
  assert.equal(mergeFrameTargets(pinned, apps, drawing), pinned)
  assert.deepEqual(getTargetGroup(pinned, apps)?.members, [apps, window])
  assert.equal(getTargetGroup(pinned, drawing), undefined)
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(pinned))), pinned)
})

test('removing a mixed group returns windows to the canvas without affecting drawings', () => {
  const window = { kind: 'window', id: 'notes' } as const
  const drawing = { kind: 'drawing', id: 'sketch' } as const
  const layout = mergeFrameTargets(defaults, window, apps)
  const removed = setObjectPlacement(
    layout,
    { kind: 'group', id: getTargetGroup(layout, apps)!.id },
    { surface: 'hidden' },
  )
  assert.deepEqual(getFrameGroups(removed), [])
  assert.deepEqual(getPlacement(removed, window), { surface: 'canvas' })
  assert.deepEqual(getPlacement(removed, drawing), { surface: 'background' })
  assert.deepEqual(getPlacement(removed, apps), { surface: 'hidden' })
  assert.deepEqual(
    readFrameLayout(JSON.parse(JSON.stringify(removed))),
    removed,
  )
})

test('only drawings accept freeform pinned positions and drawings cannot attach to an edge', () => {
  const drawing = { kind: 'drawing', id: 'sketch' } as const
  const pinned = { surface: 'pinned', x: 420, y: 360 } as const
  const layout = setObjectPlacement(defaults, drawing, pinned)
  assert.deepEqual(getPlacement(layout, drawing), pinned)
  assert.equal(
    setObjectPlacement(layout, drawing, {
      surface: 'frame',
      edge: 'left',
      position: 0.4,
    }),
    layout,
  )
  assert.equal(setObjectPlacement(layout, apps, pinned), layout)
  assert.equal(
    setObjectPlacement(layout, { kind: 'item', id: 'file' }, pinned),
    layout,
  )
  assert.equal(
    setObjectPlacement(layout, { kind: 'window', id: 'notes' }, pinned),
    layout,
  )
  assert.deepEqual(
    readFrameLayout({
      groups: {},
      placements: {
        'drawing:sketch': pinned,
        'drawing:old': { surface: 'frame', edge: 'left', position: 0.4 },
        'widget:apps': pinned,
        'item:file': pinned,
        'window:notes': pinned,
        'drawing:invalid': { surface: 'pinned', x: Infinity, y: 1 },
        'drawing:missing': { surface: 'pinned', x: 10 },
      },
    }).placements,
    { 'drawing:sketch': pinned },
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
  assert.deepEqual(readFrameLayout(JSON.parse(JSON.stringify(layout))), layout)
  assert.equal(getWidgetExpanded(layout, 'clock'), true)
  assert.equal(getWidgetExpanded(layout, 'notifications'), false)
  assert.equal(getWidgetExpanded(layout, 'battery'), true)
  assert.equal(getWidgetExpanded(layout, 'wifi'), false)
})

test('malformed groups cannot duplicate an attachment, nest groups, or retain invalid placements', () => {
  const layout = readFrameLayout({
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
  })
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

test('frame drops preserve positions near corners without an extra snap margin', () => {
  assert.deepEqual(
    getFrameDropTarget(
      { x: 100, y: 35, width: 200, height: 150 },
      { width: 1000, height: 800 },
    ),
    { surface: 'frame', edge: 'top', position: (100 - 24) / (1000 - 48 - 200) },
  )
  assert.deepEqual(
    getFrameDropTarget(
      { x: 730, y: 35, width: 200, height: 150 },
      { width: 1000, height: 800 },
    ),
    { surface: 'frame', edge: 'top', position: (730 - 24) / (1000 - 48 - 200) },
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
    {
      surface: 'frame',
      edge: 'right',
      position: (560 - 24) / (800 - 48 - 150),
    },
  )
})

for (const corner of [
  { name: 'top-left', left: 8, top: 8, edge: 'top', position: 0 },
  { name: 'top-right', left: 920, top: 8, edge: 'right', position: 0 },
  { name: 'bottom-left', left: 8, top: 720, edge: 'bottom', position: 0 },
  { name: 'bottom-right', left: 920, top: 720, edge: 'right', position: 1 },
] as const) {
  test(`the ${corner.name} snap target matches its visible square on all four sides`, () => {
    const viewport = { width: 1000, height: 800 }
    const centerX = corner.left + 36
    const centerY = corner.top + 36
    for (const [boundary, outside] of [
      [
        { x: corner.left, y: centerY },
        { x: corner.left - 1, y: centerY },
      ],
      [
        { x: corner.left + 72, y: centerY },
        { x: corner.left + 73, y: centerY },
      ],
      [
        { x: centerX, y: corner.top },
        { x: centerX, y: corner.top - 1 },
      ],
      [
        { x: centerX, y: corner.top + 72 },
        { x: centerX, y: corner.top + 73 },
      ],
    ]) {
      assert.equal(getFrameCornerAtPointer(boundary, viewport), corner.name)
      assert.equal(getFrameCornerAtPointer(outside, viewport), null)
    }
    const pointer = { x: centerX, y: centerY }
    assert.deepEqual(
      getFrameDropTarget(
        { x: pointer.x - 12, y: pointer.y - 12, width: 180, height: 120 },
        viewport,
        72,
        pointer,
      ),
      { surface: 'frame', edge: corner.edge, position: corner.position },
    )
  })
}

test('a window stays attached to the side when its pointer enters the corner square', () => {
  assert.deepEqual(
    getFrameDropTarget(
      { x: 0, y: 60, width: 200, height: 150 },
      { width: 1000, height: 800 },
      72,
      { x: 12, y: 72 },
    ),
    { surface: 'frame', edge: 'left', position: 0 },
  )
})

test('corner targets shrink with the visible squares in a narrow viewport', () => {
  const viewport = { width: 160, height: 300 }
  assert.equal(getFrameCornerAtPointer({ x: 72, y: 72 }, viewport), 'top-left')
  assert.equal(getFrameCornerAtPointer({ x: 73, y: 72 }, viewport), null)
  assert.equal(
    getFrameCornerAtPointer({ x: 88, y: 228 }, viewport),
    'bottom-right',
  )
  assert.equal(getFrameCornerAtPointer({ x: 87, y: 228 }, viewport), null)
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
  const horizontal = { x: 45 - 299 / 2, y: 45 - 54 / 2, width: 299, height: 54 }
  const vertical = { x: 45 - 54 / 2, y: 45 - 299 / 2, width: 54, height: 299 }
  const target = { surface: 'frame', edge: 'top', position: 0 }
  assert.deepEqual(getWidgetFrameDropTarget(horizontal, viewport), target)
  assert.deepEqual(getWidgetFrameDropTarget(vertical, viewport), target)
})

for (const corner of [
  { name: 'top-left', x: 45, y: 45, horizontal: 'top', vertical: 'left' },
  { name: 'top-right', x: 955, y: 45, horizontal: 'top', vertical: 'right' },
  {
    name: 'bottom-left',
    x: 45,
    y: 755,
    horizontal: 'bottom',
    vertical: 'left',
  },
  {
    name: 'bottom-right',
    x: 955,
    y: 755,
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

test('a toolbar changes edge when its grab is outside the visible corner square', () => {
  assert.deepEqual(
    getWidgetFrameDropTarget(
      { x: 20, y: 20, width: 299, height: 54 },
      { width: 1000, height: 800 },
      72,
      'left',
      { x: 90, y: 45 },
    ),
    {
      surface: 'frame',
      edge: 'top',
      position: (90 - 27 - 24) / (1000 - 48 - 54),
    },
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

test('loading an old group removes its drawing and retains the neighboring frame attachment', () => {
  const placement = { surface: 'frame', edge: 'left', position: 0.4 } as const
  const layout = readFrameLayout({
    placements: { 'group:art': placement },
    groups: {
      art: { id: 'art', members: [apps, { kind: 'drawing', id: 'sketch' }] },
    },
  })
  assert.deepEqual(getFrameGroups(layout), [])
  assert.deepEqual(getPlacement(layout, apps), placement)
  assert.equal(
    getTargetGroup(layout, { kind: 'drawing', id: 'sketch' }),
    undefined,
  )
  assert.equal('drawing:sketch' in layout.placements, false)
  assert.equal('group:art' in layout.placements, false)
})
