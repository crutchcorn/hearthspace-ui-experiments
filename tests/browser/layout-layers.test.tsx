import { afterEach, expect, test } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import { cleanup } from 'vitest-browser-react'
import { createWorkspace } from '../../src/desktop'
import { FRAME_WIDGETS, readFrameLayout } from '../../src/frame-layout'
import { createScene } from '../../src/scene'
import { SCENE_STORAGE_KEY } from '../../src/scene-storage'
import { renderDesktop, windowElement } from './desktop'

function prepareOverlappingWindows(pinBrowser = false) {
  const workspace = createWorkspace()
  workspace.windows = workspace.windows.map((window) => ({
    ...window,
    x: workspace.home.x + 20,
    y: workspace.home.y + 250,
    width: 480,
    height: 280,
  }))
  const layout = readFrameLayout(undefined)
  layout.placements['window:canvas'] = {
    surface: 'frame',
    edge: 'left',
    position: 0.5,
  }
  if (pinBrowser)
    layout.placements['item:browser-shortcut'] = {
      surface: 'frame',
      edge: 'right',
      position: 0.5,
    }
  localStorage.setItem(
    SCENE_STORAGE_KEY,
    JSON.stringify(createScene(workspace, layout)),
  )
}

function tools() {
  return document.querySelector<HTMLElement>('[data-layout-widget="tools"]')!
}

function leftGuide() {
  return document.querySelector<HTMLElement>('[data-frame-guide="left"]')!
}

function paintedBefore(
  front: Element,
  back: Element,
  point = { x: 35, y: 450 },
) {
  const guide = leftGuide()
  const previous = guide.style.pointerEvents
  // The guide deliberately ignores input. Enabling hit testing for this
  // synchronous probe exposes Chromium's paint order without changing layout
  // or stacking, and without duplicating CSS stacking rules in the test.
  guide.style.pointerEvents = 'auto'
  try {
    const stack = document.elementsFromPoint(point.x, point.y)
    const frontIndex = stack.findIndex(
      (element) => element === front || front.contains(element),
    )
    const backIndex = stack.findIndex(
      (element) => element === back || back.contains(element),
    )
    return frontIndex >= 0 && backIndex >= 0 && frontIndex < backIndex
  } finally {
    guide.style.pointerEvents = previous
  }
}

afterEach(async () => {
  await commands.releasePointer()
})

test('layout placement guides paint above canvas and pinned windows', async () => {
  prepareOverlappingWindows()
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()

  await expect
    .poll(() => paintedBefore(leftGuide(), windowElement('Scratchpad')))
    .toBe(true)
  await expect
    .poll(() => paintedBefore(leftGuide(), windowElement('Files')))
    .toBe(true)
})

test('a dragged toolbar stays above guides and windows, then leaves the drag layer', async () => {
  prepareOverlappingWindows()
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await commands.startFrameWidgetDrag('tools')
  await commands.movePointerTo({ x: 45, y: 450 })

  await expect.poll(() => paintedBefore(tools(), leftGuide())).toBe(true)
  await expect
    .poll(() => paintedBefore(tools(), windowElement('Files')))
    .toBe(true)
  await userEvent.keyboard('{Escape}')
  await commands.releasePointer()
  await expect.poll(() => tools().dataset.layoutSurface).toBe('frame')

  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await commands.startFrameWidgetDrag('tools')
  await commands.movePointerTo({ x: 1050, y: 750 })
  await commands.releasePointer()
  await expect.poll(() => tools().dataset.layoutSurface).toBe('canvas')
  expect(tools().closest('[data-canvas-world]')).not.toBeNull()
})

