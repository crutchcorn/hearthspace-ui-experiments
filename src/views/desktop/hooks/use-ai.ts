import { useCallback, useEffect, useRef, useState } from 'react'
import { loadEnabled, saveEnabled } from '../services/ai-preferences'
import type { AIControls } from '../types/ai'

const DOWNLOAD_DURATION = 4_000

export default function useAI(): AIControls {
  const [state, setState] = useState(() => ({
    enabled: loadEnabled(),
    downloading: false,
    progress: 0,
  }))
  const downloadTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(
    () => () => {
      if (downloadTimer.current !== null) {
        clearInterval(downloadTimer.current)
      }
    },
    [],
  )

  const setEnabled = useCallback(
    (enabled: boolean) => {
      if (!enabled) {
        if (downloadTimer.current !== null) {
          clearInterval(downloadTimer.current)
          downloadTimer.current = null
        }
        saveEnabled(false)
        setState({ enabled: false, downloading: false, progress: 0 })
        return
      }

      if (state.enabled || downloadTimer.current !== null) return

      const startedAt = Date.now()
      setState({ enabled: false, downloading: true, progress: 0 })
      downloadTimer.current = setInterval(() => {
        const progress = Math.min(
          100,
          Math.floor(((Date.now() - startedAt) / DOWNLOAD_DURATION) * 100),
        )

        if (progress === 100) {
          clearInterval(downloadTimer.current!)
          downloadTimer.current = null
          saveEnabled(true)
          setState({ enabled: true, downloading: false, progress: 100 })
          return
        }

        setState({ enabled: false, downloading: true, progress })
      }, 100)
    },
    [state.enabled],
  )

  return { ...state, setEnabled }
}
