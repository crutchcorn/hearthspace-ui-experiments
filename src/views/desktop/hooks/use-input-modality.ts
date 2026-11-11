import { useEffect, useState } from 'react'

/** Keep script-driven focus from carrying keyboard rings into pointer gestures. */
export default function useInputModality() {
  const [modality, setModality] = useState<'keyboard' | 'pointer'>('keyboard')

  useEffect(() => {
    const pointerDown = () => setModality('pointer')
    const keyDown = (event: KeyboardEvent) => {
      if (['Shift', 'Control', 'Alt', 'Meta'].includes(event.key)) return
      setModality('keyboard')
    }

    window.addEventListener('pointerdown', pointerDown, true)
    window.addEventListener('keydown', keyDown, true)
    return () => {
      window.removeEventListener('pointerdown', pointerDown, true)
      window.removeEventListener('keydown', keyDown, true)
    }
  }, [])

  return modality
}
