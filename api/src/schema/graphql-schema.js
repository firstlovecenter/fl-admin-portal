/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const path = require('path')
const { expandChurchScopedMarkers } = require('./church-scoped-directive')
/*
 * Check for GRAPHQL_SCHEMA environment variable to specify schema file
 * fallback to schema.graphql if GRAPHQL_SCHEMA environment variable is not set
 */

const schema = fs
  .readFileSync(
    process.env.GRAPHQL_SCHEMA || path.join(__dirname, 'schema.graphql')
  )
  .toString('utf-8')

const directory = fs
  .readFileSync(path.join(__dirname, 'directory.graphql'))
  .toString('utf-8')

const directoryCrud = fs
  .readFileSync(path.join(__dirname, 'directory-crud.graphql'))
  .toString('utf-8')

const directoryHistory = fs
  .readFileSync(path.join(__dirname, 'directory-history.graphql'))
  .toString('utf-8')

const directorySearch = fs
  .readFileSync(path.join(__dirname, 'directory-search.graphql'))
  .toString('utf-8')

const services = fs
  .readFileSync(path.join(__dirname, 'services.graphql'))
  .toString('utf-8')

const servicesNoIncome = fs.readFileSync(
  path.join(__dirname, 'services-no-income.graphql')
)

const banking = fs
  .readFileSync(path.join(__dirname, './banking.graphql'))
  .toString('utf-8')

const arrivals = fs
  .readFileSync(path.join(__dirname, './arrivals.graphql'))
  .toString('utf-8')
const arrivalsPayment = fs
  .readFileSync(path.join(__dirname, './arrivals-payment.graphql'))
  .toString('utf-8')

const aggregates = fs
  .readFileSync(path.join(__dirname, './aggregates.graphql'))
  .toString('utf-8')

const quickFacts = fs
  .readFileSync(path.join(__dirname, './directory-quick-facts.graphql'))
  .toString('utf-8')

const bankingAnagkazo = fs
  .readFileSync(path.join(__dirname, './banking-anagkazo.graphql'))
  .toString('utf-8')

const maps = fs
  .readFileSync(path.join(__dirname, './maps.graphql'))
  .toString('utf-8')

const accounts = fs
  .readFileSync(path.join(__dirname, './accounts.graphql'))
  .toString('utf-8')

const reports = fs
  .readFileSync(path.join(__dirname, './reports.graphql'))
  .toString('utf-8')

const shepherdingControl = fs
  .readFileSync(path.join(__dirname, './shepherding-control.graphql'))
  .toString('utf-8')

const array = [
  schema,
  directory,
  directoryCrud,
  directoryHistory,
  directorySearch,
  services,
  banking,
  bankingAnagkazo,
  arrivals,
  arrivalsPayment,
  aggregates,
  quickFacts,
  servicesNoIncome,
  maps,
  accounts,
  reports,
  shepherdingControl,
]

const combinedSchema = expandChurchScopedMarkers(array.join(' '))

// Fail fast at boot if a `# @churchScoped*` marker survives the expander —
// otherwise the type ships with NO authorization filter and we'd believe it
// was protected. The most common cause is a marker placed on a header shape
// the regex doesn't recognise (e.g. via-marker on an `implements` header, or
// a typo like `@chuchScoped`).
const leftover = combinedSchema.match(/#\s*@churchScoped[A-Za-z]*/g)
if (leftover) {
  throw new Error(
    `church-scoped-directive: ${leftover.length} marker(s) survived expansion: ` +
      `${leftover.join(', ')}. The annotated type would ship with no ` +
      `authorization filter — refusing to boot. Check the marker placement ` +
      `against the header pattern in church-scoped-directive.js.`
  )
}

// Write the combined schema to a file
// const outputPath = path.join(__dirname, 'combined-schema.gql')
// fs.writeFileSync(outputPath, combinedSchema, 'utf-8')

exports.typeDefs = combinedSchema
