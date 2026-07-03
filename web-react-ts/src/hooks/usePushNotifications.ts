import { useEffect, useRef } from 'react'
import { useAuth } from 'contexts/AuthContext'
import { initPushNotifications } from 'services/firebaseMessaging'

/**
 * Registers this device for FCM push once the user is authenticated. Fires once
 * per session (guarded), non-blocking, and never throws. The permission prompt
 * appears on first authenticated load; a denied/unsupported browser is a no-op.
 */
export const usePushNotifications = (): void => {
  const { isAuthenticated } = useAuth()
  const initialized = useRef(false)

  useEffect(() => {
    if (isAuthenticated && !initialized.current) {
      initialized.current = true
      void initPushNotifications()
    }
  }, [isAuthenticated])
}

export default usePushNotifications
