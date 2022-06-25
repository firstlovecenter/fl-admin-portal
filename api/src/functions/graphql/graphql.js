// This module can be used to serve the GraphQL endpoint
// as a lambda function

const { ApolloServer } = require('apollo-server-lambda')
const { Neo4jGraphQL } = require('@neo4j/graphql')
const { Neo4jGraphQLAuthJWTPlugin } = require('@neo4j/graphql-plugin-auth')
const neo4j = require('neo4j-driver')

// This module is copied during the build step
// Be sure to run `npm run build`
const { typeDefs } = require('./schema/graphql-schema')
const { resolvers } = require('../../resolvers/resolvers.js')
const { serviceResolvers } = require('../../resolvers/service-resolvers')
const {
  componentResolvers,
} = require('../../resolvers/aggregates/component-resolvers')
const {
  arrivalsResolvers,
} = require('../../resolvers/arrivals/arrivals-resolvers')

const driver = neo4j.driver(
  process.env.NEO4J_URI || 'bolt://localhost:7687',
  neo4j.auth.basic(
    process.env.NEO4J_USER || 'neo4j',
    process.env.NEO4J_PASSWORD || 'neo4j'
  )
)

const neoSchema = new Neo4jGraphQL({
  typeDefs,
  resolvers: {
    ...resolvers,
    ...serviceResolvers,
    ...arrivalsResolvers,
    ...componentResolvers,
  },
  driver,
  plugins: {
    auth: new Neo4jGraphQLAuthJWTPlugin({
      secret: process.env.JWT_SECRET.replace(/\\n/gm, '\n'),
      rolesPath: 'https://flcadmin\\.netlify\\.app/roles',
    }),
  },
})

export const handler = async (event, context, ...args) => {
  const schema = await neoSchema.getSchema()

  const server = new ApolloServer({
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
