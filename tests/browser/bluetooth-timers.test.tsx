import { act } from 'react'
import { expect, test, vi } from 'vitest'
import { page } from 'vitest/browser'
import { renderDesktop } from './desktop'

async function advanceTime(milliseconds: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(milliseconds)
  })
}

test('a keyboard connects on schedule while another device is connected, canceled, and retried', async () => {
  const desktop = await renderDesktop()
  await page
    .getByRole('button', { name: 'Bluetooth settings', exact: true })
    .click()
  const panel = page.getByRole('region', { name: 'Bluetooth', exact: true })
  await panel
    .getByRole('button', { name: 'Disconnect Studio headphones', exact: true })
    .click()

  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    await panel
      .getByRole('button', { name: 'Connect Mechanical keyboard', exact: true })
      .click()
    await advanceTime(200)
    await panel
      .getByRole('button', { name: 'Connect Studio headphones', exact: true })
      .click()
    await advanceTime(200)
    await panel
      .getByRole('button', {
        name: 'Cancel connection to Studio headphones',
        exact: true,
      })
      .click()
    await advanceTime(200)
    await panel
      .getByRole('button', { name: 'Connect Studio headphones', exact: true })
      .click()

    // The keyboard's original 700 ms deadline survives every headphones action.
    await advanceTime(100)
    expect(
      panel
        .getByRole('button', {
          name: 'Disconnect Mechanical keyboard',
          exact: true,
        })
        .element(),
    ).toBeVisible()

    // Canceling the first headphones attempt gives the retry its own deadline.
    await advanceTime(500)
    expect(
      panel
        .getByRole('button', {
          name: 'Cancel connection to Studio headphones',
          exact: true,
        })
        .element(),
    ).toBeVisible()
    await advanceTime(100)
    expect(
      panel
        .getByRole('button', {
          name: 'Disconnect Studio headphones',
          exact: true,
        })
        .element(),
    ).toBeVisible()
  } finally {
    await desktop.unmount()
    vi.useRealTimers()
  }
})
