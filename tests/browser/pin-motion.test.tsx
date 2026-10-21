import { afterEach, expect, test, vi } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import { createWorkspace } from '../../src/desktop'
import { FRAME_WIDGETS, readFrameLayout } from '../../src/frame-layout'
import { createScene } from '../../src/scene'
import { SCENE_STORAGE_KEY } from '../../src/scene-storage'
import { renderDesktop } from './desktop'

type Rect = { x: number; y: number; width: number; height: number }

function prepareObjects() {
  const workspace = createWorkspace()
  workspace.windows = workspace.windows
    .filter(({ id }) => id === 'canvas')
    .map((window) => ({
      ...window,
      x: workspace.home.x + 360,
      y: workspace.home.y + 240,
    }))
  workspace.items = workspace.items
    .filter(({ id }) => id === 'browser-shortcut')
    .map((item) => ({
      ...item,
      x: workspace.home.x + 1050,
      y: workspace.home.y + 350,
    }))
  const layout = readFrameLayout(undefined)
  layout.groups = {}
  for (const { id } of FRAME_WIDGETS)
    if (id !== 'tools')
      layout.placements[`widget:${id}`] = { surface: 'hidden' }
  layout.placements['widget:tools'] = {
    surface: 'canvas',
    x: workspace.home.x + 500,
    y: workspace.home.y + 700,
  }
  localStorage.setItem(
    SCENE_STORAGE_KEY,
    JSON.stringify(createScene(workspace, layout)),
  )
}

function rect(selector: string): Rect {
  const { x, y, width, height } = document
    .querySelector(selector)!
    .getBoundingClientRect()
  return { x, y, width, height }
}

function expectSameRect(actual: Rect, expected: Rect) {
  for (const key of ['x', 'y', 'width', 'height'] as const)
    expect(actual[key], key).toBeCloseTo(expected[key], 0)
}

// Pause the browser's real animation before a remote click can outlast it.
// Its keyframes, easing, layout, and paint geometry all remain unchanged.
function pauseMotion(selector: string) {
  const animations: Animation[] = []
  const animate = Element.prototype.animate
  const spy = vi
    .spyOn(Element.prototype, 'animate')
    .mockImplementation(function (this: Element, keyframes, options) {
      const animation = animate.call(this, keyframes, options)
      if (this.matches(selector)) {
        animation.pause()
        animations.push(animation)
      }
      return animation
    })
  return {
    async sample(
      progressPoints = [0, 0.25, 0.5, 0.75, 1],
      expectedAnimations = 1,
    ) {
      await expect
        .poll(() => animations.length)
        .toBeGreaterThanOrEqual(expectedAnimations)
      const active = animations.filter(
        (animation) => animation.playState !== 'idle',
      )
      await Promise.all(active.map((animation) => animation.ready))
      const frames: Rect[] = []
      for (const progress of progressPoints) {
        for (const animation of active)
          animation.currentTime =
            Number(animation.effect!.getComputedTiming().endTime) * progress
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve()),
        )
        frames.push(rect(selector))
      }
      return frames
    },
    async finish() {
      spy.mockRestore()
      const active = animations.filter(
        (animation) => animation.playState !== 'idle',
      )
      for (const animation of active) animation.play()
      await Promise.all(active.map((animation) => animation.finished))
      await expect
        .poll(() => document.querySelector(selector)!.getAnimations().length)
        .toBe(0)
    },
  }
}

async function expectContinuousPlacement(selector: string, action: string) {
  const before = rect(selector)
  const motion = pauseMotion(selector)
  let frames: Rect[]
  try {
    await page.getByRole('button', { name: action, exact: true }).click()
    frames = await motion.sample()
    expectSameRect(frames[0], before)
    const destination = frames.at(-1)!
    const distance = (frame: Rect) =>
      Math.hypot(
        frame.x - destination.x,
        frame.y - destination.y,
        frame.width - destination.width,
        frame.height - destination.height,
      )
    expect(distance(before)).toBeGreaterThan(30)
    expect(distance(frames[1])).toBeGreaterThan(1)
    expect(distance(frames[1])).toBeLessThan(distance(before))
    for (const [index, frame] of frames.entries()) {
      if (index > 0)
        expect(distance(frame)).toBeLessThanOrEqual(
          distance(frames[index - 1]) + 0.5,
        )
    }
  } finally {
    await motion.finish()
  }
  // Removing the animation must not expose another, different final position.
  expectSameRect(rect(selector), frames.at(-1)!)
}

afterEach(async () => {
  await commands.releasePointer()
})

test.each(['Canvas', 'Remove from frame'])(
  'a window pins smoothly from its visible position and animates back with %s',
  async (action) => {
    prepareObjects()
    await renderDesktop()
    await page
      .getByRole('button', { name: 'Change layout', exact: true })
      .click()
    const selector = '[data-window-id="canvas"]'
    await page
      .elementLocator(document.querySelector(`${selector} header`)!)
      .click()

    await expectContinuousPlacement(selector, 'Frame')
    expect(document.querySelector<HTMLElement>(selector)!.dataset.surface).toBe(
      'frame',
    )
    expect(rect(selector).y + rect(selector).height).toBeCloseTo(42, 0)

    await expectContinuousPlacement(selector, action)
    expect(document.querySelector<HTMLElement>(selector)!.dataset.surface).toBe(
      'canvas',
    )
    expect(rect(selector).y).toBeGreaterThanOrEqual(0)
  },
)

