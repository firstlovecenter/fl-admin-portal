import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from 'firebase/messaging'

// Public client config for the flc-platform-dev "Synago" web app (not secrets).
// Keep in sync with public/firebase-messaging-sw.js. Prod (flc-platform-prod)
// needs its own values — move to env/per-environment config before prod.
const firebaseConfig = {
  apiKey: 'AIzaSyBABDnaD6pmyAjffxADrqrPUfyNim6c3ss',
  authDomain: 'flc-platform-dev.firebaseapp.com',
  projectId: 'flc-platform-dev',
  storageBucket: 'flc-platform-dev.firebasestorage.app',
  messagingSenderId: '48942564042',
  appId: '1:48942564042:web:dde1cbc74786eb6e502a33',
}

// Web Push (VAPID) public key for flc-platform-dev — safe to embed (public half).
const VAPID_KEY =
  'BOICTFJjgJ9hJLSVJD1oFqLj4jR9KEVi03on3qqnD7I3uaphrFek3TFNkVlOK8gRTEn-f2bJK7ZfuwWVaZ63Hy0'

let app: FirebaseApp | undefined
let messaging: Messaging | undefined
let foregroundListenerWired = false

const getMessagingInstance = (): Messaging => {
  if (!app) app = initializeApp(firebaseConfig)
  if (!messaging) messaging = getMessaging(app)
  // Wire the foreground listener exactly once — acquireToken can run on every
  // load (silent re-register) and on each Settings enable, so guarding here
  // prevents listeners stacking for the session.
  if (!foregroundListenerWired) {
    foregroundListenerWired = true
    onMessage(messaging, (payload) => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log(
          '[FCM] foreground message:',
          payload?.notification?.title,
          '—',
          payload?.notification?.body
        )
      }
    })
  }
  return messaging
}

/**
 * Whether this browser supports FCM web push at all. Safe to call anywhere —
 * resolves false rather than throwing on unsupported/SSR contexts.
 */
export const isPushSupported = async (): Promise<boolean> => {
  try {
    return await isSupported()
  } catch {
    return false
  }
}

/**
 * Mints this device's FCM registration token, registering the dedicated FCM
 * service worker (kept separate from the vite-plugin-pwa Workbox SW) and wiring
 * a foreground message listener. Assumes notification permission is already
 * granted — callers must check first. Throws on failure so callers can surface
 * a friendly message; the raw error is kept out of the UI.
 */
const acquireToken = async (): Promise<string | null> => {
  // Register the FCM worker explicitly and pass it to getToken so FCM uses it
  // rather than the Workbox service worker.
  const swReg = await navigator.serviceWorker.register(
    '/firebase-messaging-sw.js'
  )

  const m = getMessagingInstance()

  const token = await getToken(m, {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: swReg,
  })
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log('[FCM] token acquired:', !!token)
  }
  return token ?? null
}

/**
 * User-initiated enable path (Settings toggle). Requests notification
 * permission via the user gesture, then registers this device for FCM. Returns
 * the token on success. Throws on any failure (permission denied, unsupported,
 * or a registration error such as the FCM 401) so the caller can surface a
 * friendly message — the raw error is logged, never shown.
 */
export const enablePushNotifications = async (): Promise<string | null> => {
  if (!(await isPushSupported())) {
    throw new Error('unsupported')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    // 'denied' or 'default' (dismissed) — cannot register without a grant.
    throw new Error(permission)
  }

  try {
    return await acquireToken()
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[FCM] enable failed:', error)
    }
    throw new Error('registration-failed')
  }
}

/**
 * Silent re-registration for app load. Only registers when the browser
 * permission is already granted — never prompts, never throws. A no-op on
 * unsupported browsers or when permission has not been granted.
 */
export const registerPushIfGranted = async (): Promise<string | null> => {
  try {
    if (!(await isPushSupported())) return null
    if (Notification.permission !== 'granted') return null
    return await acquireToken()
  } catch (error) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[FCM] silent register failed:', error)
    }
    return null
  }
}
