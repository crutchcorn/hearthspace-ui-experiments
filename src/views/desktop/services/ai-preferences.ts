const STORAGE_KEY = 'hearthspace-ai-enabled-v1'

export function loadEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function saveEnabled(enabled: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, String(enabled))
  } catch {
    // Keep the preference for this session when storage is unavailable.
  }
}
