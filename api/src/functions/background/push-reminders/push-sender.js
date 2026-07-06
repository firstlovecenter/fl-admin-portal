const { initializeApp, cert, getApps } = require('firebase-admin/app')
const { getMessaging } = require('firebase-admin/messaging')
const { loadSecrets } = require('./secrets')

/**
 * Shared FCM sender for the reminder jobs (service form, banking, bussing).
 *
 * IMPORTANT — this targets the *messaging* Firebase project that mints the web
 * push tokens (flc-platform-dev in dev, its prod equivalent in prod), NOT the
 * `flc-membership` Firestore project used by payment-webhook/firebase.js. The
 * two are different projects with different service accounts. A token minted
 * against flc-platform-dev can only be delivered by an Admin SDK app that is
 * credentialed for flc-platform-dev.
 *
 * Required secret (AWS Secrets Manager, dev/ + prod/fl-admin-portal): a single
 * key holding the messaging project's whole service-account JSON, verbatim from
 * the file downloaded in the Firebase console:
 *   FCM_SERVICE_ACCOUNT   (the entire {"type":"service_account",...} JSON)
 * Each env's secret gets that env's project SA (dev→flc-platform-dev,
 * prod→flc-platform-prod), so the sender targets the matching project.
 *
 * BLOCKED until: (1) the dev FCM 401 on fcmregistrations.googleapis.com is
 * fixed so devices can register at all; (2) the prod messaging project's web
 * app + VAPID key exist and VITE_FIREBASE_* is set on the prod branch; (3) the
 * FCM_SERVICE_ACCOUNT secret is populated per env. Nothing to send to until then.
 */

const APP_NAME = 'push-reminders'

// The secret stores the raw downloaded service-account JSON as one string.
// JSON.parse restores the real newlines in private_key (no manual unescaping),
// and cert() accepts the google-format (snake_case) object directly.
const buildServiceAccount = (SECRETS) => {
  const raw = SECRETS.FCM_SERVICE_ACCOUNT
  if (!raw) {
    throw new Error(
      'FCM_SERVICE_ACCOUNT secret is missing — store the messaging project ' +
        'service-account JSON under that key.'
    )
  }
  return typeof raw === 'string' ? JSON.parse(raw) : raw
}

let messagingInstance = null

const getMessagingInstance = async () => {
  if (messagingInstance) return messagingInstance

  const SECRETS = await loadSecrets()
  const existing = getApps().find((a) => a.name === APP_NAME)
  const app =
    existing ||
    initializeApp({ credential: cert(buildServiceAccount(SECRETS)) }, APP_NAME)

  messagingInstance = getMessaging(app)
  return messagingInstance
}

/**
 * Sends one notification to a set of device tokens.
 *
 * @param {string[]} tokens  device registration tokens (may include stale ones)
 * @param {{ title: string, body: string, data?: Record<string,string> }} message
 * @returns {Promise<{ successCount: number, failureCount: number, invalidTokens: string[] }>}
 *   invalidTokens are those FCM reported as unregistered/invalid — the caller
 *   MUST prune these by DETACH DELETEing the matching :PushToken nodes
 *   (MATCH (:Member)-[:HAS_PUSH_TOKEN]->(t:PushToken {token:$token})), so dead
 *   tokens don't accumulate. Node-scoped deletes don't race registration.
 */
const sendToTokens = async (tokens, message) => {
  const unique = [...new Set((tokens || []).filter(Boolean))]
  if (unique.length === 0) {
    return { successCount: 0, failureCount: 0, invalidTokens: [] }
  }

  const messaging = await getMessagingInstance()

  // sendEachForMulticast fans out per-token and returns a per-token result, so
  // one bad token never fails the whole batch.
  const response = await messaging.sendEachForMulticast({
    tokens: unique,
    notification: { title: message.title, body: message.body },
    data: message.data || {},
    webpush: {
      fcmOptions: message.data?.link ? { link: message.data.link } : undefined,
    },
  })

  const invalidTokens = []
  response.responses.forEach((res, index) => {
    if (res.success) return
    const code = res.error?.code
    if (
      code === 'messaging/registration-token-not-registered' ||
      code === 'messaging/invalid-registration-token' ||
      code === 'messaging/invalid-argument'
    ) {
      invalidTokens.push(unique[index])
    }
  })

  return {
    successCount: response.successCount,
    failureCount: response.failureCount,
    invalidTokens,
  }
}

module.exports = { sendToTokens }
