import { useEffect, useRef, useState } from 'react'
import type { BackgroundFit, LoadedBackground } from '../types/background'
import {
  backgroundStorage,
  preparePhoto,
  releasePhoto,
} from '../services/background'

export default function useBackground() {
  const [photo, setPhoto] = useState<LoadedBackground | null>(null)
  const [busy, setBusy] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const pending = useRef(true)

  useEffect(() => {
    let cancelled = false
    void backgroundStorage('read')
      .then(async (saved) => {
        if (!saved || cancelled) return
        const loaded = await preparePhoto(saved)
        if (cancelled) releasePhoto(loaded.url)
        else setPhoto(loaded)
      })
      .catch(() => {
        // The default wallpaper remains usable when storage is unavailable.
      })
      .finally(() => {
        if (!cancelled) {
          pending.current = false
          setBusy(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const photoUrl = photo?.url
  useEffect(() => {
    return () => {
      if (photoUrl) releasePhoto(photoUrl)
    }
  }, [photoUrl])

  function beginChange() {
    if (pending.current) return false
    pending.current = true
    setBusy(true)
    setError(null)
    return true
  }

  function endChange() {
    pending.current = false
    setBusy(false)
  }

  async function remember(next: LoadedBackground | null) {
    setPhoto(next)
    try {
      await backgroundStorage(
        'write',
        next ? { blob: next.blob, name: next.name, fit: next.fit } : null,
      )
    } catch {
      setError(
        next
          ? 'This background is active for this session, but could not be saved.'
          : 'Default background is active for this session, but the saved photo could not be removed.',
      )
    }
  }

  async function upload(file: File) {
    if (!beginChange()) return
    try {
      if (file.type && !file.type.startsWith('image/')) {
        throw new Error('Choose an image file, such as PNG or JPEG.')
      }
      const next = await preparePhoto({
        blob: file,
        name: file.name,
        fit: photo?.fit ?? 'cover',
      })
      await remember(next)
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : 'Could not open this image.',
      )
    } finally {
      endChange()
    }
  }

  async function changeFit(fit: BackgroundFit) {
    if (!photo || !beginChange()) return
    try {
      await remember({ ...photo, fit })
    } finally {
      endChange()
    }
  }

  async function reset() {
    if (!beginChange()) return
    try {
      await remember(null)
    } finally {
      endChange()
    }
  }

  return { photo, busy, error, upload, changeFit, reset }
}
