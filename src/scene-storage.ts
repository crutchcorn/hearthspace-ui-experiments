import { createWorkspace, readWorkspace } from './desktop.ts'
import { readFrameLayout, type FrameLayout } from './frame-layout.ts'
import { createScene, projectScene, type Scene } from './scene.ts'

export const SCENE_STORAGE_KEY = 'hearthspace-scene-v1'

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validObject(
  value: unknown,
  layout: FrameLayout,
  kind: 'item' | 'drawing',
): boolean {
  if (
    !record(value) ||
    typeof value.id !== 'string' ||
    !value.id ||
    typeof value.width !== 'number' ||
    !Number.isFinite(value.width) ||
    value.width <= 0 ||
    typeof value.height !== 'number' ||
    !Number.isFinite(value.height) ||
    value.height <= 0 ||
    !record(value.location)
  )
    return false
  const location = value.location
  if (location.surface === 'canvas' || location.surface === 'background')
    return (
      typeof location.x === 'number' &&
      Number.isFinite(location.x) &&
      typeof location.y === 'number' &&
      Number.isFinite(location.y)
    )
  if (location.surface === 'frame')
    return (
      ['top', 'right', 'bottom', 'left'].includes(String(location.edge)) &&
      typeof location.position === 'number' &&
      Number.isFinite(location.position) &&
      location.position >= 0 &&
      location.position <= 1
    )
  return (
    location.surface === 'group' &&
    typeof location.groupId === 'string' &&
    Boolean(
      layout.groups &&
      Object.hasOwn(layout.groups, location.groupId) &&
      layout.groups[location.groupId].members.some(
        (member) => member.kind === kind && member.id === value.id,
      ),
    )
  )
}

/** The old split workspace/layout format is intentionally not read. */
export function loadScene(): Scene {
  try {
    const value: unknown = JSON.parse(
      localStorage.getItem(SCENE_STORAGE_KEY) ?? 'null',
    )
    if (
      record(value) &&
      record(value.workspace) &&
      Array.isArray(value.items) &&
      Array.isArray(value.drawings)
    ) {
      const layout = readFrameLayout(value.layout)
      if (
        value.items.every((item) => validObject(item, layout, 'item')) &&
        value.drawings.every((item) => validObject(item, layout, 'drawing'))
      ) {
        const candidate = { ...value, layout } as Scene
        const home = candidate.workspace.home
        const view = {
          x: Number.isFinite(home?.x) ? home.x : 0,
          y: Number.isFinite(home?.y) ? home.y : 0,
          width: typeof window === 'undefined' ? 960 : window.innerWidth,
          height: typeof window === 'undefined' ? 720 : window.innerHeight,
        }
        const projected = projectScene(candidate, view)
        return createScene(readWorkspace(projected.workspace), projected.layout)
      }
    }
  } catch {
    // A malformed or unavailable scene starts a fresh playground.
  }
  return createScene(createWorkspace(), readFrameLayout(undefined))
}

export function saveScene(scene: Scene): void {
  try {
    localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(scene))
  } catch {
    // Keep the playground usable without browser storage.
  }
}
