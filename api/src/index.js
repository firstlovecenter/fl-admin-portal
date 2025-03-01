import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { json } from 'body-parser'
import neo4j from 'neo4j-driver'
import { Neo4jGraphQL } from '@neo4j/graphql'
import { jwtDecode } from 'jwt-decode'
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

const neoSchema = new Neo4jGraphQL({
  typeDefs,
  resolvers,
  driver,
  features: {
    authorization: {
      key: SECRETS.JWT_SECRET.toString(),
    },
    config: {
      debug: true,
    },
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
  const schema = await neoSchema.getSchema().catch((error) => {
    console.error('\x1b[31m######## 🚨SCHEMA ERROR🚨 #######\x1b[0m')
    console.error(`${JSON.stringify(error, null, 2)}`)
    console.log(
      '\x1b[31m########## 🚨END OF SCHEMA ERROR🚨 ##################\x1b[0m'
    )
    process.exit(1)
  })

  const server = new ApolloServer({
    context: async ({ req }) => {
      const token = req.headers.authorization
      let jwt = null

      if (token) {
        try {
          jwt = jwtDecode(token)
        } catch (error) {
          console.error('Invalid token:', error)
        }
      }

      return {
        req,
        executionContext: driver,
        jwt,
      }
    },
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
      context: async ({ req }) => {
        const token = req.headers.authorization
        let jwt = null

        if (token) {
          try {
            jwt = jwtDecode(token)
          } catch (error) {
            console.error('Invalid token:', error)
          }
        }

        return {
          req,
          executionContext: driver,
          jwt,
        }
      },
    })
  )

  // eslint-disable-next-line no-promise-executor-return
  await new Promise((resolve) => httpServer.listen({ port }, resolve))
  // eslint-disable-next-line
  console.log(`🚀 GraphQL Server ready at http://${host}:${port}${path}`)
}

startServer()
