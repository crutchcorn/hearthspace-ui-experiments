import { expect, test, vi } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { renderDesktop } from './desktop'
import { completeSpeakerPairing } from './wireless-helpers'

async function openSettings() {
  await page.getByRole('button', { name: 'Open app launcher' }).click()
  await page
    .getByRole('region', { name: 'App launcher' })
    .getByRole('button', { name: 'Settings', exact: true })
    .click()
}

function settingsWindows() {
  return page.getByRole('region', { name: 'Settings', exact: true }).filter({
    has: page.getByRole('button', { name: 'Close Settings', exact: true }),
  })
}

test('pairing progress in Settings keeps keyboard focus and Escape cancellation', async () => {
  const desktop = await renderDesktop()
  await openSettings()
  const settings = settingsWindows()
  await settings.getByRole('button', { name: 'Bluetooth', exact: true }).click()
  const pair = settings.getByRole('button', {
    name: 'Pair Pocket speaker',
    exact: true,
  })
  await pair.click()
  const prompt = settings.getByRole('dialog', {
    name: 'Pair Pocket speaker',
    exact: true,
  })
  await prompt.getByRole('button', { name: 'Fill PIN', exact: true }).click()
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    await prompt.getByRole('button', { name: 'Pair', exact: true }).click()
    await expect
      .element(prompt.getByRole('button', { name: 'Cancel', exact: true }))
      .toHaveFocus()
    await userEvent.keyboard('{Control>}k{/Control}{Control>}1{/Control}')
    await expect
      .element(page.getByRole('search', { name: 'Canvas search' }))
      .not.toBeInTheDocument()
    await expect
      .element(page.getByRole('listbox', { name: 'Switch windows' }))
      .not.toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await expect.element(prompt).not.toBeInTheDocument()
    await expect.element(pair).toHaveFocus()
  } finally {
    await desktop.unmount()
    vi.useRealTimers()
  }
})

test('a Settings password prompt stays inside its window and leaves Scratchpad usable', async () => {
  await renderDesktop()
  await openSettings()
  const settings = settingsWindows()
  await settings.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
  const connect = settings.getByRole('button', {
    name: 'Connect to Workshop',
    exact: true,
  })
  await connect.click()
  const prompt = settings.getByRole('dialog', {
    name: 'Connect to Workshop',
    exact: true,
  })
  const password = prompt.getByLabelText('Password', { exact: true })
  await expect.element(password).toHaveFocus()
  const bounds = prompt.element().getBoundingClientRect()
  const window = settings.element().getBoundingClientRect()
  expect(bounds.left).toBeGreaterThanOrEqual(window.left)
  expect(bounds.right).toBeLessThanOrEqual(window.right)
  expect(bounds.top).toBeGreaterThanOrEqual(window.top)
  expect(bounds.bottom).toBeLessThanOrEqual(window.bottom)

  await userEvent.keyboard('{Control>}k{/Control}{Control>}1{/Control}')
  await userEvent.keyboard('{Tab}g')
  await expect.element(prompt).toBeVisible()
  await expect
    .element(page.getByRole('search', { name: 'Canvas search' }))
    .not.toBeInTheDocument()
  await expect
    .element(page.getByRole('listbox', { name: 'Switch windows' }))
    .not.toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  await expect.element(prompt).not.toBeInTheDocument()
  await expect.element(connect).toHaveFocus()

  await connect.click()
  await password.fill('unfinished network password')
  const note = page.getByRole('textbox', { name: 'Note content', exact: true })
  await note.fill('Work continues while the network form is open.')
  await expect.element(note).toHaveFocus()
  await expect
    .element(note)
    .toHaveValue('Work continues while the network form is open.')
  await expect.element(password).toHaveValue('unfinished network password')
  await expect.element(prompt).toBeVisible()
})

test('each Settings window owns its dialog and Bluetooth row focus survives pairing and forgetting', async () => {
  await renderDesktop()
  await openSettings()
  const first = settingsWindows().first()
  await first.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
  await first
    .getByRole('button', { name: 'Connect to Workshop', exact: true })
    .click()
  const password = first
    .getByRole('dialog', { name: 'Connect to Workshop', exact: true })
    .getByLabelText('Password', { exact: true })
  await password.fill('first window draft')

  await openSettings()
  await expect.poll(() => settingsWindows().elements().length).toBe(2)
  const second = settingsWindows().last()
  await second.getByRole('button', { name: 'Bluetooth', exact: true }).click()
  await second
    .getByRole('button', { name: 'Pair Pocket speaker', exact: true })
    .click()
  await completeSpeakerPairing()
  await expect
    .element(
      second.getByRole('button', {
        name: 'Disconnect Pocket speaker',
        exact: true,
      }),
    )
    .toHaveFocus()
  await expect.element(password).toHaveValue('first window draft')

  await second
    .getByRole('button', { name: 'Pocket speaker details', exact: true })
    .click()
  await second
    .getByRole('dialog', { name: 'Pocket speaker details', exact: true })
    .getByRole('button', { name: 'Forget device…', exact: true })
    .click()
  await second
    .getByRole('dialog', { name: 'Forget Pocket speaker?', exact: true })
    .getByRole('button', { name: 'Forget device', exact: true })
    .click()
  await expect
    .element(
      second.getByRole('button', { name: 'Pair Pocket speaker', exact: true }),
    )
    .toHaveFocus()
  await expect.element(password).toHaveValue('first window draft')
  await second
    .getByRole('button', { name: 'Close Settings', exact: true })
    .click()
  await expect.element(password).toBeVisible()
})

