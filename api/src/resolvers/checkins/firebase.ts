import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getFirestore, Firestore } from 'firebase-admin/firestore'
import { loadSecrets } from '../secrets'

let dbInstance: Firestore | null = null

const serviceAccount = (SECRETS: Record<string, string>) => ({
  type: 'service_account' as const,
  project_id: 'flc-membership',
  private_key_id: SECRETS.FIREBASE_PRIVATE_KEY_ID,
  private_key: SECRETS.FIREBASE_PRIVATE_KEY?.replace(/\\n/gm, '\n') || '',
  client_email: SECRETS.FIREBASE_CLIENT_EMAIL,
  client_id: SECRETS.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url:
    'https://www.googleapis.com/googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: SECRETS.FIREBASE_CLIENT_X509_CERT_URL,
})

export const getCheckinsDb = async (): Promise<Firestore | null> => {
  if (dbInstance) return dbInstance
  const SECRETS = await loadSecrets()
  if (!SECRETS.FIREBASE_PRIVATE_KEY || !SECRETS.FIREBASE_CLIENT_EMAIL) {
    console.warn(
      'Check-ins disabled: missing Firebase service account secrets'
    )
    return null
  }
  if (getApps().length === 0) {
    initializeApp({
      credential: cert(serviceAccount(SECRETS) as any),
    })
  }
  dbInstance = getFirestore()
  return dbInstance
}