test('a frame shortcut rises during dragging and returns beneath windows on the canvas', async () => {
  prepareOverlappingWindows(true)
  await renderDesktop()
  const shortcut = () =>
    page.getByRole('button', { name: 'Browser', exact: true }).element()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await commands.startDesktopDrag('Browser', { x: -400, y: 0 })
  await commands.movePointerTo({ x: 45, y: 450 })

  await expect.poll(() => paintedBefore(shortcut(), leftGuide())).toBe(true)
  await expect
    .poll(() => paintedBefore(shortcut(), windowElement('Files')))
    .toBe(true)
  await userEvent.keyboard('{Escape}')
  await commands.releasePointer()
  await expect
    .element(page.elementLocator(shortcut()))
    .toHaveAttribute('data-surface', 'frame')

  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await commands.startDesktopDrag('Browser', { x: -400, y: 0 })
  await commands.movePointerTo({ x: 350, y: 450 })
  await commands.releasePointer()
  await expect
    .poll(() => shortcut().closest('[data-canvas-world]') !== null)
    .toBe(true)
  await expect
    .poll(() => {
      const icon = shortcut().getBoundingClientRect()
      const window = windowElement('Scratchpad')
      const bounds = window.getBoundingClientRect()
      const left = Math.max(icon.left, bounds.left)
      const top = Math.max(icon.top, bounds.top)
      const right = Math.min(icon.right, bounds.right)
      const bottom = Math.min(icon.bottom, bounds.bottom)
      return (
        right > left &&
        bottom > top &&
        paintedBefore(window, shortcut(), {
          x: (left + right) / 2,
          y: (top + bottom) / 2,
        })
      )
    })
    .toBe(true)
})

function prepareDrawing() {
  const workspace = createWorkspace()
  workspace.windows = workspace.windows
    .filter((window) => window.title === 'Scratchpad')
    .map((window) => ({
      ...window,
      x: workspace.home.x + 20,
      y: workspace.home.y + 250,
      width: 480,
      height: 280,
    }))
  workspace.drawings = [
    {
      id: 'sketch',
      x: workspace.home.x + 600,
      y: workspace.home.y + 500,
      width: 120,
      height: 80,
      layer: 'below',
      strokes: [
        [
          { x: 0, y: 0 },
          { x: 120, y: 80 },
        ],
      ],
    },
  ]
  const layout = readFrameLayout(undefined)
  layout.groups = {}
  for (const { id } of FRAME_WIDGETS)
    if (id !== 'tools')
      layout.placements[`widget:${id}`] = { surface: 'hidden' }
  localStorage.setItem(
    SCENE_STORAGE_KEY,
    JSON.stringify(createScene(workspace, layout)),
  )
}

function drawing() {
  return document.querySelector<SVGSVGElement>('[data-drawing-id="sketch"]')!
}

function drawingPosition() {
  const { x, y } = drawing().getBoundingClientRect()
  return { x, y }
}

async function pinDrawing() {
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await page.getByRole('button', { name: 'Drawing 1', exact: true }).click()
  await expect
    .element(page.getByRole('button', { name: 'Frame', exact: true }))
    .not.toBeInTheDocument()
  await expect
    .element(page.getByRole('button', { name: 'Canvas', exact: true }))
    .not.toBeInTheDocument()
  await page.getByRole('button', { name: 'Pin to top', exact: true }).click()
  await expect
    .element(page.elementLocator(drawing()))
    .toHaveAttribute('data-surface', 'pinned')
}

test('pinned drawings move freely over windows and stay below frame tools without joining them', async () => {
  prepareDrawing()
  await renderDesktop()
  const original = drawingPosition()
  await pinDrawing()
  expect(drawingPosition()).toEqual(original)

  await commands.startDesktopDrag('Drawing 1', { x: -410, y: -140 })
  await commands.releasePointer()
  await expect
    .element(page.elementLocator(drawing()))
    .toHaveAttribute('data-surface', 'pinned')
  await expect
    .poll(() => {
      const bounds = drawing().getBoundingClientRect()
      return paintedBefore(drawing(), windowElement('Scratchpad'), {
        x: bounds.x + bounds.width / 2,
        y: bounds.y + bounds.height / 2,
      })
    })
    .toBe(true)

  const toolbar = tools().getBoundingClientRect()
  const point = {
    x: toolbar.x + toolbar.width / 2,
    y: toolbar.y + toolbar.height / 2,
  }
  await commands.startDesktopDrag('Drawing 1', { x: 20, y: 20 })
  await commands.movePointerTo(point)
  await expect.poll(() => paintedBefore(tools(), drawing(), point)).toBe(true)
  await commands.releasePointer()
  await expect
    .element(page.elementLocator(drawing()))
    .toHaveAttribute('data-surface', 'pinned')
  await expect.poll(() => paintedBefore(tools(), drawing(), point)).toBe(true)
  expect(document.querySelector('[data-frame-group]')).toBeNull()
  expect(drawingPosition().x).toBeCloseTo(point.x - 60, 0)
  expect(drawingPosition().y).toBeCloseTo(point.y - 40, 0)
})

