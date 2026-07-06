export const PUSH_PREFERENCE_STORAGE_KEY = 'flc.pushEnabled'

/**
 * Per-device preference for whether this user wants push notifications.
 * Separate from the browser's `Notification.permission` — the browser grant is
 * a hard gate we cannot revoke programmatically, while this is a local mute the
 * user controls from Settings. Push only registers when both are "on".
 */
export const readPushEnabled = (): boolean => {
  try {
    return window.localStorage.getItem(PUSH_PREFERENCE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export const writePushEnabled = (enabled: boolean): void => {
  try {
    window.localStorage.setItem(PUSH_PREFERENCE_STORAGE_KEY, String(enabled))
  } catch {
    // localStorage unavailable (private browsing, quota, SSR) — silently ignore
  }
}

const PUSH_TOKEN_STORAGE_KEY = 'flc.pushToken'

/**
 * The last FCM token minted on this device, kept so we can unregister it
 * server-side when the user turns notifications off. Not a secret — it only
 * identifies this device to FCM.
 */
export const readPushToken = (): string | null => {
  try {
    return window.localStorage.getItem(PUSH_TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export const writePushToken = (token: string): void => {
  try {
    window.localStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token)
  } catch {
    // localStorage unavailable — silently ignore
  }
}

export const clearPushToken = (): void => {
  try {
    window.localStorage.removeItem(PUSH_TOKEN_STORAGE_KEY)
  } catch {
    // localStorage unavailable — silently ignore
  }
}
