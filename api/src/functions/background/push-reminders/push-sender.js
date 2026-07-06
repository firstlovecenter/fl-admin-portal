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
 * Required secrets (AWS Secrets Manager, dev/ + prod/fl-admin-portal), from the
 * messaging project's service-account JSON:
 *   FCM_PROJECT_ID
 *   FCM_PRIVATE_KEY_ID
 *   FCM_PRIVATE_KEY        (newlines may be escaped as \\n — unescaped below)
 *   FCM_CLIENT_EMAIL
 *   FCM_CLIENT_ID
 *   FCM_CLIENT_X509_CERT_URL
 *
 * BLOCKED until: (1) the dev FCM 401 on fcmregistrations.googleapis.com is
 * fixed so devices can register at all; (2) the prod messaging project exists
 * with its own web app + VAPID key + service account; (3) the above secrets are
 * populated. Until then this module has nothing to send to.
 */

const APP_NAME = 'push-reminders'

const buildServiceAccount = (SECRETS) => ({
  type: 'service_account',
  project_id: SECRETS.FCM_PROJECT_ID,
  private_key_id: SECRETS.FCM_PRIVATE_KEY_ID,
  private_key: SECRETS.FCM_PRIVATE_KEY?.replace(/\\n/gm, '\n'),
  client_email: SECRETS.FCM_CLIENT_EMAIL,
  client_id: SECRETS.FCM_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: SECRETS.FCM_CLIENT_X509_CERT_URL,
  universe_domain: 'googleapis.com',
})

let messagingInstance = null

const getMessagingInstance = async () => {
  if (messagingInstance) return messagingInstance

  const SECRETS = await loadSecrets()
  const existing = getApps().find((a) => a.name === APP_NAME)
  const app =
    existing ||
    initializeApp(
      { credential: cert(buildServiceAccount(SECRETS)) },
      APP_NAME
    )

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