test('pinned drawings keep their screen position through panning and reload until placed in the background', async () => {
  prepareDrawing()
  await renderDesktop()
  await pinDrawing()
  await page.getByRole('button', { name: 'Done changing layout' }).click()
  const pinnedPosition = drawingPosition()
  const windowBefore = windowElement('Scratchpad').getBoundingClientRect().x

  await userEvent.keyboard('h')
  await commands.drawCanvasStroke([
    { x: 1000, y: 650 },
    { x: 1100, y: 700 },
  ])
  await expect
    .poll(() => windowElement('Scratchpad').getBoundingClientRect().x)
    .toBeGreaterThan(windowBefore + 90)
  expect(drawingPosition()).toEqual(pinnedPosition)
  await expect
    .poll(() => {
      const saved = JSON.parse(localStorage.getItem(SCENE_STORAGE_KEY)!)
      return saved.drawings.find((item: { id: string }) => item.id === 'sketch')
        .location
    })
    .toEqual({ surface: 'pinned', ...pinnedPosition })

  await cleanup()
  const root = document.createElement('div')
  root.id = 'root'
  document.body.append(root)
  await renderDesktop()
  await expect
    .element(page.elementLocator(drawing()))
    .toHaveAttribute('data-surface', 'pinned')
  expect(drawingPosition()).toEqual(pinnedPosition)

  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await page.getByRole('button', { name: 'Drawing 1', exact: true }).click()
  await page.getByRole('button', { name: 'Background', exact: true }).click()
  await expect
    .element(page.elementLocator(drawing()))
    .toHaveAttribute('data-surface', 'background')
  await page.getByRole('button', { name: 'Done changing layout' }).click()
  const backgroundPosition = drawingPosition()
  await userEvent.keyboard('h')
  await commands.drawCanvasStroke([
    { x: 1000, y: 650 },
    { x: 1100, y: 700 },
  ])
  await expect
    .poll(() => drawingPosition().x)
    .toBeCloseTo(backgroundPosition.x + 100, 0)
  await expect
    .poll(() => drawingPosition().y)
    .toBeCloseTo(backgroundPosition.y + 50, 0)

  await pinDrawing()
  await page.getByRole('button', { name: 'Done changing layout' }).click()
  const pinnedAgain = drawingPosition()
  await userEvent.keyboard('h')
  await commands.drawCanvasStroke([
    { x: 1000, y: 650 },
    { x: 1100, y: 700 },
  ])
  expect(drawingPosition()).toEqual(pinnedAgain)
})

test('a pinned window preview stays above its group strip while it moves', async () => {
  const workspace = createWorkspace()
  const layout = readFrameLayout(undefined)
  layout.groups = {
    previews: {
      id: 'previews',
      members: [
        { kind: 'window', id: 'canvas' },
        { kind: 'widget', id: 'wifi' },
      ],
    },
  }
  for (const { id } of FRAME_WIDGETS)
    if (id !== 'tools' && id !== 'wifi')
      layout.placements[`widget:${id}`] = { surface: 'hidden' }
  layout.placements['group:previews'] = {
    surface: 'frame',
    edge: 'bottom',
    position: 0.5,
  }
  localStorage.setItem(
    SCENE_STORAGE_KEY,
    JSON.stringify(createScene(workspace, layout)),
  )
  await renderDesktop()
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await commands.startDesktopDrag('Move group', { x: 0, y: -250 })

  await expect
    .poll(() => {
      const strip = document.querySelector('[data-frame-group="previews"]')!
      const bounds = strip.getBoundingClientRect()
      const preview = windowElement('Files')
      const item = preview.getBoundingClientRect()
      const left = Math.max(item.left, bounds.left)
      const top = Math.max(item.top, bounds.top)
      const right = Math.min(item.right, bounds.right)
      const bottom = Math.min(item.bottom, bounds.bottom)
      return (
        right > left &&
        bottom > top &&
        paintedBefore(preview, strip, {
          x: (left + right) / 2,
          y: (top + bottom) / 2,
        })
      )
    })
    .toBe(true)
  await userEvent.keyboard('{Escape}')
  await commands.releasePointer()
})
