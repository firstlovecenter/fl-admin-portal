import { randomBytes } from 'crypto'
import type { ApolloServerPlugin, BaseContext } from '@apollo/server'
import {
  ApolloServerValidationErrorCode,
  unwrapResolverError,
} from '@apollo/server/errors'
import type { GraphQLFormattedError } from 'graphql'

const MAX_LOGGED_ERRORS = 10
const MAX_MESSAGE_LENGTH = 300

export const createErrorRef = (): string =>
  randomBytes(4).toString('hex').toUpperCase()

// Error messages are not PII-free: CreateMember and the contact collision
// errors name the member for the UI, and graphql-js echoes rejected variable
// values into coercion errors. Strip those before anything reaches the logs,
// along with control characters that could forge a second log line.
export const sanitiseForLog = (value: string): string =>
  value
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]+/g, ' ')
    .replace(/got invalid value .*/i, 'got invalid value [redacted]')
    .replace(/"[^"]*"/g, '"[redacted]"')
    .replace(/[^\s"]+@[^\s"]+/g, '[redacted]')
    .replace(/\+?\d[\d\s-]{6,}\d/g, '[redacted]')
    .replace(/\b(called|belongs to) .*/i, '$1 [redacted]')
    .slice(0, MAX_MESSAGE_LENGTH)

// SYN-253 — refusals the user can act on (validation, permission, sign-in)
// are expected traffic, not server failures. Logging them at ERROR filed a
// ticket per refusal and drowned the real failures, so they go to WARN;
// every other code (INTERNAL_SERVER_ERROR, UNKNOWN, ...) stays at ERROR.
const WARN_CODES = new Set(['BAD_USER_INPUT', 'FORBIDDEN', 'UNAUTHENTICATED'])

export const logLevelForCode = (code: unknown): 'warn' | 'error' =>
  typeof code === 'string' && WARN_CODES.has(code) ? 'warn' : 'error'

// SYN-268 — production refuses introspection on purpose (SYN-177), so log that
// refusal at WARN, keyed on Apollo's validationErrorCode, not the message text.
// Other GRAPHQL_VALIDATION_FAILED stay at ERROR: they signal client/schema drift.
export const logLevelForError = (
  error: GraphQLFormattedError
): 'warn' | 'error' =>
  error.extensions?.validationErrorCode ===
  ApolloServerValidationErrorCode.INTROSPECTION_DISABLED
    ? 'warn'
    : logLevelForCode(error.extensions?.code)

// SYN-258 — @neo4j/graphql's @authentication / @authorization refusals carry
// no `extensions.code`, so Apollo stamped them INTERNAL_SERVER_ERROR and an
// expired-session read logged at ERROR. Match the library's error classes by
// `constructor.name`: they are not exported, the base class's `name` is
// 'GraphQLError', and a message-only match would recode our own errors. Names
// survive only while the API is not bundled or minified.
const neo4jGraphQLAuthCode = (error: unknown): string | undefined => {
  if (!(error instanceof Error)) return undefined
  const className = error.constructor.name
  if (className === 'Neo4jGraphQLAuthenticationError') return 'UNAUTHENTICATED'
  if (className === 'Neo4jGraphQLForbiddenError') return 'FORBIDDEN'
  if (className === 'Neo4jGraphQLError' && error.message === 'Unauthenticated')
    return 'UNAUTHENTICATED'
  return undefined
}

// Apollo `formatError` hook; registered in both bootstraps. Apollo formats
// errors before willSendResponse, so errorReferencePlugin logs the new code.
export const formatError = (
  formattedError: GraphQLFormattedError,
  error: unknown
): GraphQLFormattedError => {
  const code = neo4jGraphQLAuthCode(unwrapResolverError(error))
  if (!code) return formattedError

  return {
    ...formattedError,
    extensions: { ...formattedError.extensions, code },
  }
}

// The UI never shows raw GraphQL errors (SYN-178), so a user report would
// otherwise carry nothing to search for. Each error gets a short reference
// that is logged here beside the real message and returned in
// `extensions.errorRef` for the toast to display. Registered in both Apollo
// bootstraps: on the Lambda this is the only record of a failed operation.
// Do not log `request.variables` — they carry member PII — and only log
// messages through sanitiseForLog.
export const errorReferencePlugin: ApolloServerPlugin<BaseContext> = {
  async requestDidStart() {
    return {
      async willSendResponse({ request, response, contextValue }) {
        if (response.body.kind !== 'single') return

        const { errors } = response.body.singleResult
        if (!errors?.length) return

        const opName = sanitiseForLog(request.operationName || '<anonymous>')
        const userId =
          (contextValue as { jwt?: { userId?: string } })?.jwt?.userId ||
          'anonymous'

        response.body.singleResult.errors = errors.map((error, index) => {
          const errorRef = createErrorRef()
          if (index < MAX_LOGGED_ERRORS) {
            const code = error.extensions?.code ?? 'UNKNOWN'
            const path = error.path?.join('.') ?? '<none>'
            // eslint-disable-next-line no-console
            console[logLevelForError(error)](
              `[GraphQL] ✖ ref=${errorRef} op=${opName} user=${userId} code=${code} path=${sanitiseForLog(path)} — ${sanitiseForLog(error.message)}`
            )
          }
          return { ...error, extensions: { ...error.extensions, errorRef } }
        })
      },
    }
  },
}
