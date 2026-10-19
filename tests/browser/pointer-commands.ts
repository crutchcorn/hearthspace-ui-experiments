import type { BrowserCommand } from 'vitest/node'
import type {} from '@vitest/browser-playwright'

type Point = { x: number; y: number }

// Keep the native button held so the test can interrupt a real drag with a key.
export const startDesktopDrag: BrowserCommand<
  [title: string, delta: Point]
> = async ({ iframe, page }, title, delta) => {
  const target = iframe.getByRole('button', { name: title, exact: true })
  await target.scrollIntoViewIfNeeded()
  const bounds = await target.boundingBox()
  if (!bounds) throw new Error(`Desktop item ${title} has no visible bounds`)
  const x = bounds.x + bounds.width / 2
  const y = bounds.y + bounds.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + delta.x, y + delta.y, { steps: 8 })
}

export const releasePointer: BrowserCommand = async ({ page }) => {
  await page.mouse.up()
}

export const startFrameWidgetDrag: BrowserCommand<
  [id: string, offset?: Point]
> = async ({ iframe, page }, id, offset) => {
  const bounds = await iframe
    .locator(`[data-layout-widget="${id}"]`)
    .boundingBox()
  if (!bounds) throw new Error(`Frame widget ${id} has no visible bounds`)
  await page.mouse.move(
    bounds.x + (offset?.x ?? bounds.width / 2),
    bounds.y + (offset?.y ?? bounds.height / 2),
  )
  await page.mouse.down()
}

export const movePointerTo: BrowserCommand<[point: Point]> = async (
  { iframe, page },
  point,
) => {
  const viewport = await iframe.locator('#root').boundingBox()
  if (!viewport) throw new Error('A visible canvas is required')
  await page.mouse.move(viewport.x + point.x, viewport.y + point.y, {
    steps: 8,
  })
}

export const drawCanvasStroke: BrowserCommand<[points: Point[]]> = async (
  { iframe, page },
  points,
) => {
  const viewport = await iframe.locator('#root').boundingBox()
  if (!viewport || !points.length)
    throw new Error('A visible canvas and stroke points are required')
  await page.mouse.move(viewport.x + points[0].x, viewport.y + points[0].y)
  await page.mouse.down()
  try {
    for (const point of points.slice(1))
      await page.mouse.move(viewport.x + point.x, viewport.y + point.y, {
        steps: 8,
      })
  } finally {
    await page.mouse.up()
  }
}

declare module 'vitest/browser' {
  interface BrowserCommands {
    startDesktopDrag: (title: string, delta: Point) => Promise<void>
    releasePointer: () => Promise<void>
    startFrameWidgetDrag: (id: string, offset?: Point) => Promise<void>
    movePointerTo: (point: Point) => Promise<void>
    drawCanvasStroke: (points: Point[]) => Promise<void>
  }
}
