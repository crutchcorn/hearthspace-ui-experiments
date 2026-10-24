import { expect } from 'vitest'
import { page } from 'vitest/browser'

export async function completeSpeakerPairing() {
  const dialog = page.getByRole('dialog', {
    name: 'Pair Pocket speaker',
    exact: true,
  })
  await dialog.getByRole('button', { name: 'Fill PIN', exact: true }).click()
  await dialog.getByRole('button', { name: 'Pair', exact: true }).click()
  await expect.element(dialog).not.toBeInTheDocument()
}
