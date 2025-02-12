// This module can be used to serve the GraphQL endpoint
// as a lambda function

const { ApolloServer } = require('apollo-server-lambda')
const { Neo4jGraphQL } = require('@neo4j/graphql')
const { Neo4jGraphQLAuthJWTPlugin } = require('@neo4j/graphql-plugin-auth')
const neo4j = require('neo4j-driver')
const Sentry = require('@sentry/node')

// This module is copied during the build step
// Be sure to run `npm run build`
const { typeDefs } = require('./schema/graphql-schema')
const resolvers = require('../../resolvers/resolvers').default
const SECRETS = require('../../resolvers/getSecrets').default

Sentry.init({
  dsn: 'https://cd02d9dbb24041f88bfa297993779123@o1423098.ingest.sentry.io/6770464',

  // Set tracesSampleRate to 1.0 to capture 100%
  // of transactions for performance monitoring.
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
})

const driver = neo4j.driver(
  SECRETS.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    SECRETS.NEO4J_USER || 'neo4j',
    SECRETS.NEO4J_PASSWORD || 'neo4j'
  )
)

const neoSchema = new Neo4jGraphQL({
  typeDefs,
  resolvers,
  driver,
  plugins: {
    auth: new Neo4jGraphQLAuthJWTPlugin({
      // secret: SECRETS.JWT_SECRET.replace(/\\n/gm, '\n'),
      // rolesPath: 'https://flcadmin\\.netlify\\.app/roles',
    }),
  },
  features: {
    excludeDeprecatedFields: {
      bookmark: true,
      negationFilters: true,
      arrayFilters: true,
      stringAggregation: true,
      aggregationFilters: true,
    },
  },
})

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event, context, ...args) => {
  const schema = await neoSchema.getSchema()

  const server = new ApolloServer({
    // eslint-disable-next-line no-shadow
    context: ({ event }) => ({ req: event }),
    introspection: true,
    schema,
  })

  const apolloHandler = server.createHandler()

  return apolloHandler(
    {
      ...event,
      requestContext: context,
    },
    context,
    ...args
  )
}
