import { expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { completeSpeakerPairing } from './wireless-helpers'
import { renderDesktop } from './desktop'

async function openSettings() {
  await page.getByRole('button', { name: 'Open app launcher' }).click()
  await page
    .getByRole('region', { name: 'App launcher' })
    .getByRole('button', { name: 'Settings', exact: true })
    .click()
}

test('Wi-Fi changes sync both ways between Settings and the tray, including radio toggles and manual disconnection', async () => {
  await renderDesktop()
  await openSettings()
  const settings = page.getByRole('region', { name: 'Settings', exact: true })
  await settings.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
  await expect
    .element(settings.getByRole('heading', { name: 'Wi-Fi', exact: true }))
    .toBeVisible()
  await settings
    .getByRole('button', { name: 'Connect to Phone hotspot' })
    .click()

  const trigger = page.getByRole('button', { name: 'Wi-Fi settings' })
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Phone hotspot')
  await trigger.click()
  const tray = page.getByRole('region', { name: 'Wi-Fi', exact: true })
  await expect
    .element(
      tray.getByRole('button', { name: 'Disconnect from Phone hotspot' }),
    )
    .toBeVisible()
  await tray
    .getByRole('button', { name: 'Connect to Hearthspace guest' })
    .click()
  await expect
    .element(
      settings.getByRole('button', {
        name: 'Disconnect from Hearthspace guest',
      }),
    )
    .toBeVisible()
  await expect
    .element(settings.getByRole('button', { name: 'Connect to Phone hotspot' }))
    .toBeVisible()

  await tray.getByRole('checkbox', { name: 'Wi-Fi' }).click()
  const toggle = settings.getByRole('checkbox', { name: 'Wi-Fi' })
  await expect.element(toggle).not.toBeChecked()
  await expect
    .element(
      settings.getByRole('button', { name: /(?:Connect to|Disconnect from) / }),
    )
    .not.toBeInTheDocument()
  await userEvent.keyboard('{Escape}')
  await toggle.click()
  await expect
    .element(
      settings.getByRole('button', {
        name: 'Disconnect from Hearthspace guest',
      }),
    )
    .toBeVisible()
  await trigger.click()
  await tray
    .getByRole('button', { name: 'Disconnect from Hearthspace guest' })
    .click()
  await expect
    .element(
      settings.getByRole('button', { name: 'Connect to Hearthspace guest' }),
    )
    .toBeVisible()
  await userEvent.keyboard('{Escape}')
  await toggle.click()
  await toggle.click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Not connected')
  await expect
    .element(settings.getByRole('button', { name: /Disconnect from / }))
    .not.toBeInTheDocument()
  await expect
    .element(
      settings.getByRole('button', { name: 'Connect to Hearthspace guest' }),
    )
    .toBeVisible()
})

test('Bluetooth shares connections and pairings with the tray and keeps session state across Settings navigation and reopening', async () => {
  await renderDesktop()
  await openSettings()
  const settings = page.getByRole('region', { name: 'Settings', exact: true })
  await settings.getByRole('button', { name: 'Bluetooth', exact: true }).click()
  await expect
    .element(settings.getByRole('heading', { name: 'Bluetooth', exact: true }))
    .toBeVisible()
  await settings.getByRole('button', { name: 'Pair Pocket speaker' }).click()
  await completeSpeakerPairing()

  const trigger = page.getByRole('button', { name: 'Bluetooth settings' })
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · 2 connected')
  await trigger.click()
  const tray = page.getByRole('region', { name: 'Bluetooth', exact: true })
  await expect
    .element(tray.getByRole('button', { name: 'Disconnect Pocket speaker' }))
    .toBeVisible()
  await tray
    .getByRole('button', { name: 'Disconnect Studio headphones' })
    .click()
  await tray
    .getByRole('button', { name: 'Connect Mechanical keyboard' })
    .click()
  await expect
    .element(
      settings.getByRole('button', { name: 'Connect Studio headphones' }),
    )
    .toBeVisible()
  await expect
    .element(
      settings.getByRole('button', { name: 'Disconnect Mechanical keyboard' }),
    )
    .toBeVisible()
  await userEvent.keyboard('{Escape}')

  await settings.getByRole('checkbox', { name: 'Bluetooth' }).click()
  await expect
    .element(
      settings.getByRole('button', { name: /(?:Connect|Disconnect|Pair) / }),
    )
    .not.toBeInTheDocument()
  await trigger.click()
  const trayToggle = tray.getByRole('checkbox', { name: 'Bluetooth' })
  await expect.element(trayToggle).not.toBeChecked()
  await expect
    .element(tray.getByRole('button', { name: /Pocket speaker/ }))
    .not.toBeInTheDocument()
  await trayToggle.click()
  await expect
    .element(settings.getByRole('checkbox', { name: 'Bluetooth' }))
    .toBeChecked()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · Not connected')
  await expect
    .element(settings.getByRole('button', { name: 'Connect Pocket speaker' }))
    .toBeVisible()
  await expect
    .element(settings.getByRole('button', { name: /Disconnect / }))
    .not.toBeInTheDocument()
  await tray.getByRole('button', { name: 'Connect Pocket speaker' }).click()
  await expect
    .element(
      settings.getByRole('button', { name: 'Disconnect Pocket speaker' }),
    )
    .toBeVisible()
  await userEvent.keyboard('{Escape}')

  await settings
    .getByRole('button', { name: 'Appearance', exact: true })
    .click()
  await settings.getByRole('button', { name: 'Bluetooth', exact: true }).click()
  await expect
    .element(
      settings.getByRole('button', { name: 'Disconnect Pocket speaker' }),
    )
    .toBeVisible()
  await page
    .getByRole('button', { name: 'Close Settings', exact: true })
    .click()
  await expect.element(settings).not.toBeInTheDocument()
  await openSettings()
  await settings.getByRole('button', { name: 'Bluetooth', exact: true }).click()
  await expect
    .element(
      settings.getByRole('button', { name: 'Disconnect Pocket speaker' }),
    )
    .toBeVisible()
  await expect
    .element(
      settings.getByRole('button', { name: 'Connect Mechanical keyboard' }),
    )
    .toBeVisible()
})

test('wireless changes in one Settings window update another open Settings window', async () => {
  await renderDesktop()
  await openSettings()
  const windows = page
    .getByRole('region', { name: 'Settings', exact: true })
    .filter({
      has: page.getByRole('button', { name: 'Close Settings', exact: true }),
    })
  const first = windows.first()
  await first.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
  await first.getByRole('button', { name: 'Connect to Phone hotspot' }).click()
  await first.getByRole('button', { name: 'Bluetooth', exact: true }).click()
  await first.getByRole('button', { name: 'Pair Pocket speaker' }).click()
  await completeSpeakerPairing()

  await openSettings()
  const second = windows.last()
  await expect.poll(() => windows.elements().length).toBe(2)
  await second.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
  await second
    .getByRole('button', { name: 'Disconnect from Phone hotspot' })
    .click()
  await second.getByRole('button', { name: 'Bluetooth', exact: true }).click()
  await second
    .getByRole('button', { name: 'Disconnect Pocket speaker' })
    .click()
  await expect
    .element(first.getByRole('button', { name: 'Connect Pocket speaker' }))
    .toBeVisible()
  await second.getByRole('checkbox', { name: 'Bluetooth' }).click()
  await expect
    .element(first.getByRole('checkbox', { name: 'Bluetooth' }))
    .not.toBeChecked()
  await second.getByRole('button', { name: 'Close Settings' }).click()

  await first.getByRole('checkbox', { name: 'Bluetooth' }).click()
  await expect
    .element(first.getByRole('button', { name: 'Connect Pocket speaker' }))
    .toBeVisible()
  await first.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
  await expect
    .element(first.getByRole('button', { name: 'Connect to Phone hotspot' }))
    .toBeVisible()
  await expect
    .element(first.getByRole('button', { name: /Disconnect from / }))
    .not.toBeInTheDocument()
})

test('compact Settings navigation reaches both wireless categories and retains their choices', async () => {
  await page.viewport(500, 844)
  try {
    await renderDesktop()
    await openSettings()
    const settings = page.getByRole('region', { name: 'Settings', exact: true })
    const categories = settings.getByRole('button', {
      name: 'Settings categories',
    })
    const navigation = settings.getByRole('navigation', {
      name: 'Settings categories',
    })
    await expect.element(categories).toBeVisible()
    await categories.click()
    await navigation.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
    await expect
      .element(settings.getByRole('heading', { name: 'Wi-Fi', exact: true }))
      .toBeVisible()
    await expect.element(categories).toHaveAttribute('aria-expanded', 'false')
    await expect.element(categories).toHaveFocus()
    await settings
      .getByRole('button', { name: 'Connect to Phone hotspot' })
      .click()

    await categories.click()
    await navigation
      .getByRole('button', { name: 'Bluetooth', exact: true })
      .click()
    await expect
      .element(
        settings.getByRole('heading', { name: 'Bluetooth', exact: true }),
      )
      .toBeVisible()
    await expect.element(categories).toHaveAttribute('aria-expanded', 'false')
    await settings.getByRole('button', { name: 'Pair Pocket speaker' }).click()
    await completeSpeakerPairing()
    await categories.click()
    await userEvent.keyboard('{Escape}')
    await expect.element(categories).toHaveAttribute('aria-expanded', 'false')
    await expect.element(categories).toHaveFocus()
    await expect
      .element(
        settings.getByRole('button', { name: 'Disconnect Pocket speaker' }),
      )
      .toBeVisible()
    await categories.click()
    await navigation.getByRole('button', { name: 'Wi-Fi', exact: true }).click()
    await expect
      .element(
        settings.getByRole('button', { name: 'Disconnect from Phone hotspot' }),
      )
      .toBeVisible()
  } finally {
    await page.viewport(1280, 900)
  }
})
