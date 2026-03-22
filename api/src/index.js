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
import { loadSecrets } from './resolvers/secrets'
import { startAutoCheckoutScheduler } from './resolvers/checkins/checkins-scheduler'
import { setCheckinsDriver } from './resolvers/checkins/firebase'
import {
  queryEvents,
  validateGeoFence,
  mapEventToResponse,
} from './resolvers/checkins/checkins-service'

const startServer = async () => {
  const SECRETS = await loadSecrets()

  const app = express()
  const httpServer = http.createServer(app)

  const uri = SECRETS.NEO4J_URI || 'bolt://localhost:7687/'
  const hasEncryptionInUri =
    uri.includes('neo4j+s://') || uri.includes('neo4j+ssc://')
  const isLocalUri =
    uri.includes('localhost') || uri.includes('127.0.0.1')
  const driverConfig = {
    connectionTimeout: 30000,
  }

  // Only add encryption config if not using secure URI scheme and not local
  if (!hasEncryptionInUri && !isLocalUri) {
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
    setCheckinsDriver(driver)
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
    console.error('Error message:', error.message || error)
    console.error('Error stack:', error.stack)
    console.error('Error details:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
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
          jwt = jwtDecode(token.replace(/^Bearer\s+/i, ''))
          console.log('🚀 ~ index.js:98 ~ jwt:', jwt)
        } catch (error) {
          console.error('Invalid token:', error)
        }
      }

      return {
        req,
        executionContext: driver,
        jwt: {
          ...jwt,
        },
      }
    },
    introspection: true,
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  })

  await server.start()

  // ── Public endpoint — no auth required ──
  // Leaders open /checkins/qr on their phone without needing to be logged in.
  // The geofence is the access control: only events whose fence contains the
  // caller's GPS coordinates are returned.
  app.get('/public/events-in-range', cors(), async (req, res) => {
    try {
      const lat = parseFloat(req.query.lat)
      const lng = parseFloat(req.query.lng)
      if (isNaN(lat) || isNaN(lng)) {
        return res
          .status(400)
          .json({ error: 'lat and lng query parameters are required' })
      }

      const context = { executionContext: driver, jwt: null, req }
      const events = await queryEvents(context, { status: 'ACTIVE' })
      const now = new Date()
      const results = []

      for (const event of events) {
        if (new Date(event.startsAt) > now || new Date(event.endsAt) < now) {
          continue
        }
        const geoResult = validateGeoFence(event, lat, lng)
        if (geoResult.verified) {
          const mapped = mapEventToResponse(event)
          // Only expose the minimum fields needed for the public QR display
          results.push({
            id: mapped.id,
            name: mapped.name,
            scopeLevel: mapped.scopeLevel,
            startsAt: mapped.startsAt,
            endsAt: mapped.endsAt,
            status: mapped.status,
            qrToken: mapped.qrToken,
            allowedCheckInMethods: mapped.allowedCheckInMethods,
          })
        }
      }

      return res.json(results)
    } catch (err) {
      console.error('[public/events-in-range] error:', err)
      return res.status(500).json({ error: 'Internal server error' })
    }
  })

  app.use(
    SECRETS.GRAPHQL_SERVER_PATH || '/graphql',
    cors(),
    json(),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const token = req.headers.authorization
        let jwt = null

        if (token) {
          try {
            jwt = jwtDecode(token.replace(/^Bearer\s+/i, ''))
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

  await new Promise((resolve) =>
    httpServer.listen({ port: SECRETS.GRAPHQL_SERVER_PORT || 4001 }, resolve)
  )
  startAutoCheckoutScheduler()

  console.log(
    `🚀 GraphQL Server ready at http://${
      SECRETS.GRAPHQL_SERVER_HOST || '0.0.0.0'
    }:${SECRETS.GRAPHQL_SERVER_PORT || 4001}${
      SECRETS.GRAPHQL_SERVER_PATH || '/graphql'
    }`
  )
}

startServer()
