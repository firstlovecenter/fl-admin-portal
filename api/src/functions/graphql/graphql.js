const { Neo4jGraphQL } = require('@neo4j/graphql');
const { ApolloServer } = require('@apollo/server');
const { startServerAndCreateLambdaHandler } = require('@as-integrations/aws-lambda');
const neo4j = require('neo4j-driver');
const { Neo4jGraphQLAuthJWTPlugin } = require('@neo4j/graphql-plugin-auth');
const Sentry = require('@sentry/node');
const { typeDefs } = require('./schema/graphql-schema');
const resolvers = require('./resolvers/resolvers').default;
const SECRETS = require('./resolvers/getSecrets').default;
const { jwtDecode } = require('jwt-decode');

// Initialize Sentry
Sentry.init({
  dsn: 'https://cd02d9dbb24041f88bfa297993779123@o1423098.ingest.sentry.io/6770464',
  tracesSampleRate: 1.0,
});

// Constants
const DEFAULT_NEO4J_CONFIG = {
  maxConnectionPoolSize: 50,
  connectionTimeout: 30000,
  logging: {
    level: 'info',
    logger: (level, message) => console.log(`[Neo4j ${level}] ${message}`)
  }
};

// Server state
let isInitialized = false;
let driver;
let server;
let schema;

const initializeServer = async () => {
  if (isInitialized) return;

  console.log('[Initialization] Starting server initialization');
  
  try {
    // Configure encrypted connection if required
    const uri = SECRETS.NEO4J_ENCRYPTED === 'true'
      ? SECRETS.NEO4J_URI.replace('bolt://', 'neo4j+s://')
      : SECRETS.NEO4J_URI;

    console.log(`[Neo4j] Connecting to ${uri.replace(/:\/\/.*@/, '://[REDACTED]@')}`);
    
    driver = neo4j.driver(
      uri,
      neo4j.auth.basic(SECRETS.NEO4J_USER, SECRETS.NEO4J_PASSWORD),
      DEFAULT_NEO4J_CONFIG
    );

    // Verify connection
    await driver.verifyConnectivity();
    console.log('[Neo4j] Connection established successfully');

    const neoSchema = new Neo4jGraphQL({
      typeDefs,
      resolvers,
      driver,
      plugins: {
        auth: new Neo4jGraphQLAuthJWTPlugin({
          secret: SECRETS.JWT_SECRET,
          rolesPath: 'https://flcadmin\\.netlify\\.app/roles'
        })
      },
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
      }
    });

    console.log('[Schema] Generating GraphQL schema');
    schema = await neoSchema.getSchema().catch((error) => {
      console.error('\x1b[31m[Schema] ######## 🚨SCHEMA ERROR🚨 #######\x1b[0m');
      console.error(`${JSON.stringify(error, null, 2)}`);
      console.log('\x1b[31m[Schema] ########## 🚨END OF SCHEMA ERROR🚨 ##################\x1b[0m');
      throw error;
    });
    
    server = new ApolloServer({
      schema,
      status400ForVariableCoercionErrors: true,
      includeStacktraceInErrorResponses: process.env.NODE_ENV !== 'production',
      formatResponse: (response) => {
        console.log('[Response] Formatting GraphQL response');
        return {
          data: response.data || null,
          errors: response.errors || null,
          extensions: response.extensions || null
        };
      }
    });

    await server.start();
    isInitialized = true;
    console.log('[Apollo] Server initialized successfully');
  } catch (error) {
    console.error('[Initialization] Server initialization failed:', error);
    Sentry.captureException(error);
    throw error;
  }
};

const verifyNodeExists = async (id, label = 'Bacenta') => {
  const session = driver.session();
  try {
    console.log(`[Neo4j] Verifying existence of node ${id} with label ${label}`);
    const result = await session.run(
      `MATCH (n:${label} {id: $id}) RETURN n.id AS id`,
      { id }
    );
    const exists = result.records.length > 0;
    console.log(`[Neo4j] Node ${id} exists: ${exists}`);
    return exists;
  } catch (error) {
    console.error(`[Neo4j] Error verifying node ${id}:`, error);
    Sentry.captureException(error);
    throw error;
  } finally {
    await session.close();
  }
};