test('reversing a window pin midway starts at the currently visible position', async () => {
  prepareObjects()
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  const selector = '[data-window-id="canvas"]'
  await page
    .elementLocator(document.querySelector(`${selector} header`)!)
    .click()
  const before = rect(selector)
  const motion = pauseMotion(selector)
  let destination: Rect
  try {
    await page.getByRole('button', { name: 'Frame', exact: true }).click()
    const [midpoint] = await motion.sample([0.5])
    expect(midpoint.y).toBeLessThan(before.y)
    expect(midpoint.y + midpoint.height).toBeGreaterThan(42)

    await page.getByRole('button', { name: 'Canvas', exact: true }).click()
    const frames = await motion.sample(undefined, 2)
    expectSameRect(frames[0], midpoint)
    expect(frames[1].y).toBeGreaterThan(midpoint.y)
    destination = frames.at(-1)!
    expect(destination.y).toBeGreaterThanOrEqual(0)
  } finally {
    await motion.finish()
  }
  expectSameRect(rect(selector), destination)
  expect(document.querySelector<HTMLElement>(selector)!.dataset.surface).toBe(
    'canvas',
  )
})

test('Escape during window detachment returns smoothly from the partial animation to its pinned position', async () => {
  prepareObjects()
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  const selector = '[data-window-id="canvas"]'
  await page
    .elementLocator(document.querySelector(`${selector} header`)!)
    .click()
  await page.getByRole('button', { name: 'Frame', exact: true }).click()
  await expect
    .poll(() => document.querySelector(selector)!.getAnimations().length)
    .toBe(0)
  const pinned = rect(selector)
  const grab = page
    .getByRole('button', { name: 'Open pinned Files', exact: true })
    .element()
    .getBoundingClientRect()
  const motion = pauseMotion(selector)
  try {
    await commands.startDesktopDrag(
      'Open pinned Files',
      { x: 100, y: 140 },
      { x: grab.width / 2, y: grab.height - 21 },
      1,
    )
    const [midpoint] = await motion.sample([0.5])
    expect(midpoint.y).toBeGreaterThan(pinned.y)

    await userEvent.keyboard('{Escape}')
    const frames = await motion.sample(undefined, 2)
    expectSameRect(frames[0], midpoint)
    expect(frames[1].y).toBeLessThan(midpoint.y)
    expectSameRect(frames.at(-1)!, pinned)
  } finally {
    await motion.finish()
  }
  await commands.releasePointer()
  expectSameRect(rect(selector), pinned)
  expect(document.querySelector<HTMLElement>(selector)!.dataset.surface).toBe(
    'frame',
  )
})

test.each(['Canvas', 'Remove from frame'])(
  'an icon animates onto the frame and back with %s',
  async (action) => {
    prepareObjects()
    await renderDesktop()
    await page
      .getByRole('button', { name: 'Change layout', exact: true })
      .click()
    const selector = '[data-desktop-item-id="browser-shortcut"]'
    await page.getByRole('button', { name: 'Browser', exact: true }).click()

    await expectContinuousPlacement(selector, 'Frame')
    expect(rect(selector).x).toBeGreaterThan(1100)
    const framedSize = rect(selector)

    await expectContinuousPlacement(selector, action)
    expect(
      document.querySelector<HTMLElement>(selector)!.dataset.frameAttached,
    ).toBe('false')
    expect(rect(selector).width).toBeGreaterThan(framedSize.width)
    expect(rect(selector).height).toBeGreaterThan(framedSize.height)
  },
)

test.each([
  {
    kind: 'window',
    selector: '[data-window-id="canvas"]',
    title: 'Open pinned Files',
    delta: { x: 100, y: 140 },
    follow: { x: 80, y: 70 },
  },
  {
    kind: 'icon',
    selector: '[data-desktop-item-id="browser-shortcut"]',
    title: 'Browser',
    delta: { x: -140, y: 120 },
    follow: { x: -80, y: 70 },
  },
])(
  'dragging a pinned $kind into the canvas animates continuously and follows further pointer movement',
  async ({ kind, selector, title, delta, follow }) => {
    prepareObjects()
    await renderDesktop()
    await page
      .getByRole('button', { name: 'Change layout', exact: true })
      .click()
    if (kind === 'window')
      await page
        .elementLocator(document.querySelector(`${selector} header`)!)
        .click()
    else await page.getByRole('button', { name: title, exact: true }).click()
    await page.getByRole('button', { name: 'Frame', exact: true }).click()
    await expect
      .poll(() => document.querySelector(selector)!.getAnimations().length)
      .toBe(0)
    const before = rect(selector)
    const grab = page
      .getByRole('button', { name: title, exact: true })
      .element()
      .getBoundingClientRect()
    const offset = {
      x: grab.width / 2,
      y: kind === 'window' ? grab.height - 21 : grab.height / 2,
    }
    const motion = pauseMotion(selector)
    let followed: Rect
    try {
      await commands.startDesktopDrag(title, delta, offset, 1)
      const frames = await motion.sample()
      expectSameRect(frames[0], before)
      expect(
        Math.hypot(frames[1].x - before.x, frames[1].y - before.y),
      ).toBeGreaterThan(1)
      const detached = frames.at(-1)!

      await commands.movePointerTo({
        x: grab.x + offset.x + delta.x + follow.x,
        y: grab.y + offset.y + delta.y + follow.y,
      })
      followed = rect(selector)
      expectSameRect(followed, {
        ...detached,
        x: detached.x + follow.x,
        y: detached.y + follow.y,
      })
    } finally {
      await motion.finish()
    }
    await commands.releasePointer()
    expectSameRect(rect(selector), followed)
  },
)
