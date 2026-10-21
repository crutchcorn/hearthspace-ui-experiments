import { afterEach, expect, test } from 'vitest'
import { commands, page } from 'vitest/browser'
import { createWorkspace } from '../../src/desktop'
import {
  FRAME_WIDGETS,
  readFrameLayout,
  type FrameEdge,
} from '../../src/frame-layout'
import { createScene, type Scene } from '../../src/scene'
import { SCENE_STORAGE_KEY } from '../../src/scene-storage'
import { renderDesktop } from './desktop'

function preparePinnedWindow(edge: FrameEdge, position: number) {
  const workspace = createWorkspace()
  workspace.windows = workspace.windows.filter(({ id }) => id === 'canvas')
  const layout = readFrameLayout(undefined)
  layout.groups = {}
  for (const { id } of FRAME_WIDGETS)
    if (id !== 'tools')
      layout.placements[`widget:${id}`] = { surface: 'hidden' }
  layout.placements['widget:tools'] = {
    surface: 'canvas',
    x: workspace.home.x + 500,
    y: workspace.home.y + 600,
  }
  layout.placements['window:canvas'] = { surface: 'frame', edge, position }
  localStorage.setItem(
    SCENE_STORAGE_KEY,
    JSON.stringify(createScene(workspace, layout)),
  )
}

function pinnedWindow() {
  return document.querySelector<HTMLElement>('[data-window-id="canvas"]')!
}

function visibleWindowSize() {
  const bounds = pinnedWindow().getBoundingClientRect()
  return {
    width: Math.min(window.innerWidth, bounds.right) - Math.max(0, bounds.left),
    height:
      Math.min(window.innerHeight, bounds.bottom) - Math.max(0, bounds.top),
  }
}

function exposedDepth() {
  const edge = pinnedWindow().dataset.frameEdge
  const visible = visibleWindowSize()
  return edge === 'left' || edge === 'right' ? visible.width : visible.height
}

afterEach(async () => {
  await commands.releasePointer()
})

test.each([
  { corner: 'top-left', edge: 'top', position: 0 },
  { corner: 'top-right', edge: 'right', position: 0 },
  { corner: 'bottom-right', edge: 'bottom', position: 1 },
  { corner: 'bottom-left', edge: 'left', position: 1 },
] as const)(
  'the $corner pinned window stays recessed while previewing its layout',
  async ({ edge, position }) => {
    preparePinnedWindow(edge, position)
    await renderDesktop()
    await page
      .getByRole('button', { name: 'Change layout', exact: true })
      .click()
    await commands.movePointerTo({ x: 640, y: 450 })

    await expect.poll(exposedDepth).toBeCloseTo(42, 0)
    expect(pinnedWindow().dataset.pinnedCollapsed).toBe('true')
    const preview = visibleWindowSize()

    await page.getByRole('button', { name: 'Done changing layout' }).click()
    await expect.poll(exposedDepth).toBeCloseTo(42, 0)
    expect(visibleWindowSize()).toEqual(preview)
  },
)

test('a recessed window can be dragged to another corner and explicitly opened afterward', async () => {
  preparePinnedWindow('top', 0)
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await expect.poll(exposedDepth).toBeCloseTo(42, 0)

  const bounds = pinnedWindow().getBoundingClientRect()
  await commands.startDesktopDrag(
    'Open pinned Files',
    { x: 300, y: 300 },
    { x: 200, y: bounds.height - 21 },
  )
  await expect.poll(() => pinnedWindow().dataset.surface).toBe('canvas')
  const corner = document
    .querySelector<HTMLElement>('[data-frame-guide="bottom-right"]')!
    .getBoundingClientRect()
  await commands.movePointerTo({
    x: corner.left + corner.width / 2,
    y: corner.top + corner.height / 2,
  })
  await commands.releasePointer()
  await commands.movePointerTo({ x: 640, y: 450 })

  await expect.poll(() => pinnedWindow().dataset.surface).toBe('frame')
  await expect.poll(exposedDepth).toBeCloseTo(42, 0)
  await expect
    .poll(() => {
      const scene: Scene | null = JSON.parse(
        localStorage.getItem(SCENE_STORAGE_KEY) ?? 'null',
      )
      const location = scene?.layout.placements['window:canvas']
      return (
        location?.surface === 'frame' &&
        (location.edge === 'bottom' || location.edge === 'right') &&
        location.position === 1
      )
    })
    .toBe(true)

  await page.getByRole('button', { name: 'Done changing layout' }).click()
  await expect.poll(exposedDepth).toBeCloseTo(42, 0)
  await page.getByRole('button', { name: 'Open pinned Files' }).click()
  await expect.poll(visibleWindowSize).toEqual({ width: 480, height: 280 })
})
