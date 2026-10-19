import { expect, test } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import { renderDesktop, windowElement } from './desktop'

test('new ink is pinned and continuing it after panning keeps its earlier strokes in place', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Draw', exact: true }).click()
  await commands.drawCanvasStroke([
    { x: 500, y: 200 },
    { x: 580, y: 240 },
  ])
  await expect
    .element(page.getByRole('button', { name: 'Finish drawing' }))
    .toBeVisible()

  const ink = page.getByRole('img', { name: 'Drawing 1', exact: true })
  await expect.element(ink).toHaveAttribute('data-surface', 'pinned')
  const drawingId = ink.element().getAttribute('data-drawing-id')!
  const strokePosition = () => {
    const stroke = document.querySelector(
      `[data-drawing-id="${drawingId}"] polyline`,
    )!
    const { x, y } = stroke.getBoundingClientRect()
    return { x, y }
  }
  const before = strokePosition()
  const windowBefore = windowElement('Scratchpad').getBoundingClientRect().x
  await userEvent.keyboard('h')
  await commands.drawCanvasStroke([
    { x: 1000, y: 750 },
    { x: 1100, y: 780 },
  ])
  await expect
    .poll(() => windowElement('Scratchpad').getBoundingClientRect().x)
    .toBeGreaterThan(windowBefore + 90)
  expect(strokePosition()).toEqual(before)

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
  await expect.element(drawing).toHaveAttribute('data-surface', 'pinned')
  expect(strokePosition()).toEqual(before)
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
  await expect
    .element(page.getByRole('img', { name: 'Drawing 2', exact: true }))
    .toHaveAttribute('data-surface', 'pinned')
})

test('Delete removes the selected pinned or background drawing', async () => {
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
  await page.getByRole('button', { name: 'Background', exact: true }).click()
  await page.getByRole('button', { name: 'Done changing layout' }).click()
  const drawing = page.getByRole('button', { name: 'Drawing 1', exact: true })
  await expect.element(drawing).toHaveAttribute('data-surface', 'background')
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
