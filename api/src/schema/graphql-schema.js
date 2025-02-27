/* eslint-disable @typescript-eslint/no-var-requires */
const fs = require('fs')
const path = require('path')
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
const servicesCreativeArts = fs.readFileSync(
  path.join(__dirname, 'services-creativearts.graphql')
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

const campaigns = fs
  .readFileSync(path.join(__dirname, 'campaigns.graphql'))
  .toString('utf-8')

const quickFacts = fs
  .readFileSync(path.join(__dirname, './directory-quick-facts.graphql'))
  .toString('utf-8')

const bankingAnagkazo = fs
  .readFileSync(path.join(__dirname, './banking-anagkazo.graphql'))
  .toString('utf-8')

const equipmentCampaign = fs
  .readFileSync(path.join(__dirname, './campaigns-equipment.graphql'))
  .toString('utf-8')

const sheepSeeking = fs
  .readFileSync(path.join(__dirname, './campaigns-sheep-seeking.graphql'))
  .toString('utf-8')

const multiplicationCampaign = fs
  .readFileSync(path.join(__dirname, './campaigns-multiplication.graphql'))
  .toString('utf-8')

const swollenSundayCampaign = fs
  .readFileSync(path.join(__dirname, './campaigns-swollen-sunday.graphql'))
  .toString('utf-8')

const shepherdingControlCampaign = fs
  .readFileSync(path.join(__dirname, './campaigns-shepherding-control.graphql'))
  .toString('utf-8')

const creativeartsChurches = fs
  .readFileSync(path.join(__dirname, './directory-creativearts.graphql'))
  .toString('utf-8')

const maps = fs
  .readFileSync(path.join(__dirname, './maps.graphql'))
  .toString('utf-8')

const accounts = fs
  .readFileSync(path.join(__dirname, './accounts.graphql'))
  .toString('utf-8')

const downloadCredits = fs
  .readFileSync(path.join(__dirname, './download-credits.graphql'))
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
  campaigns,
  quickFacts,
  servicesNoIncome,
  servicesCreativeArts,
  equipmentCampaign,
  sheepSeeking,
  multiplicationCampaign,
  swollenSundayCampaign,
  shepherdingControlCampaign,
  creativeartsChurches,
  maps,
  accounts,
  downloadCredits,
]

const combinedSchema = array.join(' ')

// Write the combined schema to a file
const outputPath = path.join(__dirname, 'combined-schema.graphql')
fs.writeFileSync(outputPath, combinedSchema, 'utf-8')

exports.typeDefs = combinedSchema
