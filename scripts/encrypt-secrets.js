// ./bin/encrypt-secrets.js
const secrets = require('gitops-secrets')

async function main() {
  const payload = await secrets.providers.doppler.fetch()
  secrets.build(payload, { path: 'lib/secrets.js' })
  secrets.build(payload, { path: 'api/src/resolvers/secrets.ts' })
  secrets.build(payload, {
    path: 'api/src/functions/payment-background/secrets.js',
  })
  secrets.build(payload, {
    path: 'api/src/functions/code-of-the-day/secrets.js',
  })
  secrets.build(payload, {
    path: 'api/src/functions/service-graph-aggregator-background/secrets.js',
  })
  secrets.build(payload, {
    path: 'api/src/functions/bacenta-graph-aggregator-background/secrets.js',
  })
  secrets.build(payload, {
    path: 'api/src/functions/gsheets-accra-background/secrets.js',
  })
  secrets.build(payload, {
    path: 'api/src/functions/gsheets-accra-new-members/secrets.js',
  })
  secrets.build(payload, {
    path: 'api/src/functions/gsheets-services-not-banked/secrets.js',
  })
  secrets.build(payload, {
    path: 'api/src/functions/gsheets-update-outaccra-background/secrets.js',
  })
  secrets.build(payload, {
    path: 'api/src/functions/hillary-monthly-background/secrets.js',
  })
}

main()
