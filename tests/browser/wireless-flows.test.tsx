import { expect, test } from 'vitest'
import { page, userEvent } from 'vitest/browser'
import { renderDesktop, windowBounds } from './desktop'
import { completeSpeakerPairing } from './wireless-helpers'

test('a secured network validates the password and allows cancellation without losing the current connection', async () => {
  await renderDesktop()
  const trigger = page.getByRole('button', {
    name: 'Wi-Fi settings',
    exact: true,
  })
  await trigger.click()
  const panel = page.getByRole('region', { name: 'Wi-Fi', exact: true })
  await panel
    .getByRole('button', { name: 'Connect to Workshop', exact: true })
    .click()
  const prompt = page.getByRole('dialog', {
    name: 'Connect to Workshop',
    exact: true,
  })
  const password = prompt.getByLabelText('Password', { exact: true })
  await expect.element(password).toHaveFocus()
  await password.fill('wrong-password')
  await prompt.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect.element(prompt.getByRole('alert')).toBeVisible()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Studio network')
  await userEvent.keyboard('{Escape}')
  await expect.element(prompt).not.toBeInTheDocument()
  await expect.element(panel).toBeVisible()
  await expect
    .element(
      panel.getByRole('button', { name: 'Connect to Workshop', exact: true }),
    )
    .toHaveFocus()

  await panel
    .getByRole('button', { name: 'Connect to Workshop', exact: true })
    .click()
  await prompt
    .getByRole('button', { name: 'Fill password', exact: true })
    .click()
  await expect.element(password).toHaveAttribute('type', 'password')
  await prompt.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect.element(trigger).toHaveAttribute('title', 'Wi-Fi · Workshop')
  await expect.element(prompt).not.toBeInTheDocument()
  await expect
    .element(
      panel.getByRole('button', {
        name: 'Disconnect from Workshop',
        exact: true,
      }),
    )
    .toBeVisible()
})