// Lambda handler function
exports.handler = startServerAndCreateLambdaHandler(
  async () => {
    await initializeServer();
    return server;
  },
  {
    context: async ({ event }) => {
      console.log('[Request] Incoming request:', {
        path: event.path,
        httpMethod: event.httpMethod,
        headers: Object.keys(event.headers)
      });

      const token = event.headers.authorization || event.headers.Authorization;
      let jwt = null;

      if (token) {
        try {
          const cleanToken = token.replace(/^Bearer\s+/i, '');
          console.log('[Auth] Decoding JWT token');
          jwt = jwtDecode(cleanToken);
          console.log('[Auth] JWT decoded successfully', {
            roles: jwt?.['https://flcadmin.netlify.app/roles']
          });
        } catch (error) {
          console.error('[Auth] Invalid token:', error);
          Sentry.captureException(error);
        }
      }

      return {
        req: event,
        executionContext: driver,
        jwt: {
          ...jwt,
          roles: jwt?.['https://flcadmin.netlify.app/roles'],
        },
      };
    },
  }
);










// // This module can be used to serve the GraphQL endpoint
// // as a lambda function

// const { ApolloServer } = require('apollo-server-lambda')
// const { Neo4jGraphQL } = require('@neo4j/graphql')
// const neo4j = require('neo4j-driver')
// const Sentry = require('@sentry/node')

// // This module is copied during the build step
// // Be sure to run `npm run build`
// const { jwtDecode } = require('jwt-decode')
// const { typeDefs } = require('./schema/graphql-schema')
// const resolvers = require('../../resolvers/resolvers').default
// const SECRETS = require('../../resolvers/getSecrets').default

// Sentry.init({
//   dsn: 'https://cd02d9dbb24041f88bfa297993779123@o1423098.ingest.sentry.io/6770464',

//   // Set tracesSampleRate to 1.0 to capture 100%
//   // of transactions for performance monitoring.
//   // We recommend adjusting this value in production
//   tracesSampleRate: 1.0,
// })

// const driver = neo4j.driver(
//   SECRETS.NEO4J_URI || 'bolt://localhost:7687',
//   neo4j.auth.basic(
//     SECRETS.NEO4J_USER || 'neo4j',
//     SECRETS.NEO4J_PASSWORD || 'neo4j'
//   )
// )

// const neoSchema = new Neo4jGraphQL({
//   typeDefs,
//   resolvers,
//   driver,
//   features: {
//     authorization: {
//       key: SECRETS.JWT_SECRET,
//     },
//     config: {
//       debug: true,
//     },
//     excludeDeprecatedFields: {
//       bookmark: true,
//       negationFilters: true,
//       arrayFilters: true,
//       stringAggregation: true,
//       aggregationFilters: true,
//     },
//   },
// })

// // eslint-disable-next-line import/prefer-default-export
// export const handler = async (event, context, ...args) => {
//   const schema = await neoSchema.getSchema().catch((error) => {
//     console.error('\x1b[31m######## 🚨SCHEMA ERROR🚨 #######\x1b[0m')
//     console.error(`${JSON.stringify(error, null, 2)}`)
//     console.log(
//       '\x1b[31m########## 🚨END OF SCHEMA ERROR🚨 ##################\x1b[0m'
//     )
//     process.exit(1)
//   })

//   const server = new ApolloServer({
//     // eslint-disable-next-line no-shadow
//     context: async ({ event }) => {
//       const token = event.headers.authorization
//       let jwt = null

//       if (token) {
//         try {
//           jwt = jwtDecode(token)
//         } catch (error) {
//           console.error('Invalid token:', error)
//         }
//       }

//       return {
//         req: event,
//         executionContext: driver,
//         jwt: {
//           ...jwt,
//           roles: jwt?.['https://flcadmin.netlify.app/roles'],
//         },
//       }
//     },
//     introspection: true,
//     schema,
//   })

//   const apolloHandler = server.createHandler()

//   return apolloHandler(
//     {
//       ...event,
//       requestContext: context,
//     },
//     context,
//     ...args
//   )
// }
