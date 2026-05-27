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
import { computeUserAuthority } from './resolvers/utils/allowed-church-ids'
import { requireAuthForMutationsPlugin } from './resolvers/utils/require-auth-for-mutations'
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
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      requireAuthForMutationsPlugin,
    ],
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

        // Enrich the JWT with the caller's authority graph, computed once
        // per login from their Neo4j servant edges and cached for the
        // token's remaining lifetime. Two fields are attached:
        //
        //   - `servantTrees` — one entry per servant edge (LEADS,
        //     IS_ADMIN_FOR, …) with the church it points at and the spine
        //     descendants reachable from it. Consumed by `assertCan` /
        //     `rolesAt` for per-instance action gating. The flat coarse
        //     `roles` claim alone is insufficient; an oversight leader
        //     holding `leaderOversight` for Africa West must not be able
        //     to act on a Bacenta beneath Europe.
        //
        //   - `allowedChurchIds` — union of every `reach` plus every spine
        //     ancestor of every tree root. The `@churchScoped` /
        //     `@churchScopedVia` directives reference this as
        //     `$jwt.allowedChurchIds` in their authorization filters,
        //     collapsing what used to be a 4-deep `streams.some.councils.some.…`
        //     predicate into a single `id IN [...]` check.
        //
        // The engine reads `context.jwt` directly when set
        // (get-authorization-context.js:22–32 in @neo4j/graphql), so
        // attaching these fields here makes them visible to `$jwt.*`
        // substitutions without touching the auth-service token format.
        let servantTrees = []
        let allowedChurchIds = []
        if (jwt?.userId) {
          const authority = await computeUserAuthority(
            driver,
            jwt.userId,
            jwt.iat,
            jwt.exp
          )
          servantTrees = authority.servantTrees
          allowedChurchIds = authority.allowedChurchIds
        }

        return {
          req,
          executionContext: driver,
          jwt: jwt ? { ...jwt, servantTrees, allowedChurchIds } : {},
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
