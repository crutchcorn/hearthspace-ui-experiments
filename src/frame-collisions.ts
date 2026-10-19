import type { Bounds } from './desktop.ts'
import {
  getPlacement,
  getTargetGroup,
  mergeFrameTargets,
  targetKey,
  type FrameLayout,
  type LayoutTarget,
} from './frame-layout.ts'

type MeasuredFrameItem = { target: LayoutTarget; bounds: Bounds }

function overlaps(a: Bounds, b: Bounds): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

/** Combine intersecting attachments using their measured, pre-merge geometry. */
export function mergeOverlappingFrameItems(
  layout: FrameLayout,
  entries: readonly MeasuredFrameItem[],
): FrameLayout {
  const eligible = entries.filter(({ target, bounds }) => {
    if (target.kind === 'group' && !getTargetGroup(layout, target)) return false
    return (
      getPlacement(layout, target).surface === 'frame' &&
      bounds.width > 0 &&
      bounds.height > 0 &&
      [bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite)
    )
  })
  const listedGroups = new Set(
    eligible
      .filter(({ target }) => target.kind === 'group')
      .map(({ target }) => target.id),
  )
  const seen = new Set<string>()
  const attachments = eligible.filter(({ target }) => {
    const group = getTargetGroup(layout, target)
    if (target.kind !== 'group' && group && listedGroups.has(group.id))
      return false
    const key = targetKey(target)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
  const roots = attachments.map((_, index) => index)
  const root = (index: number): number => {
    while (roots[index] !== index) index = roots[index]
    return index
  }
  for (let i = 0; i < attachments.length; i++) {
    for (let j = i + 1; j < attachments.length; j++) {
      if (!overlaps(attachments[i].bounds, attachments[j].bounds)) continue
      const first = root(i)
      const second = root(j)
      if (first !== second)
        roots[Math.max(first, second)] = Math.min(first, second)
    }
  }
  let next = layout
  for (let i = 0; i < attachments.length; i++) {
    const destination = root(i)
    if (destination === i) continue
    const target = attachments[destination].target
    const group = getTargetGroup(next, target)
    next = mergeFrameTargets(
      next,
      attachments[i].target,
      group ? { kind: 'group', id: group.id } : target,
    )
  }
  return next
}
