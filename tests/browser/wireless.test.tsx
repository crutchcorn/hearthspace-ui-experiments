import { expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { SCENE_STORAGE_KEY } from '../../src/scene-storage'
import { renderDesktop } from './desktop'

test('Wi-Fi selects one network, remembers it across toggles, and respects a manual disconnect', async () => {
  await renderDesktop()
  const trigger = page.getByRole('button', { name: 'Wi-Fi settings' })
  await trigger.click()
  const panel = page.getByRole('region', { name: 'Wi-Fi', exact: true })
  const toggle = panel.getByRole('checkbox', { name: 'Wi-Fi' })
  await expect.element(toggle).toHaveFocus()
  await expect.element(toggle).toBeChecked()
  await expect
    .element(
      panel.getByRole('button', { name: 'Disconnect from Studio network' }),
    )
    .toBeVisible()
  await panel
    .getByRole('button', { name: 'Connect to Hearthspace guest' })
    .click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Hearthspace guest')
  await expect
    .element(panel.getByRole('button', { name: 'Connect to Studio network' }))
    .toBeVisible()

  await toggle.click()
  await expect.element(toggle).not.toBeChecked()
  await expect.element(trigger).toHaveAttribute('title', 'Wi-Fi · Wi-Fi off')
  await expect
    .element(panel.getByRole('button', { name: /Hearthspace guest/ }))
    .not.toBeInTheDocument()
  await toggle.click()
  await panel
    .getByRole('button', { name: 'Disconnect from Hearthspace guest' })
    .click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Not connected')
  await toggle.click()
  await toggle.click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Not connected')
  await panel.getByRole('button', { name: 'Connect to Phone hotspot' }).click()

  await userEvent.keyboard('{Escape}')
  await expect.element(panel).not.toBeInTheDocument()
  await expect.element(trigger).toHaveFocus()
  await trigger.click()
  await expect
    .element(
      panel.getByRole('button', { name: 'Disconnect from Phone hotspot' }),
    )
    .toBeVisible()
})

test('Bluetooth pairs devices, supports multiple connections, and keeps pairings after switching off', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Wi-Fi settings' }).click()
  const trigger = page.getByRole('button', { name: 'Bluetooth settings' })
  await trigger.click()
  await expect
    .element(page.getByRole('region', { name: 'Wi-Fi', exact: true }))
    .not.toBeInTheDocument()
  const panel = page.getByRole('region', { name: 'Bluetooth', exact: true })
  const toggle = panel.getByRole('checkbox', { name: 'Bluetooth' })
  await expect.element(toggle).toHaveFocus()
  await panel.getByRole('button', { name: 'Pair Pocket speaker' }).click()
  await panel
    .getByRole('button', { name: 'Connect Mechanical keyboard' })
    .click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · 3 connected')
  await panel
    .getByRole('button', { name: 'Disconnect Studio headphones' })
    .click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · 2 connected')

  await toggle.click()
  await expect.element(toggle).not.toBeChecked()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · Bluetooth off')
  await expect
    .element(panel.getByRole('button', { name: /Pocket speaker/ }))
    .not.toBeInTheDocument()
  await userEvent.keyboard(' ')
  await expect.element(toggle).toBeChecked()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · Not connected')
  await panel.getByRole('button', { name: 'Connect Pocket speaker' }).click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · 1 connected')

  await page.getByRole('button', { name: 'Sound settings' }).click()
  await expect.element(panel).not.toBeInTheDocument()
  await trigger.click()
  await expect
    .element(page.getByRole('slider', { name: 'Sound' }))
    .not.toBeInTheDocument()
  await expect
    .element(panel.getByRole('button', { name: 'Disconnect Pocket speaker' }))
    .toBeVisible()
  await userEvent.keyboard('{Escape}')
  await expect.element(trigger).toHaveFocus()
})

