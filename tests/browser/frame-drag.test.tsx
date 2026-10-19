import { afterEach, expect, test } from 'vitest'
import { commands, page } from 'vitest/browser'
import type { Scene } from '../../src/scene'
import { SCENE_STORAGE_KEY } from '../../src/scene-storage'
import { renderDesktop } from './desktop'

function canvasTools() {
  return document.querySelector<HTMLElement>('[data-layout-widget="tools"]')!
}

function toolsState() {
  const element = canvasTools()
  const { x, y, width, height } = element.getBoundingClientRect()
  return {
    surface: element.dataset.layoutSurface,
    edge: element.dataset.frameEdge,
    centerX: x + width / 2,
    centerY: y + height / 2,
    offsetWidth: element.offsetWidth,
    offsetHeight: element.offsetHeight,
    rotate: getComputedStyle(element).rotate,
  }
}

function visualGrip(along: number) {
  const element = canvasTools()
  const width = element.offsetWidth
  const height = element.offsetHeight
  const vertical = height > width
  const style = getComputedStyle(element)
  const [originX, originY] = style.transformOrigin
    .split(' ')
    .map(Number.parseFloat)
  const angle = ((Number.parseFloat(style.rotate) || 0) * Math.PI) / 180
  const cosine = Math.cos(angle)
  const sine = Math.sin(angle)
  function rotate(x: number, y: number) {
    return {
      x: originX + (x - originX) * cosine - (y - originY) * sine,
      y: originY + (x - originX) * sine + (y - originY) * cosine,
    }
  }
  const corners = [
    rotate(0, 0),
    rotate(width, 0),
    rotate(width, height),
    rotate(0, height),
  ]
  const grip = rotate(
    vertical ? width / 2 : width * along,
    vertical ? height * along : height / 2,
  )
  const bounds = element.getBoundingClientRect()
  // Bounding rectangles enclose the rotated shape. Recover its local origin
  // so the assertion observes the gripped point itself throughout the turn.
  return {
    x: bounds.x - Math.min(...corners.map((point) => point.x)) + grip.x,
    y: bounds.y - Math.min(...corners.map((point) => point.y)) + grip.y,
  }
}

afterEach(async () => {
  await commands.releasePointer()
})

test.each([
  { end: 'left', gripX: 22 },
  { end: 'right', gripX: 277 },
])('canvas tools turn around their $end-end grip', async ({ gripX }) => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  const along = gripX / canvasTools().offsetWidth
  await commands.startFrameWidgetDrag('tools', { x: gripX, y: 27 })
  await commands.movePointerTo({ x: 45, y: 450 })
  await expect.poll(() => toolsState().edge).toBe('left')
  const frames: ReturnType<typeof visualGrip>[] = []
  let frame = 0
  function sample() {
    frames.push(visualGrip(along))
    frame = requestAnimationFrame(sample)
  }
  sample()
  try {
    await expect
      .poll(() => canvasTools().getAnimations().length)
      .toBeGreaterThan(0)
    await expect.poll(() => canvasTools().getAnimations().length).toBe(0)
  } finally {
    cancelAnimationFrame(frame)
  }
  expect(frames.length).toBeGreaterThan(1)
  for (const grip of frames) {
    expect(grip.x).toBeCloseTo(45, 0)
    expect(grip.y).toBeCloseTo(450, 0)
  }
  expect(canvasTools().getBoundingClientRect().left).toBeCloseTo(18, 0)
})

test('toolbar edge and corner targets follow an off-center grab', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await commands.startFrameWidgetDrag('tools', { x: 22, y: 27 })
  await commands.movePointerTo({ x: 45, y: 450 })
  await expect.poll(() => toolsState().edge).toBe('left')
  await commands.releasePointer()
  await expect.poll(() => toolsState().surface).toBe('frame')
  expect(toolsState().offsetHeight).toBeGreaterThan(toolsState().offsetWidth)

  await expect.poll(() => toolsState().centerX).toBe(51)
  await commands.startFrameWidgetDrag('tools', { x: 27, y: 277 })
  await commands.movePointerTo({ x: 45, y: 860 })
  await commands.releasePointer()
  await expect.poll(() => toolsState().surface).toBe('frame')
  await expect.poll(() => toolsState().edge).toBe('left')
  await expect
    .poll(() => {
      const bounds = canvasTools().getBoundingClientRect()
      return Math.round(bounds.bottom)
    })
    .toBe(876)
})

test('a toolbar remains on the side when the pointer is above the corner', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await commands.startFrameWidgetDrag('tools', { x: 22, y: 27 })
  await commands.movePointerTo({ x: 45, y: 700 })
  await expect
    .poll(
      () =>
        document.querySelector<HTMLElement>(
          '[data-frame-guide][data-active="true"]',
        )?.dataset.frameGuide,
    )
    .toBe('left')
  await commands.releasePointer()
  await expect.poll(() => toolsState().surface).toBe('frame')
  await expect.poll(() => canvasTools().getAnimations().length).toBe(0)
  expect(toolsState().edge).toBe('left')
  expect(canvasTools().getBoundingClientRect().bottom).toBeLessThan(876)
  await expect
    .poll(() => {
      const scene: Scene | null = JSON.parse(
        localStorage.getItem(SCENE_STORAGE_KEY) ?? 'null',
      )
      const placement = scene?.layout.placements['widget:tools']
      return (
        placement?.surface === 'frame' &&
        placement.edge === 'left' &&
        placement.position > 0 &&
        placement.position < 1
      )
    })
    .toBe(true)
})

test('canvas tools keep their center when a vertical preview returns to a canvas row', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await commands.startFrameWidgetDrag('tools')
  await commands.movePointerTo({ x: 45, y: 450 })
  await expect.poll(() => toolsState().edge).toBe('left')
  await commands.movePointerTo({ x: 1050, y: 650 })
  await expect.poll(() => toolsState().rotate).toBe('none')
  expect(toolsState().offsetHeight).toBeGreaterThan(toolsState().offsetWidth)
  expect(toolsState().centerX).toBeCloseTo(1050)
  expect(toolsState().centerY).toBeCloseTo(650)

  const frames: ReturnType<typeof toolsState>[] = []
  let frame = 0
  function sample() {
    frames.push(toolsState())
    frame = requestAnimationFrame(sample)
  }
  sample()
  try {
    await commands.releasePointer()
    // Wait for the actual turn and snap animations rather than sleeping for
    // their configured duration; sample every presented frame along the way.
    await expect
      .poll(() => canvasTools().getAnimations().length)
      .toBeGreaterThan(0)
    await expect.poll(() => canvasTools().getAnimations().length).toBe(0)
  } finally {
    cancelAnimationFrame(frame)
  }
  expect(toolsState().offsetWidth).toBeGreaterThan(toolsState().offsetHeight)
  expect(toolsState().surface).toBe('canvas')
  for (const sampled of frames) {
    expect(sampled.centerX).toBeCloseTo(1050, 0)
    expect(sampled.centerY).toBeCloseTo(650, 0)
  }
})
