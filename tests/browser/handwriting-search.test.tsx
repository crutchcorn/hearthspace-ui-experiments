import { expect, test, vi } from 'vitest'
import { commands, page, userEvent } from 'vitest/browser'
import type { HandwritingRequest } from '../../src/views/desktop/types/handwriting-protocol'
import { renderDesktop } from './desktop'

test('editing the query cancels pending ink and retry appends the new result', async () => {
  const requests: HandwritingRequest[] = []
  const worker = new EventTarget()
  vi.stubGlobal(
    'Worker',
    class {
      addEventListener = worker.addEventListener.bind(worker)
      postMessage(request: HandwritingRequest) {
        requests.push(request)
      }
    },
  )

  function reply(requestId: number, text: string) {
    worker.dispatchEvent(
      new MessageEvent('message', {
        data: { type: 'result', requestId, text },
      }),
    )
  }

  try {
    await renderDesktop()
    await userEvent.keyboard('{Control>}k{/Control}')
    const search = page.getByRole('searchbox', {
      name: /^Search apps, windows/,
    })
    await page.getByRole('button', { name: 'Use handwriting' }).click()
    const pad = page.getByRole('img', {
      name: 'Write one line to add to search',
    })
    const { x, y } = pad.element().getBoundingClientRect()
    await commands.drawCanvasStroke([
      { x: x + 15, y: y + 15 },
      { x: x + 30, y: y + 25 },
      { x: x + 45, y: y + 15 },
    ])

    const submitted = () =>
      requests.filter((request) => request.type === 'recognize')
    await expect.poll(() => submitted().length).toBe(1)
    await search.fill('quick')
    await expect
      .poll(() => requests.some((request) => request.type === 'cancel'))
      .toBe(true)
    reply(submitted()[0].requestId, 'stale')
    await expect.element(search).toHaveValue('quick')

    await page.getByRole('button', { name: 'Recognize handwriting' }).click()
    await expect.poll(() => submitted().length).toBe(2)
    reply(submitted()[1].requestId, 'notes')
    await expect.element(search).toHaveValue('quick notes')
    await expect
      .element(page.getByRole('button', { name: 'Clear handwriting' }))
      .toBeDisabled()
  } finally {
    vi.unstubAllGlobals()
  }
})
