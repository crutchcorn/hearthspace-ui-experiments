import { useEffect, useRef, useState } from 'react'

export type BackgroundFit = 'repeat' | 'stretch' | 'contain' | 'cover'

export interface BackgroundPhoto {
  url: string
  name: string
  fit: BackgroundFit
}

interface SavedBackground {
  blob: Blob
  name: string
  fit: BackgroundFit
}

type LoadedBackground = SavedBackground & BackgroundPhoto

// Store the original image as a Blob, outside the small localStorage quota.
function backgroundStorage(
  action: 'read' | 'write',
  photo: SavedBackground | null = null,
): Promise<SavedBackground | null> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open('hearthspace-background-v1', 1)
    let blocked = false
    opening.onupgradeneeded = () => {
      opening.result.createObjectStore('background')
    }
    opening.onerror = () => reject(opening.error)
    opening.onblocked = () => {
      blocked = true
      reject(new Error('Background storage is unavailable.'))
    }
    opening.onsuccess = () => {
      const database = opening.result
      if (blocked) {
        database.close()
        return
      }
      database.onversionchange = () => database.close()
      const transaction = database.transaction(
        'background',
        action === 'read' ? 'readonly' : 'readwrite',
      )
      const store = transaction.objectStore('background')
      const request =
        action === 'read'
          ? store.get('photo')
          : photo
            ? store.put(photo, 'photo')
            : store.delete('photo')
      transaction.oncomplete = () => {
        database.close()
        const saved = action === 'read' ? request.result : null
        resolve(
          saved?.blob instanceof Blob &&
            typeof saved.name === 'string' &&
            ['repeat', 'stretch', 'contain', 'cover'].includes(saved.fit)
            ? saved
            : null,
        )
      }
      transaction.onabort = () => {
        database.close()
        reject(transaction.error)
      }
    }
  })
}

async function preparePhoto(saved: SavedBackground): Promise<LoadedBackground> {
  const url = URL.createObjectURL(saved.blob)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return { ...saved, url }
  } catch {
    URL.revokeObjectURL(url)
    throw new Error(
      'Choose an image your browser can open, such as PNG or JPEG.',
    )
  }
}

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
        if (cancelled) URL.revokeObjectURL(loaded.url)
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
      if (photoUrl) URL.revokeObjectURL(photoUrl)
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
