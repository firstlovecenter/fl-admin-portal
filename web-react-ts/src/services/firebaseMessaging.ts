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

const getMessagingInstance = (): Messaging => {
  if (!app) app = initializeApp(firebaseConfig)
  if (!messaging) messaging = getMessaging(app)
  return messaging
}

/**
 * Initializes FCM for the PWA: registers the FCM service worker (kept separate
 * from the vite-plugin-pwa Workbox SW), requests notification permission, wires
 * a foreground message listener, and returns this device's registration token.
 *
 * Safe to call when unsupported / denied — returns null and never throws.
 * Token is logged for now; persisting it to the backend is a follow-up.
 */
export const initPushNotifications = async (): Promise<string | null> => {
  try {
    if (!(await isSupported())) {
      // eslint-disable-next-line no-console
      console.log('[FCM] messaging not supported in this browser')
      return null
    }

    // Register the FCM worker explicitly and pass it to getToken so FCM uses it
    // rather than the Workbox service worker.
    const swReg = await navigator.serviceWorker.register(
      '/firebase-messaging-sw.js'
    )

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      // eslint-disable-next-line no-console
      console.log('[FCM] permission not granted:', permission)
      return null
    }

    const m = getMessagingInstance()

    onMessage(m, (payload) => {
      // eslint-disable-next-line no-console
      console.log(
        '[FCM] foreground message:',
        payload?.notification?.title,
        '—',
        payload?.notification?.body
      )
    })

    const token = await getToken(m, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    })
    // eslint-disable-next-line no-console
    console.log('[FCM] token acquired:', !!token)
    return token ?? null
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('[FCM] init failed:', error)
    return null
  }
}
