import { afterEach, expect, test } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import { renderDesktop } from './desktop'

function projectPosition() {
  const { x, y } = page
    .getByRole('button', { name: 'Projects', exact: true })
    .element()
    .getBoundingClientRect()
  return { x, y }
}

afterEach(async () => {
  await commands.releasePointer()
})

test('Escape restores an interrupted desktop drag and allows the next drag', async () => {
  await renderDesktop()
  const before = projectPosition()
  await commands.startDesktopDrag('Projects', { x: 160, y: 60 })
  await expect
    .poll(projectPosition)
    .toEqual({ x: before.x + 160, y: before.y + 60 })

  await userEvent.keyboard('{Escape}')
  await commands.releasePointer()
  await expect.poll(projectPosition).toEqual(before)

  await commands.startDesktopDrag('Projects', { x: 120, y: 80 })
  await commands.releasePointer()
  await expect
    .poll(projectPosition)
    .toEqual({ x: before.x + 120, y: before.y + 80 })
})

test('opening search during a desktop drag restores the item before arranging previews', async () => {
  await renderDesktop()
  const before = projectPosition()
  await commands.startDesktopDrag('Projects', { x: 160, y: 60 })
  await expect
    .poll(projectPosition)
    .toEqual({ x: before.x + 160, y: before.y + 60 })

  await userEvent.keyboard('{Control>}k{/Control}')
  await expect
    .element(page.getByRole('search', { name: 'Canvas search' }))
    .toBeVisible()
  await commands.releasePointer()
  await userEvent.keyboard('{Escape}')
  await expect.poll(projectPosition).toEqual(before)

  await commands.startDesktopDrag('Projects', { x: 120, y: 80 })
  await commands.releasePointer()
  await expect
    .poll(projectPosition)
    .toEqual({ x: before.x + 120, y: before.y + 80 })
})
