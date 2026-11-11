import type { SavedBackground, LoadedBackground } from '../types/background'

// Store the original image as a Blob, outside the small localStorage quota.
export function backgroundStorage(
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

export async function preparePhoto(
  saved: SavedBackground,
): Promise<LoadedBackground> {
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

export function releasePhoto(url: string) {
  URL.revokeObjectURL(url)
}
