import { useEffect, useRef } from 'react'
import { useMutation } from '@apollo/client'
import { useAuth } from 'contexts/AuthContext'
import { hasSelfServiceRole } from 'permission-utils'
import { registerPushIfGranted } from 'services/firebaseMessaging'
import { readPushEnabled, writePushToken } from 'lib/push-preference-storage'
import { REGISTER_PUSH_TOKEN } from './pushNotificationsGQL'

/**
 * Silently re-registers this device for FCM push on load — but only when the
 * user has already opted in from Settings AND the browser permission is still
 * granted. Never prompts and never throws; the permission prompt now lives
 * behind the explicit Settings toggle (see usePushNotificationSettings).
 *
 * Also refreshes the persisted device token server-side, since FCM tokens can
 * rotate between sessions. Fires once per session (guarded).
 *
 * SYN-230: skipped for members holding no sign-in role — the server gate
 * (`permitSelfService`) would reject them with FORBIDDEN on every load.
 */
export const usePushNotifications = (): void => {
  const { isAuthenticated, user } = useAuth()
  const canRegister = hasSelfServiceRole(user?.roles)
  const initialized = useRef(false)
  const [registerPushToken] = useMutation(REGISTER_PUSH_TOKEN)

  useEffect(() => {
    // Reset the guard on sign-out so a later sign-in (in-app account switch)
    // re-registers the now-current user's device.
    if (!isAuthenticated) {
      initialized.current = false
      return
    }
    if (!initialized.current && canRegister && readPushEnabled()) {
      initialized.current = true
      void registerPushIfGranted().then((token) => {
        if (token) {
          writePushToken(token)
          void registerPushToken({ variables: { token } }).catch(
            () => undefined
          )
        }
      })
    }
  }, [isAuthenticated, canRegister, registerPushToken])
}

export default usePushNotifications
