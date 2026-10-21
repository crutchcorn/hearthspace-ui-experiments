import { expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { createWorkspace } from '../../src/desktop'
import { readFrameLayout, type FrameEdge } from '../../src/frame-layout'
import { createScene } from '../../src/scene'
import { SCENE_STORAGE_KEY } from '../../src/scene-storage'
import { renderDesktop, windowBounds } from './desktop'

function preparePinnedShortcut(edge: FrameEdge, position: number) {
  const layout = readFrameLayout(undefined)
  layout.placements['item:browser-shortcut'] = {
    surface: 'frame',
    edge,
    position,
  }
  localStorage.setItem(
    SCENE_STORAGE_KEY,
    JSON.stringify(createScene(createWorkspace(), layout)),
  )
}

function overlappingPoint(front: Element, back: Element) {
  const first = front.getBoundingClientRect()
  const second = back.getBoundingClientRect()
  const left = Math.max(first.left, second.left)
  const top = Math.max(first.top, second.top)
  const right = Math.min(first.right, second.right)
  const bottom = Math.min(first.bottom, second.bottom)
  if (right <= left || bottom <= top) return null
  return { x: (left + right) / 2, y: (top + bottom) / 2 }
}

function paintsAbove(front: Element, back: Element) {
  const point = overlappingPoint(front, back)
  if (!point) return false
  const stack = document.elementsFromPoint(point.x, point.y)
  const frontIndex = stack.findIndex(
    (element) => element === front || front.contains(element),
  )
  const backIndex = stack.findIndex(
    (element) => element === back || back.contains(element),
  )
  return frontIndex >= 0 && backIndex >= 0 && frontIndex < backIndex
}

test('the grouped Sound popup stays above pinned shortcuts and accepts volume changes', async () => {
  preparePinnedShortcut('right', 0.1)
  await renderDesktop()
  await page.getByRole('button', { name: 'Sound settings' }).click()
  const slider = page.getByRole('slider', { name: 'Sound' })
  const shortcut = page.getByRole('button', { name: 'Browser', exact: true })
  const panel = () => slider.element().closest('[data-system-panel]')!

  await expect.poll(() => paintsAbove(panel(), shortcut.element())).toBe(true)
  const point = overlappingPoint(panel(), shortcut.element())!
  const bounds = panel().getBoundingClientRect()
  await page.elementLocator(panel()).click({
    position: { x: point.x - bounds.x, y: point.y - bounds.y },
  })
  await expect.element(slider).toBeVisible()
  await slider.click()
  await expect.element(slider).toBeVisible()
  await expect
    .poll(() => Number((slider.element() as HTMLInputElement).value))
    .toBeCloseTo(50, 0)
  await expect
    .element(page.getByRole('button', { name: 'Close Browser', exact: true }))
    .not.toBeInTheDocument()
})

test('the grouped Sound popup stays above a pinned window', async () => {
  const layout = readFrameLayout(undefined)
  layout.placements['window:canvas'] = {
    surface: 'frame',
    edge: 'right',
    position: 0.25,
  }
  localStorage.setItem(
    SCENE_STORAGE_KEY,
    JSON.stringify(createScene(createWorkspace(), layout)),
  )
  await renderDesktop()
  await page.getByRole('button', { name: 'Sound settings' }).click()
  const slider = page.getByRole('slider', { name: 'Sound' })
  const panel = () => slider.element().closest('[data-system-panel]')!
  const pinned = page.getByRole('region', { name: 'Files', exact: true })

  await expect.poll(() => paintsAbove(panel(), pinned.element())).toBe(true)
  const point = overlappingPoint(panel(), pinned.element())!
  const bounds = panel().getBoundingClientRect()
  await page.elementLocator(panel()).click({
    position: { x: point.x - bounds.x, y: point.y - bounds.y },
  })
  await expect.element(slider).toBeVisible()
  await expect.element(pinned).toHaveAttribute('data-pinned-collapsed', 'true')
})

test('Overview stays above pinned shortcuts and accepts map navigation where they overlap', async () => {
  preparePinnedShortcut('left', 0.75)
  await renderDesktop()
  const before = windowBounds('Scratchpad')
  await userEvent.keyboard('m')
  const map = page.getByRole('button', { name: 'Navigate the workspace map' })
  const shortcut = page.getByRole('button', { name: 'Browser', exact: true })

  await expect
    .poll(() => paintsAbove(map.element(), shortcut.element()))
    .toBe(true)
  const point = overlappingPoint(map.element(), shortcut.element())!
  const bounds = map.element().getBoundingClientRect()
  await map.click({
    position: { x: point.x - bounds.x, y: point.y - bounds.y },
  })

  await expect
    .poll(() => windowBounds('Scratchpad').x)
    .toBeGreaterThan(before.x + 100)
  await expect.element(map).toBeVisible()
  await expect
    .element(page.getByRole('button', { name: 'Close Browser', exact: true }))
    .not.toBeInTheDocument()
})
