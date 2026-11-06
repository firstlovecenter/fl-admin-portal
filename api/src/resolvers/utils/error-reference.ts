import { randomBytes } from 'crypto'
import type { ApolloServerPlugin, BaseContext } from '@apollo/server'

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
            console.error(
              `[GraphQL] ✖ ref=${errorRef} op=${opName} user=${userId} code=${code} path=${sanitiseForLog(path)} — ${sanitiseForLog(error.message)}`
            )
          }
          return { ...error, extensions: { ...error.extensions, errorRef } }
        })
      },
    }
  },
}
