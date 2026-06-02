import { GraphQLError } from 'graphql'
import type { ApolloServerPlugin, BaseContext } from '@apollo/server'

// Defense-in-depth gate that rejects every GraphQL mutation lacking a
// verified JWT. The schema-level `@authentication` directive in
// `schema.graphql` is the primary control; this plugin is the safety net
// for the auto-generated CRUD layer (`updateMembers`, `deleteBacentas`, …)
// and any custom mutation whose author forgot the `isAuth(...)` first-line
// rule. Without this gate, an anonymous probe can write or delete arbitrary
// nodes — confirmed exploitable on prod + staging on 2026-05-26.
//
// `contextValue.jwt` is built by the two Apollo bootstraps
// (`api/src/index.js` and `api/src/functions/graphql/graphql.js`). A
// verifier-rejected or absent token is coerced to `{}`, so `userId` is
// `undefined` and the gate rejects. A good HS256-verified token contains a
// non-empty `userId` (see `verify-jwt.ts`).
export const requireAuthForMutationsPlugin: ApolloServerPlugin<BaseContext> = {
  async requestDidStart() {
    return {
      async didResolveOperation(requestContext) {
        const { operation, contextValue } = requestContext
        if (operation?.operation !== 'mutation') return

        const userId = (contextValue as { jwt?: { userId?: unknown } })?.jwt
          ?.userId
        if (typeof userId === 'string' && userId.length > 0) return

        throw new GraphQLError('Authentication required for mutations', {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 },
          },
        })
      },
    }
  },
}
