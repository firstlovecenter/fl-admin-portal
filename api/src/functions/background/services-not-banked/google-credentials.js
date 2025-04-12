/**
 * Formats Google credentials from secrets
 * @param {Object} secrets The secrets object containing Google credentials
 * @returns {Object} Formatted Google credentials object
 */
const getGoogleCredentials = (secrets) => {
  return {
    type: secrets.GS_TYPE,
    project_id: secrets.GS_PROJECT_ID,
    private_key_id: secrets.GS_PRIVATE_KEY_ID,
    private_key: secrets.GS_PRIVATE_KEY?.replace(/\\n/gm, '\n'),
    client_email: secrets.GS_CLIENT_EMAIL,
    client_id: secrets.GS_CLIENT_ID,
    auth_uri: secrets.GS_AUTH_URI,
    token_uri: secrets.GS_TOKEN_URI,
    auth_provider_x509_cert_url: secrets.GS_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: secrets.GS_CLIENT_X509_CERT_URL,
    universe_domain: secrets.GS_UNIVERSE_DOMAIN,
  }
}

module.exports = { getGoogleCredentials }
