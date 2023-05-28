const fs = require('fs')
const { loadSecrets } = require('../lib/secrets.js')

const secrets = loadSecrets()

const envContent = Object.entries(secrets)
  .map(([key, value]) => `${key}=${value}`)
  .join('\n')

// Write the .env file
fs.writeFileSync('api/.env', envContent)
fs.writeFileSync('web-react-ts/.env', envContent)

// eslint-disable-next-line no-console
console.log('.env file created with secrets')