test('finishing Bluetooth pairing in Settings leaves focus with the app the user moved to', async () => {
  await renderDesktop()
  await openSettings()
  const settings = settingsWindows()
  await settings.getByRole('button', { name: 'Bluetooth', exact: true }).click()
  await settings
    .getByRole('button', { name: 'Pair Pocket speaker', exact: true })
    .click()
  const pairing = settings.getByRole('dialog', {
    name: 'Pair Pocket speaker',
    exact: true,
  })
  await pairing.getByRole('button', { name: 'Fill PIN', exact: true }).click()
  await pairing.getByRole('button', { name: 'Pair', exact: true }).click()
  const note = page.getByRole('textbox', { name: 'Note content', exact: true })
  await note.fill('Keep typing while Bluetooth finishes connecting.')
  await expect.element(note).toHaveFocus()
  await expect
    .element(
      settings.getByRole('button', {
        name: 'Disconnect Pocket speaker',
        exact: true,
      }),
    )
    .toBeVisible()
  await expect.element(pairing).not.toBeInTheDocument()
  await expect.element(note).toHaveFocus()
  await expect
    .element(note)
    .toHaveValue('Keep typing while Bluetooth finishes connecting.')
})

test('a compact Settings detail form fits its window and saves native select and checkbox edits', async () => {
  await page.viewport(390, 844)
  try {
    await renderDesktop()
    await openSettings()
    const settings = settingsWindows()
    await settings.getByRole('button', { name: 'Settings categories' }).click()
    await settings
      .getByRole('navigation', { name: 'Settings categories' })
      .getByRole('button', { name: 'Wi-Fi', exact: true })
      .click()
    const detailsButton = settings.getByRole('button', {
      name: 'Studio network details',
      exact: true,
    })
    await detailsButton.click()
    const details = settings.getByRole('dialog', {
      name: 'Studio network details',
      exact: true,
    })
    await expect.element(details).toBeVisible()
    const bounds = details.element().getBoundingClientRect()
    const window = settings.element().getBoundingClientRect()
    expect(bounds.left).toBeGreaterThanOrEqual(Math.max(0, window.left))
    expect(bounds.right).toBeLessThanOrEqual(Math.min(innerWidth, window.right))
    expect(bounds.top).toBeGreaterThanOrEqual(Math.max(0, window.top))
    expect(bounds.bottom).toBeLessThanOrEqual(
      Math.min(innerHeight, window.bottom),
    )
    await details
      .getByRole('checkbox', { name: 'Metered connection', exact: true })
      .click()
    await details
      .getByRole('combobox', { name: 'DNS configuration', exact: true })
      .selectOptions('manual')
    await details.getByLabelText(/^DNS servers/).fill('1.1.1.1, 8.8.8.8')
    await details.getByRole('button', { name: 'Save', exact: true }).click()
    await expect.element(details).not.toBeInTheDocument()
    await expect.element(detailsButton).toHaveFocus()

    await detailsButton.click()
    await expect
      .element(
        details.getByRole('checkbox', {
          name: 'Metered connection',
          exact: true,
        }),
      )
      .toBeChecked()
    await expect
      .element(
        details.getByRole('combobox', {
          name: 'DNS configuration',
          exact: true,
        }),
      )
      .toHaveValue('manual')
    await expect
      .element(details.getByLabelText(/^DNS servers/))
      .toHaveValue('1.1.1.1, 8.8.8.8')
    await details
      .getByRole('button', { name: 'Forget network', exact: true })
      .click()
    await settings
      .getByRole('dialog', { name: 'Forget Studio network?', exact: true })
      .getByRole('button', { name: 'Cancel', exact: true })
      .click()
    await expect.element(details).toBeVisible()
    await details.getByRole('button', { name: 'Cancel', exact: true }).click()
    await expect.element(detailsButton).toHaveFocus()
  } finally {
    await page.viewport(1280, 900)
  }
})
