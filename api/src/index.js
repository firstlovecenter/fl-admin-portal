import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import express from 'express'
import http from 'http'
import cors from 'cors'
import { json } from 'body-parser'
import neo4j from 'neo4j-driver'
import { Neo4jGraphQL } from '@neo4j/graphql'
import { typeDefs } from './schema/graphql-schema'
import resolvers from './resolvers/resolvers'
import { loadSecrets } from './resolvers/secrets'
import { verifyJwt } from './resolvers/utils/verify-jwt'
import { computeAllowedChurchIds } from './resolvers/utils/allowed-church-ids'
import mountDownloadRoutes from './resolvers/downloads/downloads-express'

const startServer = async () => {
  const SECRETS = await loadSecrets()

  const app = express()
  const httpServer = http.createServer(app)

  const uri = SECRETS.NEO4J_URI || 'bolt://localhost:7687/'
  const hasEncryptionInUri =
    uri.includes('neo4j+s://') || uri.includes('neo4j+ssc://')
  const driverConfig = {
    connectionTimeout: 30000,
  }

  // Only add encryption config if not using secure URI scheme
  if (!hasEncryptionInUri) {
    driverConfig.encrypted = 'ENCRYPTION_ON'
    driverConfig.trust = 'TRUST_ALL_CERTIFICATES'
  }

  console.log(
    '[Neo4j] Connecting to:',
    uri.replace(/::\/\/.*@/, '://[REDACTED]@')
  )
  console.log('[Neo4j] URI encryption scheme detected:', hasEncryptionInUri)
  console.log('[Neo4j] Driver config:', driverConfig)

  const driver = neo4j.driver(
    uri,
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'letmein'
    ),
    driverConfig
  )

  // Add connection verification
  try {
    await driver.verifyConnectivity()
    console.log('✅ Neo4j connection verified successfully')
  } catch (error) {
    console.error('❌ Neo4j connection failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }

  const neoSchema = new Neo4jGraphQL({
    typeDefs,
    resolvers,
    driver,
    features: {
      authorization: {
        key: SECRETS.JWT_SECRET,
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

  const schema = await neoSchema.getSchema().catch((error) => {
    console.error('\x1b[31m######## 🚨SCHEMA ERROR🚨 #######\x1b[0m')
    console.error(`${JSON.stringify(error, null, 2)}`)
    console.log(
      '\x1b[31m########## 🚨END OF SCHEMA ERROR🚨 ##################\x1b[0m'
    )
    process.exit(1)
  })

  const server = new ApolloServer({
    introspection: true,
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  await server.start()

  app.use(
    SECRETS.GRAPHQL_SERVER_PATH || '/graphql',
    cors(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Coerce a verifier-rejected token to {} so resolvers that read
        // `context.jwt.roles` directly (no optional chaining, ~80 sites)
        // surface FORBIDDEN via `isAuth`, not a TypeError → 500.
        const jwt = verifyJwt(req.headers.authorization, SECRETS.JWT_SECRET)

        // Enrich the JWT with a flat list of every church-spine id the user
        // is permitted to read, computed from their servant edges. The
        // `@churchScoped`/`@churchScopedVia` directives reference this as
        // `$jwt.allowedChurchIds` in their authorization filters — collapsing
        // what used to be a 4-deep `streams.some.councils.some.…` predicate
        // into a single `id IN [...]` check. See `allowed-church-ids.ts`.
        //
        // The engine reads `context.jwt` directly when set
        // (get-authorization-context.js:22–32 in @neo4j/graphql), so attaching
        // allowedChurchIds here makes it visible to `$jwt.*` substitutions
        // without touching the auth-service token format.
        let allowedChurchIds = []
        if (jwt?.userId) {
          allowedChurchIds = await computeAllowedChurchIds(
            driver,
            jwt.userId,
            jwt.iat,
            jwt.exp
          )
        }

        return {
          req,
          executionContext: driver,
          jwt: jwt ? { ...jwt, allowedChurchIds } : {},
        }
      },
    })
  )

  mountDownloadRoutes(app, driver, SECRETS.JWT_SECRET)

  const port =
    process.env.GRAPHQL_SERVER_PORT || SECRETS.GRAPHQL_SERVER_PORT || 4001
  await new Promise((resolve) => {
    httpServer.listen({ port }, resolve)
  })
  console.log(
    `🚀 GraphQL Server ready at http://${
      SECRETS.GRAPHQL_SERVER_HOST || '0.0.0.0'
    }:${SECRETS.GRAPHQL_SERVER_PORT || 4001}${
      SECRETS.GRAPHQL_SERVER_PATH || '/graphql'
    }`
  )
}

startServer()
