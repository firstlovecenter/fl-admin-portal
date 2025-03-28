const { loadSecrets } = require('./secrets')

export const SECRETS = loadSecrets()?.JWT_SECRET ? loadSecrets() : process.env

export const GOOGLE_APPLICATION_CREDENTIALS = {
  type: SECRETS.GS_TYPE,
  project_id: SECRETS.GS_PROJECT_ID,
  private_key_id: SECRETS.GS_PRIVATE_KEY_ID,
  private_key: SECRETS.GS_PRIVATE_KEY?.replace(/\\n/gm, '\n'),
  client_email: SECRETS.GS_CLIENT_EMAIL,
  client_id: SECRETS.GS_CLIENT_ID,
  auth_uri: SECRETS.GS_AUTH_URI,
  token_uri: SECRETS.GS_TOKEN_URI,
  auth_provider_x509_cert_url: SECRETS.GS_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: SECRETS.GS_CLIENT_X509_CERT_URL,
  universe_domain: SECRETS.GS_UNIVERSE_DOMAIN,
}
