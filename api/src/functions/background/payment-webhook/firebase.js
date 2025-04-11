const { initializeApp, cert } = require('firebase-admin/app')
const { getFirestore } = require('firebase-admin/firestore')
const { loadSecrets } = require('./secrets')

/**
 * Initializes and exports Firebase Admin SDK
 * This module initializes the Firebase Admin SDK for use in the payment webhook handler
 */

// The secrets will be loaded dynamically at runtime from AWS Secrets Manager
const serviceAccount = (SECRETS) => ({
  type: 'service_account',
  project_id: 'flc-membership',
  private_key_id: SECRETS.FIREBASE_PRIVATE_KEY_ID,
  private_key: SECRETS.FIREBASE_PRIVATE_KEY?.replace(/\\n/gm, '\n'),
  client_email: SECRETS.FIREBASE_CLIENT_EMAIL,
  client_id: SECRETS.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:
    'https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-1qj5p%40flc-membership.iam.gserviceaccount.com',
  universe_domain: 'googleapis.com',
})

// We dynamically initialize Firebase when the function is called
// This allows us to load secrets correctly in the Lambda environment
let dbInstance = null

const getDb = async () => {
  if (dbInstance) return dbInstance

  // Load secrets
  const SECRETS = await loadSecrets()

  // Initialize Firebase
  const app = initializeApp(
    {
      credential: cert(serviceAccount(SECRETS)),
    },
    'payment-webhook'
  )

  dbInstance = getFirestore(app)
  return dbInstance
}

// Export the db getter
module.exports.db = {
  collection: (collectionName) => ({
    doc: (docId) => ({
      update: async (data) => {
        const firestore = await getDb()
        return firestore.collection(collectionName).doc(docId).update(data)
      },
    }),
  }),
}
