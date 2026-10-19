import { expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { renderDesktop, windowBounds } from './desktop'

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
