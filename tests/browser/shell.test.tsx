import { expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { renderDesktop, windowBounds } from './desktop'

test('the launcher remains usable on a narrow desktop', async () => {
  await page.viewport(390, 844)
  try {
    await renderDesktop()
    await page.getByRole('button', { name: 'Open app launcher' }).click()
    const launcher = page.getByRole('region', { name: 'App launcher' })
    const search = launcher.getByRole('searchbox', { name: 'Search apps' })

    // Catch a panel collapsing to icon size even when its children exist.
    await expect
      .poll(() => launcher.element().getBoundingClientRect().width)
      .toBeGreaterThan(window.innerWidth / 2)
    const bounds = launcher.element().getBoundingClientRect()
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(window.innerWidth)
    await search.fill('Settings')
    await launcher
      .getByRole('button', { name: 'Settings', exact: true })
      .click()
    await expect.element(launcher).not.toBeInTheDocument()
    await expect
      .element(page.getByRole('heading', { name: 'Appearance', exact: true }))
      .toBeVisible()
  } finally {
    await page.viewport(1280, 900)
  }
})

test('opening another shell panel dismisses the previous one', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Notifications, 3 new' }).click()
  await expect
    .element(page.getByRole('heading', { name: 'Notifications' }))
    .toBeVisible()

  await page.getByRole('button', { name: 'Wi-Fi settings' }).click()
  await expect
    .element(page.getByRole('checkbox', { name: 'Wi-Fi' }))
    .toBeVisible()
  await expect
    .element(page.getByRole('heading', { name: 'Notifications' }))
    .not.toBeInTheDocument()

  await page.getByRole('button', { name: 'Open app launcher' }).click()
  await expect
    .element(page.getByRole('region', { name: 'App launcher' }))
    .toBeVisible()
  await expect
    .element(page.getByRole('checkbox', { name: 'Wi-Fi' }))
    .not.toBeInTheDocument()

  await page.getByRole('button', { name: 'Sound settings' }).click()
  await expect
    .element(page.getByRole('slider', { name: 'Sound' }))
    .toBeVisible()
  await expect
    .element(page.getByRole('region', { name: 'App launcher' }))
    .not.toBeInTheDocument()
})

test('canceling canvas search restores window positions and edited notes', async () => {
  await renderDesktop()
  const note = page.getByRole('textbox', { name: 'Note content' })
  await note.fill('Keep this note through search.')
  const before = windowBounds('Scratchpad')

  await userEvent.keyboard('{Control>}k{/Control}')
  const search = page.getByRole('searchbox', {
    name: 'Search apps, windows, files, folders, drawings, tools, and widgets',
  })
  await search.fill('Scratchpad')
  await expect
    .poll(() => windowBounds('Scratchpad').width)
    .toBeLessThan(before.width)
  await userEvent.keyboard('{Escape}')

  await expect.element(search).not.toBeInTheDocument()
  await expect.poll(() => windowBounds('Scratchpad')).toEqual(before)
  await expect.element(note).toHaveValue('Keep this note through search.')
})

test('canceling the window switcher restores the layout and focused note', async () => {
  await renderDesktop()
  const note = page.getByRole('textbox', { name: 'Note content' })
  await note.fill('Keep this note through switching.')
  const before = windowBounds('Scratchpad')

  await userEvent.keyboard('{Control>}1')
  await expect
    .element(page.getByRole('listbox', { name: 'Switch windows' }))
    .toBeVisible()
  await userEvent.keyboard('{Escape}{/Control}')

  await expect
    .element(page.getByRole('listbox', { name: 'Switch windows' }))
    .not.toBeInTheDocument()
  await expect.poll(() => windowBounds('Scratchpad')).toEqual(before)
  await expect.element(note).toHaveValue('Keep this note through switching.')
  await expect.element(note).toHaveFocus()
})

test('tool choices share the same behavior through shortcuts, toolbar, and search', async () => {
  await renderDesktop()
  const overview = page.getByRole('heading', { name: 'Overview', exact: true })
  const pan = page.getByRole('button', {
    name: 'Pan canvas, choose canvas tool',
    exact: true,
  })
  const draw = page.getByRole('button', { name: 'Draw', exact: true })

  await userEvent.keyboard('m')
  await expect.element(overview).toBeVisible()
  await userEvent.keyboard('h')
  await expect.element(pan).toHaveAttribute('aria-pressed', 'true')
  await expect.element(overview).not.toBeInTheDocument()

  await draw.click()
  await expect.element(draw).toHaveAttribute('aria-pressed', 'true')
  // The first press selects the remembered primary tool; the second opens its picker.
  await pan.click()
  await expect.element(pan).toHaveAttribute('aria-pressed', 'true')
  await expect.element(pan).toHaveAttribute('aria-expanded', 'false')
  await pan.click()
  await page
    .getByRole('menuitemradio', { name: 'Select desktop items V' })
    .click()

  await userEvent.keyboard('{Control>}k{/Control}')
  await page
    .getByRole('searchbox', {
      name: 'Search apps, windows, files, folders, drawings, tools, and widgets',
    })
    .fill('Pan canvas')
  await userEvent.keyboard('{Enter}')
  await expect.element(pan).toHaveAttribute('aria-pressed', 'true')
  await expect
    .element(page.getByRole('search', { name: 'Canvas search' }))
    .not.toBeInTheDocument()

  await userEvent.keyboard('m')
  await expect.element(overview).toBeVisible()
  await userEvent.keyboard('m')
  await expect.element(overview).not.toBeInTheDocument()
})
