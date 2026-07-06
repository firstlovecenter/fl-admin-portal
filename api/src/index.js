import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@as-integrations/express4'
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
import { depthLimit } from './resolvers/utils/depth-limit'
import mountDownloadRoutes from './resolvers/downloads/downloads-express'

// Logs every GraphQL request's lifecycle so operations show up in the server
// logs (CloudWatch/stdout). Logs the operation name, the caller's userId, and
// timing on success; the full error stack on failure. Deliberately does NOT
// log `request.variables` or the response body — those carry member PII.
const requestLoggingPlugin = {
  async requestDidStart(requestContext) {
    const start = process.hrtime.bigint()
    const opName = requestContext.request.operationName || '<anonymous>'
    const userId = requestContext.contextValue?.jwt?.userId || 'anonymous'

    console.log(`[GraphQL] ▶ ${opName} (user: ${userId})`)

    return {
      async didEncounterErrors(ctx) {
        ctx.errors.forEach((err) => {
          console.error(
            `[GraphQL] ✖ ${opName} (user: ${userId}) — ${err.message}`
          )
          if (err.originalError) {
            console.error(err.originalError.stack || err.originalError)
          }
        })
      },
      async willSendResponse() {
        const ms = Number(process.hrtime.bigint() - start) / 1e6
        console.log(
          `[GraphQL] ◀ ${opName} (user: ${userId}) — ${ms.toFixed(1)}ms`
        )
      },
    }
  },
}

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

  // Only add encryption config if not using secure URI scheme.
  // SYN-180: validate against the system CA store, not TRUST_ALL_CERTIFICATES
  // (blind trust defeats TLS → bolt MITM). All Neo4j hosts (dev + prod) present
  // CA-signed (Let's Encrypt) certs, so system-CA validation is safe on every
  // environment. Migrate NEO4J_URI to neo4j+s:// to drop this block entirely.
  if (!hasEncryptionInUri) {
    driverConfig.encrypted = 'ENCRYPTION_ON'
    driverConfig.trust = 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES'
  }

  console.log(
    '[Neo4j] Connecting to:',
    uri.replace(/:\/\/.*@/, '://[REDACTED]@')
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

  // SYN-177 — disable introspection outside development. Anything that is not
  // explicitly the dev environment is treated as production (secure default),
  // so a mis-set/absent ENVIRONMENT never leaves the schema exposed.
  const isDevelopment = SECRETS.ENVIRONMENT === 'development'

  const server = new ApolloServer({
    introspection: isDevelopment,
    schema,
    // SYN-178 — mirror the Lambda's stacktrace gating (graphql.js) on the same
    // ENVIRONMENT signal as introspection (not process.env.NODE_ENV, which may
    // be unset in Docker) so raw Neo4j / JS stack traces never reach clients
    // outside development. Secure default: anything not explicitly development
    // is treated as production.
    includeStacktraceInErrorResponses: isDevelopment,
    // SYN-177 — depth guard on the auto-generated schema. Runs in every
    // environment; blocks pathological deep-traversal queries before execution.
    validationRules: [depthLimit()],
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      requireAuthForMutationsPlugin,
      requestLoggingPlugin,
    ],
  })

  await server.start()

  app.use(
    SECRETS.GRAPHQL_SERVER_PATH || '/graphql',
    cors(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        // Leave `context.jwt` undefined on a verifier-rejected or absent
        // token. `@neo4j/graphql`'s `getAuthorizationContext` does
        // `if (context.jwt)` — a truthy sentinel like `{}` makes the
        // library treat the request as authenticated and silently bypasses
        // schema-level `@authentication` (the 2026-05-26 incident).
        // Resolvers read claims with `context.jwt?.roles` /
        // `context.jwt?.userId`; `isAuth(...)` already returns FORBIDDEN
        // on undefined roles.
        const jwt = verifyJwt(req.headers.authorization, SECRETS.JWT_SECRET, {
          expectedIss: SECRETS.JWT_ISSUER,
          expectedAud: SECRETS.JWT_AUDIENCE,
        })

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
          jwt: jwt ? { ...jwt, servantTrees, allowedChurchIds } : undefined,
        }
      },
    })
  )

  mountDownloadRoutes(app, driver, SECRETS.JWT_SECRET, {
    expectedIss: SECRETS.JWT_ISSUER,
    expectedAud: SECRETS.JWT_AUDIENCE,
  })

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
