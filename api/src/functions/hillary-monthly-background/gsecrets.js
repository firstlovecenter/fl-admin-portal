const { loadSecrets } = require('./secrets')

export const SECRETS = loadSecrets()?.JWT_SECRET ? loadSecrets() : process.env

export default SECRETS
