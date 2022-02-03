import fs from 'fs'
import path from 'path'

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

const directoryChanges = fs
  .readFileSync(path.join(__dirname, 'directory-changes.graphql'))
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

const arrivals = fs
  .readFileSync(path.join(__dirname, 'arrivals.graphql'))
  .toString('utf-8')

const campaigns = fs
  .readFileSync(path.join(__dirname, 'campaigns.graphql'))
  .toString('utf-8')

export const typeDefs =
  schema +
  ' ' +
  directory +
  ' ' +
  directoryChanges +
  ' ' +
  directoryHistory +
  ' ' +
  directorySearch +
  ' ' +
  services +
  ' ' +
  arrivals +
  ' ' +
  campaigns +
  ' '
