import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import {
  drawCanvasStroke,
  releasePointer,
  startDesktopDrag,
} from './tests/browser/pointer-commands.ts'

export default defineConfig({
  plugins: [react()],
  test: {
    include: ['tests/browser/**/*.test.tsx'],
    setupFiles: ['tests/browser/setup.ts'],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      commands: { startDesktopDrag, releasePointer, drawCanvasStroke },
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1280, height: 900 },
      screenshotFailures: false,
    },
  },
})
