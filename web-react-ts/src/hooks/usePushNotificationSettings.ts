import { useCallback, useEffect, useState } from 'react'
import { useMutation } from '@apollo/client'
import {
  enablePushNotifications,
  isPushSupported,
} from 'services/firebaseMessaging'
import {
  clearPushToken,
  readPushEnabled,
  readPushToken,
  writePushEnabled,
  writePushToken,
} from 'lib/push-preference-storage'
import {
  REGISTER_PUSH_TOKEN,
  UNREGISTER_PUSH_TOKEN,
} from './pushNotificationsGQL'

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

const readBrowserPermission = (): PushPermission => {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission
}

export interface PushNotificationSettings {
  /** Whether the browser can do web push. `undefined` until the async check resolves. */
  supported: boolean | undefined
  /** Browser-level permission, or 'unsupported'. */
  permission: PushPermission
  /** Device-level opt-in preference (only meaningful when permission granted). */
  enabled: boolean
  /** An enable request is in flight. */
  enabling: boolean
  /** Request permission (user gesture) + register this device. */
  enable: () => Promise<void>
  /** Mute push on this device. Does not revoke the browser-level grant. */
  disable: () => void
}

/**
 * Drives the Settings notifications toggle. Reflects the current browser
 * permission and the device opt-in preference, and exposes a user-gesture
 * enable path that requests permission and registers for FCM, surfacing a
 * friendly result. Never throws to the caller.
 */
export const usePushNotificationSettings = (): PushNotificationSettings => {
  const [supported, setSupported] = useState<boolean | undefined>(undefined)
  const [permission, setPermission] = useState<PushPermission>(() =>
    readBrowserPermission()
  )
  const [enabled, setEnabled] = useState<boolean>(() => readPushEnabled())
  const [enabling, setEnabling] = useState(false)

  const [registerPushToken] = useMutation(REGISTER_PUSH_TOKEN)
  const [unregisterPushToken] = useMutation(UNREGISTER_PUSH_TOKEN)

  useEffect(() => {
    let active = true
    void isPushSupported().then((value) => {
      if (active) setSupported(value)
    })
    return () => {
      active = false
    }
  }, [])

  const enable = useCallback(async (): Promise<void> => {
    setEnabling(true)
    try {
      const token = await enablePushNotifications()
      if (!token) {
        // Permission was granted but no token was minted (transient FCM
        // failure). Don't report "on" when nothing is registered.
        throw new Error('registration-failed')
      }
      writePushToken(token)
      // Persist the device token so scheduled reminders can reach it. A server
      // failure here shouldn't strip the local grant — usePushNotifications
      // re-registers server-side on the next load, which self-heals this.
      await registerPushToken({ variables: { token } }).catch(() => undefined)
      writePushEnabled(true)
      setEnabled(true)
      setPermission(readBrowserPermission())
    } catch (error) {
      // enablePushNotifications throws a coded Error; reflect the outcome in
      // state so the UI can message it. Never surface the raw error.
      setPermission(readBrowserPermission())
      setEnabled(false)
      throw error instanceof Error ? error : new Error('registration-failed')
    } finally {
      setEnabling(false)
    }
  }, [registerPushToken])

  const disable = useCallback((): void => {
    writePushEnabled(false)
    setEnabled(false)
    const token = readPushToken()
    if (token) {
      void unregisterPushToken({ variables: { token } }).catch(() => undefined)
      clearPushToken()
    }
  }, [unregisterPushToken])

  return { supported, permission, enabled, enabling, enable, disable }
}

export default usePushNotificationSettings