test('Bluetooth validates a pairing PIN and forgetting the device requires pairing again', async () => {
  await renderDesktop()
  const trigger = page.getByRole('button', {
    name: 'Bluetooth settings',
    exact: true,
  })
  await trigger.click()
  const panel = page.getByRole('region', { name: 'Bluetooth', exact: true })
  await panel
    .getByRole('button', { name: 'Pair Pocket speaker', exact: true })
    .click()
  const prompt = page.getByRole('dialog', {
    name: 'Pair Pocket speaker',
    exact: true,
  })
  await prompt.getByLabelText('PIN', { exact: true }).fill('1234')
  await prompt.getByRole('button', { name: 'Pair', exact: true }).click()
  await expect.element(prompt.getByRole('alert')).toBeVisible()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · 1 connected')
  await userEvent.keyboard('{Escape}')
  await expect.element(prompt).not.toBeInTheDocument()
  await expect.element(panel).toBeVisible()
  await panel
    .getByRole('button', { name: 'Pair Pocket speaker', exact: true })
    .click()
  await completeSpeakerPairing()
  await expect
    .element(
      panel.getByRole('button', {
        name: 'Disconnect Pocket speaker',
        exact: true,
      }),
    )
    .toHaveFocus()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · 2 connected')
  await panel
    .getByRole('button', { name: 'Pocket speaker details', exact: true })
    .click()
  const details = page.getByRole('dialog', {
    name: 'Pocket speaker details',
    exact: true,
  })
  await details
    .getByRole('button', { name: 'Forget device…', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Forget device', exact: true })
    .click()
  await expect
    .element(
      panel.getByRole('button', { name: 'Pair Pocket speaker', exact: true }),
    )
    .toHaveFocus()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · 1 connected')
})

test('wireless prompts fit on a narrow screen and isolate desktop shortcuts', async () => {
  await page.viewport(390, 844)
  try {
    await renderDesktop()
    const before = windowBounds('Scratchpad')
    await page
      .getByRole('button', { name: 'Wi-Fi settings', exact: true })
      .click()
    await page
      .getByRole('button', { name: 'Connect to Workshop', exact: true })
      .click()
    const prompt = page.getByRole('dialog', {
      name: 'Connect to Workshop',
      exact: true,
    })
    await expect.element(prompt).toBeVisible()
    const bounds = prompt.element().getBoundingClientRect()
    expect(bounds.left).toBeGreaterThanOrEqual(0)
    expect(bounds.right).toBeLessThanOrEqual(window.innerWidth)
    expect(bounds.bottom).toBeLessThanOrEqual(window.innerHeight)
    await userEvent.keyboard('{Control>}k{/Control}{Control>}1{/Control}')
    await expect.element(prompt).toBeVisible()
    await prompt
      .getByRole('button', { name: 'Fill password', exact: true })
      .click()
    await userEvent.keyboard('{Tab}')
    await userEvent.keyboard('dgnm/{Control>}k{/Control}')
    await userEvent.keyboard('{Escape}')
    await expect.element(prompt).not.toBeInTheDocument()
    await expect
      .element(page.getByRole('region', { name: 'Wi-Fi', exact: true }))
      .toBeVisible()
    await expect
      .element(page.getByRole('search', { name: 'Canvas search' }))
      .not.toBeInTheDocument()
    await expect
      .element(page.getByRole('listbox', { name: 'Switch windows' }))
      .not.toBeInTheDocument()
    expect(windowBounds('Scratchpad')).toEqual(before)
  } finally {
    await page.viewport(1280, 900)
  }
})

test('Bluetooth discovery supports code comparison and keyboard passkey confirmation', async () => {
  await renderDesktop()
  await page
    .getByRole('button', { name: 'Bluetooth settings', exact: true })
    .click()
  const panel = page.getByRole('region', { name: 'Bluetooth', exact: true })
  await panel
    .getByRole('button', { name: 'Scan for devices', exact: true })
    .click()
  await panel
    .getByRole('button', { name: 'Pair Nearby phone', exact: true })
    .click()
  const phone = page.getByRole('dialog', {
    name: 'Pair Nearby phone',
    exact: true,
  })
  await expect
    .element(phone.getByLabelText('Pairing code'))
    .toHaveTextContent('628 415')
  await phone
    .getByRole('button', { name: 'Codes don’t match', exact: true })
    .click()
  await expect.element(phone).not.toBeInTheDocument()
  await panel
    .getByRole('button', { name: 'Pair Nearby phone', exact: true })
    .click()
  await phone.getByRole('button', { name: 'Codes match', exact: true }).click()
  await expect.element(phone).not.toBeInTheDocument()
  await expect
    .element(
      panel.getByRole('button', {
        name: 'Disconnect Nearby phone',
        exact: true,
      }),
    )
    .toBeVisible()

  await panel
    .getByRole('button', { name: 'Mechanical keyboard details', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Forget device…', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Forget device', exact: true })
    .click()
  await panel
    .getByRole('button', { name: 'Pair Mechanical keyboard', exact: true })
    .click()
  const keyboard = page.getByRole('dialog', {
    name: 'Pair Mechanical keyboard',
    exact: true,
  })
  await expect
    .element(keyboard.getByLabelText('Keyboard passkey'))
    .toHaveTextContent('735 204')
  await keyboard
    .getByRole('button', { name: 'Code entered', exact: true })
    .click()
  await expect.element(keyboard).not.toBeInTheDocument()
  await expect
    .element(
      panel.getByRole('button', {
        name: 'Disconnect Mechanical keyboard',
        exact: true,
      }),
    )
    .toBeVisible()
})

test('Bluetooth device settings drive reconnection and recover from an out-of-range failure', async () => {
  await renderDesktop()
  const trigger = page.getByRole('button', {
    name: 'Bluetooth settings',
    exact: true,
  })
  await trigger.click()
  const panel = page.getByRole('region', { name: 'Bluetooth', exact: true })
  await panel
    .getByRole('button', { name: 'Studio headphones details', exact: true })
    .click()
  let details = page.getByRole('dialog', {
    name: 'Studio headphones details',
    exact: true,
  })
  await details
    .getByLabelText('Device name', { exact: true })
    .fill('Travel headphones')
  await details
    .getByRole('combobox', { name: 'Audio profile', exact: true })
    .selectOptions('hands-free')
  await details
    .getByRole('checkbox', {
      name: 'Automatically reconnect when Bluetooth turns on',
      exact: true,
    })
    .click()
  await details
    .getByRole('button', { name: 'Save changes', exact: true })
    .click()
  await panel.getByRole('checkbox', { name: 'Bluetooth', exact: true }).click()
  await panel.getByRole('checkbox', { name: 'Bluetooth', exact: true }).click()
  await expect
    .element(
      panel.getByRole('button', {
        name: 'Disconnect Travel headphones',
        exact: true,
      }),
    )
    .toBeVisible()
  await panel
    .getByRole('button', { name: 'Travel headphones details', exact: true })
    .click()
  details = page.getByRole('dialog', {
    name: 'Travel headphones details',
    exact: true,
  })
  await expect
    .element(
      details.getByRole('combobox', { name: 'Audio profile', exact: true }),
    )
    .toHaveValue('hands-free')
  const nearby = details.getByRole('checkbox', {
    name: 'Device nearby',
    exact: true,
  })
  await nearby.click()
  await details.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect.element(details.getByRole('alert')).toBeVisible()
  await nearby.click()
  await details
    .getByRole('button', { name: 'Retry connection', exact: true })
    .click()
  await expect
    .element(details.getByRole('button', { name: 'Disconnect', exact: true }))
    .toBeVisible()
  await details.getByRole('button', { name: 'Close', exact: true }).click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Bluetooth · 1 connected')
})

test('adapter discoverability gates incoming pairing and disabling new pairings preserves known devices', async () => {
  await renderDesktop()
  await page
    .getByRole('button', { name: 'Bluetooth settings', exact: true })
    .click()
  const panel = page.getByRole('region', { name: 'Bluetooth', exact: true })
  await panel
    .getByRole('button', { name: 'Adapter settings', exact: true })
    .click()
  const settings = page.getByRole('dialog', {
    name: 'Bluetooth settings',
    exact: true,
  })
  const incoming = settings.getByRole('button', {
    name: 'Simulate incoming pairing',
    exact: true,
  })
  await expect.element(incoming).toBeDisabled()
  await settings
    .getByLabelText('Computer name', { exact: true })
    .fill('Living room desktop')
  await settings
    .getByRole('checkbox', {
      name: 'Discoverable to nearby devices',
      exact: true,
    })
    .click()
  await incoming.click()
  const pairing = page.getByRole('dialog', {
    name: 'Pair Nearby phone',
    exact: true,
  })
  await expect
    .poll(() => pairing.element().textContent)
    .toContain('Living room desktop')
  await pairing
    .getByRole('button', { name: 'Codes don’t match', exact: true })
    .click()
  await panel
    .getByRole('button', { name: 'Adapter settings', exact: true })
    .click()
  await expect
    .element(settings.getByLabelText('Computer name', { exact: true }))
    .toHaveValue('Living room desktop')
  await settings
    .getByRole('checkbox', { name: 'Allow new pairings', exact: true })
    .click()
  await settings
    .getByRole('button', { name: 'Save settings', exact: true })
    .click()
  await expect
    .element(
      panel.getByRole('button', { name: 'Pair Pocket speaker', exact: true }),
    )
    .toBeDisabled()
  await panel
    .getByRole('button', { name: 'Connect Mechanical keyboard', exact: true })
    .click()
  await expect
    .element(
      panel.getByRole('button', {
        name: 'Disconnect Mechanical keyboard',
        exact: true,
      }),
    )
    .toBeVisible()
})

test('Wi-Fi details validate and save network configuration, auto-connect, and forget actions', async () => {
  await renderDesktop()
  const trigger = page.getByRole('button', {
    name: 'Wi-Fi settings',
    exact: true,
  })
  await trigger.click()
  const panel = page.getByRole('region', { name: 'Wi-Fi', exact: true })
  await panel
    .getByRole('button', { name: 'Studio network details', exact: true })
    .click()
  const details = page.getByRole('dialog', {
    name: 'Studio network details',
    exact: true,
  })
  await details
    .getByRole('checkbox', { name: 'Auto-connect', exact: true })
    .click()
  await details
    .getByRole('checkbox', { name: 'Metered connection', exact: true })
    .click()
  await details
    .getByRole('checkbox', { name: 'Private MAC address', exact: true })
    .click()
  await details
    .getByRole('combobox', { name: 'IPv4 configuration', exact: true })
    .selectOptions('manual')
  await details.getByLabelText('IP address', { exact: true }).fill('999.2.3.4')
  await details.getByRole('button', { name: 'Save', exact: true }).click()
  await expect.element(details.getByRole('alert')).toBeVisible()
  await details
    .getByLabelText('IP address', { exact: true })
    .fill('192.168.1.55')
  await details
    .getByRole('combobox', { name: 'DNS configuration', exact: true })
    .selectOptions('manual')
  await details.getByLabelText(/^DNS servers/).fill('1.1.1.1, 8.8.8.8')
  await details.getByRole('button', { name: 'Save', exact: true }).click()
  await expect.element(details).not.toBeInTheDocument()
  await panel
    .getByRole('button', { name: 'Studio network details', exact: true })
    .click()
  await expect
    .element(details.getByLabelText('IP address', { exact: true }))
    .toHaveValue('192.168.1.55')
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
      details.getByRole('checkbox', {
        name: 'Private MAC address',
        exact: true,
      }),
    )
    .not.toBeChecked()
  await details.getByRole('button', { name: 'Cancel', exact: true }).click()
  await panel.getByRole('checkbox', { name: 'Wi-Fi', exact: true }).click()
  await panel.getByRole('checkbox', { name: 'Wi-Fi', exact: true }).click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Not connected')
  await panel
    .getByRole('button', { name: 'Connect to Studio network', exact: true })
    .click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Studio network')
  await panel
    .getByRole('button', { name: 'Studio network details', exact: true })
    .click()
  await details
    .getByRole('button', { name: 'Forget network', exact: true })
    .click()
  const forget = page.getByRole('dialog', {
    name: 'Forget Studio network?',
    exact: true,
  })
  await forget.getByRole('button', { name: 'Cancel', exact: true }).click()
  await expect.element(details).toBeVisible()
  await details
    .getByRole('button', { name: 'Forget network', exact: true })
    .click()
  await forget.getByRole('button', { name: 'Forget', exact: true }).click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Not connected')
  await panel
    .getByRole('button', { name: 'Connect to Studio network', exact: true })
    .click()
  await expect
    .element(
      page
        .getByRole('dialog', { name: 'Connect to Studio network', exact: true })
        .getByLabelText('Password', { exact: true }),
    )
    .toHaveValue('')
})

test('hidden networks and captive portal access work without leaving the desktop', async () => {
  await renderDesktop()
  const location = window.location.href
  const trigger = page.getByRole('button', {
    name: 'Wi-Fi settings',
    exact: true,
  })
  await trigger.click()
  const panel = page.getByRole('region', { name: 'Wi-Fi', exact: true })
  await panel
    .getByRole('button', { name: 'Refresh networks', exact: true })
    .click()
  await expect
    .element(panel.getByRole('button', { name: 'Scanning…', exact: true }))
    .toBeDisabled()
  await expect
    .element(
      panel.getByRole('button', { name: 'Refresh networks', exact: true }),
    )
    .toBeEnabled()
  await panel
    .getByRole('button', { name: 'Join hidden network', exact: true })
    .click()
  const hidden = page.getByRole('dialog', {
    name: 'Join hidden network',
    exact: true,
  })
  await hidden.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect.element(hidden.getByRole('alert')).toBeVisible()
  await hidden
    .getByLabelText('Network name', { exact: true })
    .fill('Private studio')
  await hidden
    .getByRole('button', { name: 'Fill password', exact: true })
    .click()
  await hidden.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Private studio')
  await panel
    .getByRole('button', { name: 'Private studio details', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Forget network', exact: true })
    .click()
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Forget', exact: true })
    .click()
  await expect
    .element(
      panel.getByRole('button', {
        name: 'Private studio details',
        exact: true,
      }),
    )
    .not.toBeInTheDocument()

  await panel
    .getByRole('button', { name: 'Connect to Hearthspace guest', exact: true })
    .click()
  await panel
    .getByRole('button', { name: 'Sign in to Hearthspace guest', exact: true })
    .click()
  const portal = page.getByRole('dialog', {
    name: 'Sign in to Hearthspace guest',
    exact: true,
  })
  await expect
    .element(
      portal.getByRole('button', { name: 'Connect to internet', exact: true }),
    )
    .toBeDisabled()
  await portal
    .getByRole('checkbox', {
      name: 'I agree to the guest network terms',
      exact: true,
    })
    .click()
  await portal
    .getByRole('button', { name: 'Connect to internet', exact: true })
    .click()
  await expect.element(portal).not.toBeInTheDocument()
  await expect
    .element(
      panel.getByRole('button', {
        name: 'Sign in to Hearthspace guest',
        exact: true,
      }),
    )
    .not.toBeInTheDocument()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Hearthspace guest')
  expect(window.location.href).toBe(location)
})

test('enterprise credentials, failed connections, retries, and no-internet status have distinct outcomes', async () => {
  await renderDesktop()
  const trigger = page.getByRole('button', {
    name: 'Wi-Fi settings',
    exact: true,
  })
  await trigger.click()
  const panel = page.getByRole('region', { name: 'Wi-Fi', exact: true })
  await panel
    .getByRole('button', { name: 'Connect to Hearthspace office', exact: true })
    .click()
  const enterprise = page.getByRole('dialog', {
    name: 'Connect to Hearthspace office',
    exact: true,
  })
  await enterprise
    .getByRole('button', { name: 'Fill identity', exact: true })
    .click()
  await enterprise
    .getByRole('button', { name: 'Fill password', exact: true })
    .click()
  await enterprise
    .getByRole('combobox', { name: 'Certificate validation', exact: true })
    .selectOptions('system')
  await enterprise.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect.element(enterprise.getByRole('alert')).toBeVisible()
  await enterprise
    .getByRole('combobox', { name: 'Certificate validation', exact: true })
    .selectOptions('hearthspace')
  await enterprise.getByRole('button', { name: 'Connect', exact: true }).click()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Hearthspace office')
  await panel
    .getByRole('button', { name: 'Connect to Garden relay', exact: true })
    .click()
  await expect.element(panel.getByRole('alert')).toBeVisible()
  await expect
    .element(trigger)
    .toHaveAttribute('title', 'Wi-Fi · Hearthspace office')
  await panel.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect.element(trigger).toHaveAttribute('title', 'Wi-Fi · Garden relay')
  await panel
    .getByRole('button', { name: 'Connect to Reading room', exact: true })
    .click()
  await expect.element(trigger).toHaveAttribute('title', 'Wi-Fi · Reading room')
  await expect
    .poll(
      () =>
        panel
          .getByRole('button', {
            name: 'Disconnect from Reading room',
            exact: true,
          })
          .element().textContent,
    )
    .toContain('No internet')
})
