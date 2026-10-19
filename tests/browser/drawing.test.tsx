import { expect, test } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import { renderDesktop } from './desktop'

test('choosing Draw continues a selected drawing instead of creating a separate one', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Draw', exact: true }).click()
  await commands.drawCanvasStroke([
    { x: 500, y: 200 },
    { x: 580, y: 240 },
  ])
  await expect
    .element(page.getByRole('button', { name: 'Finish drawing' }))
    .toBeVisible()

  await userEvent.keyboard('v')
  const drawing = page.getByRole('button', { name: 'Drawing 1', exact: true })
  await drawing.click()
  await expect.element(drawing).toHaveAttribute('aria-pressed', 'true')
  const widthBefore = drawing.element().getBoundingClientRect().width

  await page.getByRole('button', { name: 'Draw', exact: true }).click()
  await commands.drawCanvasStroke([
    { x: 410, y: 250 },
    { x: 480, y: 280 },
  ])
  await userEvent.keyboard('v')

  await expect.element(drawing).toBeVisible()
  await expect
    .element(page.getByRole('button', { name: 'Drawing 2', exact: true }))
    .not.toBeInTheDocument()
  await expect
    .poll(() => drawing.element().getBoundingClientRect().width)
    .toBeGreaterThan(widthBefore)
})
