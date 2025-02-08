import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { json } from 'body-parser'
import neo4j from 'neo4j-driver'
import { Neo4jGraphQL } from '@neo4j/graphql'
import { Neo4jGraphQLAuthJWTPlugin } from '@neo4j/graphql-plugin-auth'
import { typeDefs } from './schema/graphql-schema'
import resolvers from './resolvers/resolvers'
import SECRETS from './resolvers/getSecrets'

const app = express()
const httpServer = http.createServer(app)

const driver = neo4j.driver(
  SECRETS.NEO4J_URI || 'bolt://localhost:7687/',
  neo4j.auth.basic(
    SECRETS.NEO4J_USER || 'neo4j',
    SECRETS.NEO4J_PASSWORD || 'letmein'
  )
  // {
  //   encrypted: SECRETS.NEO4J_ENCRYPTED ? 'ENCRYPTION_ON' : 'ENCRYPTION_OFF',
  // }
)
console.log('🚀 ~ index.js:28 ~ SECRETS.NEO4J_URI:', SECRETS.NEO4J_URI)
console.log(
  '🚀 ~ index.js:24 ~ SECRETS.NEO4J_PASSWORD:',
  SECRETS.NEO4J_PASSWORD
)

const neoSchema = new Neo4jGraphQL({
  typeDefs,
  resolvers,
  driver,
  plugins: {
    auth: new Neo4jGraphQLAuthJWTPlugin({
      secret: SECRETS.JWT_SECRET,
      rolesPath: 'https://flcadmin\\.netlify\\.app/roles',
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

/*
 * Create a Neo4j driver instance to connect to the database
 * using credentials specified as environment variables
 * with fallback to defaults
 */

/*
 * Create a new ApolloServer instance, serving the GraphQL schema
 * created using makeAugmentedSchema above and injecting the Neo4j driver
 * instance into the context object so it is available in the
 * generated resolvers to connect to the database.
 */

// Specify host, port and path for GraphQL endpoint
const port = SECRETS.GRAPHQL_SERVER_PORT || 4001
const path = SECRETS.GRAPHQL_SERVER_PATH || '/graphql'
const host = SECRETS.GRAPHQL_SERVER_HOST || '0.0.0.0'

/*
 * Optionally, apply Express middleware for authentication, etc
 * This also also allows us to specify a path for the GraphQL endpoint
 */
const startServer = async () => {
  const schema = await neoSchema.getSchema()

  const server = new ApolloServer({
    context: ({ req }) => ({ req, executionContext: driver }),
    introspection: true,
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  await server.start()

  app.use(
    path,
    cors(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({
        req,
        executionContext: driver,
        token: req.headers.authorization,
      }),
    })
  )

  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => httpServer.listen({ port }, resolve))
  // eslint-disable-next-line
  console.log(`🚀 GraphQL Server ready at http://${host}:${port}${path}`)
}

startServer()
