import { afterEach, expect, test, vi } from 'vitest'
import { commands, page } from 'vitest/browser'
import { createWorkspace } from '../../src/desktop'
import { FRAME_WIDGETS, type FrameLayout } from '../../src/frame-layout'
import { createScene, type Scene } from '../../src/scene'
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

function pauseToolsMotion() {
  const animations: Animation[] = []
  const animate = Element.prototype.animate
  const spy = vi
    .spyOn(Element.prototype, 'animate')
    .mockImplementation(function (this: Element, keyframes, options) {
      const animation = animate.call(this, keyframes, options)
      if (this.matches('[data-layout-widget="tools"]')) {
        // Keep the real keyframes and easing, but take control of playback
        // before a remote pointer command can outlast the whole animation.
        animation.pause()
        animations.push(animation)
      }
      return animation
    })
  return {
    async sample<T>(read: () => T) {
      await expect.poll(() => animations.length).toBeGreaterThan(0)
      await Promise.all(animations.map((animation) => animation.ready))
      const frames: T[] = []
      for (const progress of [0, 0.25, 0.5, 0.75, 1]) {
        for (const animation of animations) {
          animation.currentTime =
            Number(animation.effect!.getComputedTiming().endTime) * progress
        }
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        )
        frames.push(read())
      }
      return frames
    },
    async resume() {
      spy.mockRestore()
      const active = animations.filter(
        (animation) => animation.playState !== 'idle',
      )
      for (const animation of active) animation.play()
      await Promise.all(active.map((animation) => animation.finished))
      await expect.poll(() => canvasTools().getAnimations().length).toBe(0)
    },
  }
}

afterEach(async () => {
  await commands.releasePointer()
})

test.each([
  {
    corner: 'top-left',
    destinations: [
      { edge: 'top', position: 0 },
      { edge: 'left', position: 0 },
    ],
  },
  {
    corner: 'top-right',
    destinations: [
      { edge: 'top', position: 1 },
      { edge: 'right', position: 0 },
    ],
  },
  {
    corner: 'bottom-left',
    destinations: [
      { edge: 'bottom', position: 0 },
      { edge: 'left', position: 1 },
    ],
  },
  {
    corner: 'bottom-right',
    destinations: [
      { edge: 'bottom', position: 1 },
      { edge: 'right', position: 1 },
    ],
  },
] as const)(
  'an off-center icon grab snaps only inside the visible $corner square',
  async ({ corner, destinations }) => {
    const workspace = createWorkspace()
    workspace.windows = []
    const layout: FrameLayout = {
      allowHideTools: false,
      groups: {},
      placements: {
        ...Object.fromEntries(
          FRAME_WIDGETS.filter((widget) => widget.id !== 'tools').map(
            (widget) => [`widget:${widget.id}`, { surface: 'hidden' }],
          ),
        ),
        'widget:tools': { surface: 'frame', edge: 'bottom', position: 0.5 },
        'item:browser-shortcut': {
          surface: 'frame',
          edge: 'top',
          position: 0.5,
        },
      },
    }
    localStorage.setItem(
      SCENE_STORAGE_KEY,
      JSON.stringify(createScene(workspace, layout)),
    )
    await renderDesktop()
    await page
      .getByRole('button', { name: 'Change layout', exact: true })
      .click()
    const square = document
      .querySelector<HTMLElement>(`[data-frame-guide="${corner}"]`)!
      .getBoundingClientRect()
    const activeGuide = () =>
      document.querySelector<HTMLElement>(
        '[data-frame-guide][data-active="true"]',
      )?.dataset.frameGuide
    const isLeft = corner.endsWith('left')
    const y = square.top + square.height / 2

    await commands.startDesktopDrag('Browser', { x: 0, y: 100 }, { x: 8, y: 8 })
    await commands.movePointerTo({
      x: isLeft ? square.right + 1 : square.left - 1,
      y,
    })
    await expect.poll(activeGuide).toMatch(/^(top|right|bottom|left)$/)

    await commands.movePointerTo({
      x: isLeft ? square.right - 1 : square.left + 1,
      y,
    })
    await expect.poll(activeGuide).toBe(corner)
    await commands.releasePointer()
    await expect
      .poll(() => {
        const scene: Scene | null = JSON.parse(
          localStorage.getItem(SCENE_STORAGE_KEY) ?? 'null',
        )
        const location = scene?.items.find(
          (item) => item.id === 'browser-shortcut',
        )?.location
        return (
          location?.surface === 'frame' &&
          destinations.some(
            ({ edge, position }) =>
              location.edge === edge && location.position === position,
          )
        )
      })
      .toBe(true)
  },
)

test.each([
  { end: 'left', gripX: 22 },
  { end: 'right', gripX: 277 },
])('canvas tools turn around their $end-end grip', async ({ gripX }) => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  const along = gripX / canvasTools().offsetWidth
  await commands.startFrameWidgetDrag('tools', { x: gripX, y: 27 })
  const motion = pauseToolsMotion()
  try {
    await commands.movePointerTo({ x: 45, y: 450 })
    await expect.poll(() => toolsState().edge).toBe('left')
    const frames = await motion.sample(() => ({
      grip: visualGrip(along),
      angle: Math.abs(Number.parseFloat(toolsState().rotate) || 0),
    }))
    expect(frames.some(({ angle }) => angle > 0 && angle < 90)).toBe(true)
    for (const { grip } of frames) {
      expect(grip.x).toBeCloseTo(45, 0)
      expect(grip.y).toBeCloseTo(450, 0)
    }
  } finally {
    await motion.resume()
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

  const motion = pauseToolsMotion()
  try {
    await commands.releasePointer()
    const frames = await motion.sample(toolsState)
    expect(
      frames.some(({ rotate }) => {
        const angle = Math.abs(Number.parseFloat(rotate) || 0)
        return angle > 0 && angle < 90
      }),
    ).toBe(true)
    for (const sampled of frames) {
      expect(sampled.centerX).toBeCloseTo(1050, 0)
      expect(sampled.centerY).toBeCloseTo(650, 0)
    }
  } finally {
    await motion.resume()
  }
  expect(toolsState().offsetWidth).toBeGreaterThan(toolsState().offsetHeight)
  expect(toolsState().surface).toBe('canvas')
})
