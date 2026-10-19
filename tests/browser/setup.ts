import { afterEach, beforeEach } from 'vitest'
import { cleanup } from 'vitest-browser-react'
import '../../src/index.css'

beforeEach(() => {
  localStorage.clear()
  const root = document.createElement('div')
  root.id = 'root'
  document.body.append(root)
})

afterEach(async () => {
  await cleanup()
  document.getElementById('root')?.remove()
  localStorage.clear()
})
