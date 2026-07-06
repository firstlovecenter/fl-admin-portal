import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from 'firebase/messaging'

// Firebase web config is per-environment: dev deploys target flc-platform-dev,
// prod targets flc-platform-prod. Values come from VITE_FIREBASE_* build env
// (set per Amplify branch); when unset they fall back to the flc-platform-dev
// project's PUBLIC config (safe to embed — these are client identifiers, not
// secrets), so local dev works with no extra setup. The service worker can't
// read import.meta.env, so acquireToken() forwards this same config to
// firebase-messaging-sw.js via its registration query string — keep the two in
// sync through that single source.
const env = import.meta.env

// Empty-is-unset: a defined-but-blank env var (an easy Amplify misconfig) falls
// back to the dev default, matching the service worker's `||` semantics so the
// page and the SW can never resolve to different projects.
const pick = (value: string | undefined, fallback: string): string =>
  value || fallback

const firebaseConfig = {
  apiKey: pick(env.VITE_FIREBASE_API_KEY, 'AIzaSyBABDnaD6pmyAjffxADrqrPUfyNim6c3ss'),
  authDomain: pick(env.VITE_FIREBASE_AUTH_DOMAIN, 'flc-platform-dev.firebaseapp.com'),
  projectId: pick(env.VITE_FIREBASE_PROJECT_ID, 'flc-platform-dev'),
  storageBucket: pick(
    env.VITE_FIREBASE_STORAGE_BUCKET,
    'flc-platform-dev.firebasestorage.app'
  ),
  messagingSenderId: pick(env.VITE_FIREBASE_MESSAGING_SENDER_ID, '48942564042'),
  appId: pick(env.VITE_FIREBASE_APP_ID, '1:48942564042:web:dde1cbc74786eb6e502a33'),
}

// Web Push (VAPID) public key — per-environment, falls back to flc-platform-dev.
const VAPID_KEY = pick(
  env.VITE_FIREBASE_VAPID_KEY,
  'BOICTFJjgJ9hJLSVJD1oFqLj4jR9KEVi03on3qqnD7I3uaphrFek3TFNkVlOK8gRTEn-f2bJK7ZfuwWVaZ63Hy0'
)

// The FCM service worker is a static file (no Vite env substitution), so we pass
// the resolved config to it as query params; the SW reads them from its own URL.
const swUrl = `/firebase-messaging-sw.js?${new URLSearchParams(
  firebaseConfig
).toString()}`

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
  // Register the FCM worker explicitly (with the per-environment config in its
  // query string) and pass it to getToken so FCM uses it rather than the
  // Workbox service worker.
  const swReg = await navigator.serviceWorker.register(swUrl)

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
