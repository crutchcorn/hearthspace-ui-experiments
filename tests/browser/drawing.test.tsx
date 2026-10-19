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

test('Enter finishes a drawing and leaves Draw ready to start a separate one', async () => {
  await renderDesktop()
  const draw = page.getByRole('button', { name: 'Draw', exact: true })
  await draw.click()
  await commands.drawCanvasStroke([
    { x: 500, y: 200 },
    { x: 580, y: 240 },
  ])
  await expect
    .element(page.getByRole('button', { name: 'Finish drawing' }))
    .toBeVisible()

  await userEvent.keyboard('{Enter}')
  await expect
    .element(page.getByRole('button', { name: 'Finish drawing' }))
    .not.toBeInTheDocument()
  await expect.element(draw).toHaveAttribute('aria-pressed', 'true')
  await expect
    .element(page.getByRole('img', { name: 'Drawing 1', exact: true }))
    .toBeVisible()

  await commands.drawCanvasStroke([
    { x: 410, y: 250 },
    { x: 480, y: 280 },
  ])
  await expect
    .element(page.getByRole('img', { name: 'Drawing 1', exact: true }))
    .toBeVisible()
  await expect
    .element(page.getByRole('img', { name: 'Drawing 2', exact: true }))
    .toBeVisible()
})

test('Delete removes the selected drawing on the canvas or pinned above it', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Draw', exact: true }).click()
  await commands.drawCanvasStroke([
    { x: 500, y: 200 },
    { x: 580, y: 240 },
  ])
  await userEvent.keyboard('{Delete}')
  await expect
    .element(page.getByRole('img', { name: 'Drawing 1', exact: true }))
    .not.toBeInTheDocument()

  await commands.drawCanvasStroke([
    { x: 500, y: 200 },
    { x: 580, y: 240 },
  ])
  await page
    .getByRole('group', { name: 'Drawing actions' })
    .getByRole('button', { name: 'Change layout', exact: true })
    .click()
  await page.getByRole('button', { name: 'Pin to top', exact: true }).click()
  await page.getByRole('button', { name: 'Done changing layout' }).click()
  const drawing = page.getByRole('button', { name: 'Drawing 1', exact: true })
  await expect.element(drawing).toHaveAttribute('data-surface', 'pinned')
  await drawing.click()
  await userEvent.keyboard('{Delete}')
  await expect.element(drawing).not.toBeInTheDocument()
  await expect
    .element(page.getByRole('group', { name: 'Drawing actions' }))
    .not.toBeInTheDocument()
})

test('Delete and Enter edit app text without removing or finishing the selected drawing', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Draw', exact: true }).click()
  await commands.drawCanvasStroke([
    { x: 500, y: 200 },
    { x: 580, y: 240 },
  ])
  await userEvent.keyboard('v')
  const drawing = page.getByRole('button', { name: 'Drawing 1', exact: true })
  await drawing.click()
  await expect.element(drawing).toHaveAttribute('aria-pressed', 'true')

  const note = page.getByRole('textbox', { name: 'Note content' })
  await note.fill('Notes')
  await userEvent.keyboard('{ArrowLeft}{Delete}{Enter}second')
  await expect.element(note).toHaveValue('Note\nsecond')
  await expect.element(drawing).toBeVisible()
  await expect.element(drawing).toHaveAttribute('aria-pressed', 'true')
})
