import { expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { renderDesktop, windowElement } from './desktop'

test('Settings keeps its selected category when moved to the frame and back', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Open app launcher' }).click()
  await page
    .getByRole('region', { name: 'App launcher' })
    .getByRole('button', { name: 'Settings', exact: true })
    .click()
  await page
    .getByRole('navigation', { name: 'Settings categories' })
    .getByRole('button', { name: 'Displays', exact: true })
    .click()
  await expect
    .element(page.getByRole('heading', { name: 'Displays', exact: true }))
    .toBeVisible()

  await userEvent.keyboard('{Control>}k{/Control}')
  await page
    .getByRole('searchbox', {
      name: 'Search apps, windows, files, folders, drawings, tools, and widgets',
    })
    .fill('Change layout')
  await userEvent.keyboard('{Enter}')
  await page
    .elementLocator(windowElement('Settings').querySelector('header')!)
    .click()
  await page.getByRole('button', { name: 'Frame', exact: true }).click()
  await page.getByRole('button', { name: 'Done changing layout' }).click()
  await page
    .getByRole('button', { name: 'Open pinned Settings', exact: true })
    .click()
  await expect
    .element(page.getByRole('heading', { name: 'Displays', exact: true }))
    .toBeVisible()

  await userEvent.keyboard('{Control>}1')
  await expect
    .element(page.getByRole('listbox', { name: 'Switch windows' }))
    .toBeVisible()
  await userEvent.keyboard('{Escape}{/Control}')
  await expect
    .element(page.getByRole('heading', { name: 'Displays', exact: true }))
    .toBeVisible()

  await userEvent.keyboard('{Control>}k{/Control}')
  await page
    .getByRole('searchbox', {
      name: 'Search apps, windows, files, folders, drawings, tools, and widgets',
    })
    .fill('Settings')
  await expect
    .element(page.getByRole('button', { name: 'Open Settings window' }))
    .toBeVisible()
  await userEvent.keyboard('{Escape}')
  await expect
    .element(page.getByRole('heading', { name: 'Displays', exact: true }))
    .toBeVisible()

  await userEvent.keyboard('{Control>}k{/Control}')
  await page
    .getByRole('searchbox', {
      name: 'Search apps, windows, files, folders, drawings, tools, and widgets',
    })
    .fill('Change layout')
  await userEvent.keyboard('{Enter}')
  await page
    .getByRole('button', { name: 'Open pinned Settings', exact: true })
    .click()
  await page.getByRole('button', { name: 'Canvas', exact: true }).click()
  await page.getByRole('button', { name: 'Done changing layout' }).click()
  await expect
    .element(page.getByRole('heading', { name: 'Displays', exact: true }))
    .toBeVisible()
})
