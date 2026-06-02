/* eslint-disable @typescript-eslint/no-var-requires */
process.env.JWT_SECRET = process.env.JWT_SECRET || 'check-schema-placeholder'
require('@babel/register')({ extensions: ['.js', '.ts'] })

const { Neo4jGraphQL } = require('@neo4j/graphql')
const neo4j = require('neo4j-driver')
const { typeDefs } = require('../src/schema/graphql-schema')
const resolvers = require('../src/resolvers/resolvers').default

const driver = neo4j.driver(
  'bolt://localhost:7687',
  neo4j.auth.basic('neo4j', 'placeholder')
)

const schema = new Neo4jGraphQL({
  typeDefs,
  resolvers,
  driver,
  features: {
    authorization: { key: process.env.JWT_SECRET },
  },
})

schema
  .getSchema()
  .then(() => {
    console.log('OK')
    process.exit(0)
  })
  .catch((err) => {
    console.error('SCHEMA ERROR:')
    console.error(err.message || err)
    process.exit(1)
  })
