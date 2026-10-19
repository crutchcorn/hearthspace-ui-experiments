import { page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import App from '../../src/App'

export function renderDesktop() {
  return render(<App />, { container: document.getElementById('root')! })
}

export function windowElement(title: string) {
  return page
    .getByRole('button', { name: `Close ${title}`, exact: true })
    .element()
    .closest('section')!
}

export function windowBounds(title: string) {
  const { x, y, width, height } = windowElement(title).getBoundingClientRect()
  return { x, y, width, height }
}
