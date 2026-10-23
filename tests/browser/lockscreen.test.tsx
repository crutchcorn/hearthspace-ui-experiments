import { expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { renderDesktop, windowBounds } from './desktop'

test('locking preserves edited work and app state through password errors and unlocking', async () => {
  await renderDesktop()
  const note = page.getByRole('textbox', { name: 'Note content' })
  await note.fill('Keep this work while I am away.')
  await page.getByRole('button', { name: 'Open app launcher' }).click()
  await page
    .getByRole('region', { name: 'App launcher' })
    .getByRole('button', { name: 'Settings', exact: true })
    .click()
  await page
    .getByRole('navigation', { name: 'Settings categories' })
    .getByRole('button', { name: 'Displays', exact: true })
    .click()
  const before = windowBounds('Settings')

  await page.getByRole('button', { name: 'Power', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Lock screen' }).click()
  const screen = page.getByRole('dialog', { name: 'Lock screen' })
  const password = page.getByLabelText('Password', { exact: true })
  const unlock = page.getByRole('button', { name: 'Unlock', exact: true })
  await expect.element(screen).toBeVisible()
  await expect.element(password).toHaveFocus()
  await expect.element(unlock).toBeDisabled()
  await password.fill('incorrect-demo-password')
  await userEvent.keyboard('{Enter}')
  await expect
    .element(page.getByRole('status'))
    .toHaveTextContent('That password didn’t match. Try again.')
  await expect.element(screen).toBeVisible()
  await expect.element(password).toHaveFocus()
  await page.getByRole('button', { name: 'Fill password' }).click()
  await expect.element(password).toHaveValue('hearthspace')
  await expect.element(password).toHaveAttribute('type', 'password')
  await expect.element(password).toHaveFocus()
  await expect.element(password).toHaveAttribute('aria-invalid', 'false')
  await userEvent.keyboard('{Enter}')

  await expect.element(screen).not.toBeInTheDocument()
  await expect
    .element(page.getByRole('heading', { name: 'Displays', exact: true }))
    .toBeVisible()
  await expect.element(note).toHaveValue('Keep this work while I am away.')
  await expect.poll(() => windowBounds('Settings')).toEqual(before)
  await expect
    .element(page.getByRole('button', { name: 'Power', exact: true }))
    .toHaveFocus()

  await page.getByRole('button', { name: 'Power', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Lock screen' }).click()
  await expect.element(password).toHaveValue('')
  await expect.element(password).toHaveAttribute('type', 'password')
})

test('the lockscreen blocks desktop shortcuts even outside the password field', async () => {
  await renderDesktop()
  const before = windowBounds('Scratchpad')
  await page.getByRole('button', { name: 'Power', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Lock screen' }).click()
  const screen = page.getByRole('dialog', { name: 'Lock screen' })
  await userEvent.keyboard('{Control>}k{/Control}{Control>}1{/Control}{Escape}')
  await page.getByRole('button', { name: 'Fill password' }).click()
  await userEvent.keyboard('{Tab}{Tab}')
  await expect
    .element(page.getByRole('button', { name: 'Unlock', exact: true }))
    .toHaveFocus()
  await userEvent.keyboard(
    'mgn/d{Escape}{Control>}k{/Control}{Control>}1{/Control}',
  )
  await expect.element(screen).toBeVisible()
  await page.getByLabelText('Password', { exact: true }).fill('hearthspace')
  await page.getByRole('button', { name: 'Unlock', exact: true }).click()

  await expect.element(screen).not.toBeInTheDocument()
  await expect
    .element(page.getByRole('search', { name: 'Canvas search' }))
    .not.toBeInTheDocument()
  await expect
    .element(page.getByRole('listbox', { name: 'Switch windows' }))
    .not.toBeInTheDocument()
  await expect
    .element(page.getByRole('heading', { name: 'Overview', exact: true }))
    .not.toBeInTheDocument()
  await expect
    .element(page.getByRole('heading', { name: 'Notifications', exact: true }))
    .not.toBeInTheDocument()
  await expect
    .element(page.getByRole('region', { name: 'App launcher' }))
    .not.toBeInTheDocument()
  await expect
    .element(page.getByRole('button', { name: 'Draw', exact: true }))
    .toHaveAttribute('aria-pressed', 'false')
  await expect.poll(() => windowBounds('Scratchpad')).toEqual(before)
})

test('the power dropdown shares shell dismissal and keyboard navigation', async () => {
  await renderDesktop()
  const note = page.getByRole('textbox', { name: 'Note content' })
  await note.fill('Still here after power previews.')
  await page.getByRole('button', { name: 'Sound settings' }).click()
  await page.getByRole('button', { name: 'Power', exact: true }).click()
  const menu = page.getByRole('menu', { name: 'Power', exact: true })
  await expect
    .element(page.getByRole('slider', { name: 'Sound' }))
    .not.toBeInTheDocument()
  await expect.element(menu).toBeVisible()
  await expect.element(note).toHaveValue('Still here after power previews.')
  await expect
    .element(page.getByRole('dialog', { name: 'Lock screen' }))
    .not.toBeInTheDocument()
  await userEvent.keyboard('{Home}')
  await expect
    .element(page.getByRole('menuitem', { name: 'Lock screen' }))
    .toHaveFocus()
  await userEvent.keyboard('{End}')
  await expect
    .element(page.getByRole('menuitem', { name: 'Turn off' }))
    .toHaveFocus()
  await userEvent.keyboard('{Escape}')
  await expect.element(menu).not.toBeInTheDocument()
  await expect
    .element(page.getByRole('button', { name: 'Power', exact: true }))
    .toHaveFocus()
})

test.each(['Log off', 'Reboot', 'Turn off'])(
  '%s confirms or cancels without changing the desktop session',
  async (action) => {
    await renderDesktop()
    const note = page.getByRole('textbox', { name: 'Note content' })
    await note.fill('Keep this work through power confirmations.')
    const before = windowBounds('Scratchpad')
    const power = page.getByRole('button', { name: 'Power', exact: true })
    const dialog = page.getByRole('dialog', { name: `${action}?` })
    const cancel = dialog.getByRole('button', { name: 'Cancel', exact: true })

    await power.click()
    await page.getByRole('menuitem', { name: action, exact: true }).click()
    await expect.element(dialog).toBeVisible()
    await expect.element(cancel).toHaveFocus()
    await expect
      .element(page.getByRole('menu', { name: 'Power', exact: true }))
      .not.toBeInTheDocument()
    await userEvent.keyboard('dgnm/{Control>}k{/Control}{Control>}1{/Control}')
    await expect.element(dialog).toBeVisible()
    await cancel.click()
    await expect.element(dialog).not.toBeInTheDocument()
    await expect.element(power).toHaveFocus()

    await power.click()
    await page.getByRole('menuitem', { name: action, exact: true }).click()
    await userEvent.keyboard('{Escape}')
    await expect.element(dialog).not.toBeInTheDocument()
    await expect.element(power).toHaveFocus()

    await power.click()
    await page.getByRole('menuitem', { name: action, exact: true }).click()
    await dialog.getByRole('button', { name: action, exact: true }).click()
    await expect.element(dialog).not.toBeInTheDocument()
    await expect.element(power).toHaveFocus()
    await expect
      .element(note)
      .toHaveValue('Keep this work through power confirmations.')
    await expect.poll(() => windowBounds('Scratchpad')).toEqual(before)
    await expect
      .element(page.getByRole('button', { name: 'Draw', exact: true }))
      .toHaveAttribute('aria-pressed', 'false')
    await expect
      .element(page.getByRole('region', { name: 'App launcher' }))
      .not.toBeInTheDocument()
    await expect
      .element(
        page.getByRole('heading', { name: 'Notifications', exact: true }),
      )
      .not.toBeInTheDocument()
    await expect
      .element(page.getByRole('heading', { name: 'Overview', exact: true }))
      .not.toBeInTheDocument()
    await expect
      .element(page.getByRole('search', { name: 'Canvas search' }))
      .not.toBeInTheDocument()
    await expect
      .element(page.getByRole('listbox', { name: 'Switch windows' }))
      .not.toBeInTheDocument()
    await expect
      .element(page.getByRole('dialog', { name: 'Lock screen' }))
      .not.toBeInTheDocument()
  },
)

test('the power menu and password form fit on a narrow desktop', async () => {
  await page.viewport(390, 844)
  try {
    await renderDesktop()
    await page.getByRole('button', { name: 'Power', exact: true }).click()
    const menu = page.getByRole('menu', { name: 'Power', exact: true })
    const bounds = menu.element().getBoundingClientRect()
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(window.innerWidth)
    await page.getByRole('menuitem', { name: 'Turn off' }).click()
    const confirmation = page.getByRole('dialog', { name: 'Turn off?' })
    await expect.element(confirmation).toBeVisible()
    const confirmationBounds = confirmation.element().getBoundingClientRect()
    expect(confirmationBounds.left).toBeGreaterThanOrEqual(0)
    expect(confirmationBounds.right).toBeLessThanOrEqual(window.innerWidth)
    await confirmation
      .getByRole('button', { name: 'Cancel', exact: true })
      .click()
    await page.getByRole('button', { name: 'Power', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Lock screen' }).click()
    const password = page.getByLabelText('Password', { exact: true })
    await expect.element(password).toBeVisible()
    await page.getByRole('button', { name: 'Fill password' }).click()
    await expect.element(password).toHaveValue('hearthspace')
    await page.getByRole('button', { name: 'Unlock', exact: true }).click()
    await expect
      .element(page.getByRole('dialog', { name: 'Lock screen' }))
      .not.toBeInTheDocument()
  } finally {
    await page.viewport(1280, 900)
  }
})
