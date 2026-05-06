export const DEFAULT_SCOPE_STORAGE_KEY = 'flc.defaultScopeKey'

export const readDefaultScopeKey = (): string | null => {
  try {
    return window.localStorage.getItem(DEFAULT_SCOPE_STORAGE_KEY)
  } catch {
    return null
  }
}

export const writeDefaultScopeKey = (key: string): void => {
  try {
    window.localStorage.setItem(DEFAULT_SCOPE_STORAGE_KEY, key)
  } catch {
    // localStorage unavailable (private browsing, quota, SSR) — silently ignore
  }
}

export const clearDefaultScopeKey = (): void => {
  try {
    window.localStorage.removeItem(DEFAULT_SCOPE_STORAGE_KEY)
  } catch {
    // localStorage unavailable — silently ignore
  }
}