test('wireless state stays consistent in search and through locking', async () => {
  await renderDesktop()
  await page.getByRole('button', { name: 'Wi-Fi settings' }).click()
  await page.getByRole('button', { name: 'Connect to Phone hotspot' }).click()
  await userEvent.keyboard('{Control>}k{/Control}')
  const search = page.getByRole('searchbox', {
    name: 'Search apps, windows, files, folders, drawings, tools, and widgets',
  })
  await search.fill('wifi')
  await expect
    .element(
      page.getByRole('button', { name: 'Wi-Fi Phone hotspot', exact: true }),
    )
    .toBeVisible()
  await search.fill('bluetooth')
  await page
    .getByRole('button', { name: 'Bluetooth 1 connected', exact: true })
    .click()
  await expect.element(search).not.toBeInTheDocument()
  await page.getByRole('button', { name: 'Pair Pocket speaker' }).click()

  await page.getByRole('button', { name: 'Power', exact: true }).click()
  await page.getByRole('menuitem', { name: 'Lock screen' }).click()
  const lockscreen = page.getByRole('dialog', { name: 'Lock screen' })
  await expect
    .element(lockscreen.getByTitle('Phone hotspot', { exact: true }))
    .toBeVisible()
  await expect
    .element(lockscreen.getByTitle('Bluetooth · 2 connected', { exact: true }))
    .toBeVisible()
  await page.getByRole('button', { name: 'Fill password' }).click()
  await page.getByRole('button', { name: 'Unlock', exact: true }).click()
  await page.getByRole('button', { name: 'Bluetooth settings' }).click()
  await expect
    .element(page.getByRole('button', { name: 'Disconnect Pocket speaker' }))
    .toBeVisible()
  await userEvent.keyboard('{Control>}k{/Control}')
  await search.fill('bluetooth')
  await expect
    .element(
      page.getByRole('button', { name: 'Bluetooth 2 connected', exact: true }),
    )
    .toBeVisible()
})

test('Bluetooth can show live connection details through Change layout and save that choice', async () => {
  await renderDesktop()
  const trigger = page.getByRole('button', { name: 'Bluetooth settings' })
  const layoutItem = page.elementLocator(
    document.querySelector('[data-layout-widget="bluetooth"]')!,
  )
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await layoutItem.click()
  await page.getByRole('button', { name: 'Show details', exact: true }).click()
  await expect.element(trigger).toHaveTextContent('1 connected')
  await page.getByRole('button', { name: 'Done changing layout' }).click()
  await trigger.click()
  await page.getByRole('button', { name: 'Pair Pocket speaker' }).click()
  await expect.element(trigger).toHaveTextContent('2 connected')
  await expect
    .poll(() => {
      const saved = JSON.parse(
        localStorage.getItem(SCENE_STORAGE_KEY) ?? 'null',
      )
      return saved?.layout.expanded?.bluetooth
    })
    .toBe(true)

  await userEvent.keyboard('{Escape}')
  await page.getByRole('button', { name: 'Change layout', exact: true }).click()
  await layoutItem.click()
  await page
    .getByRole('button', { name: 'Shrink to icon', exact: true })
    .click()
  await expect.element(trigger).toHaveTextContent('')
})

test('wireless pickers fit and stay interactive on a narrow desktop', async () => {
  await page.viewport(390, 844)
  try {
    await renderDesktop()
    for (const name of ['Wi-Fi', 'Bluetooth']) {
      const trigger = page.getByRole('button', { name: `${name} settings` })
      const triggerBounds = trigger.element().getBoundingClientRect()
      expect(triggerBounds.left).toBeGreaterThanOrEqual(0)
      expect(triggerBounds.right).toBeLessThanOrEqual(window.innerWidth)
      await trigger.click()
      const panel = page.getByRole('region', { name, exact: true })
      const bounds = panel.element().getBoundingClientRect()
      expect(bounds.width).toBeGreaterThan(250)
      expect(bounds.left).toBeGreaterThanOrEqual(0)
      expect(bounds.right).toBeLessThanOrEqual(window.innerWidth)
      expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight)
      await panel
        .getByRole('button', {
          name:
            name === 'Wi-Fi'
              ? 'Connect to Phone hotspot'
              : 'Pair Pocket speaker',
        })
        .click()
      await panel.getByRole('checkbox', { name }).click()
      await expect
        .element(panel.getByRole('checkbox', { name }))
        .not.toBeChecked()
    }
  } finally {
    await page.viewport(1280, 900)
  }
})
