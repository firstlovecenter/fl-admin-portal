/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { GraphQLError } from 'graphql'
import { canDoAt } from '../permissions'
import { Role } from './types'
import { ServantTree } from './allowed-church-ids'

/**
 * Per-instance action gate. The companion to `isAuth` — `isAuth` checks
 * "does the user hold ANY of these roles at all?", which is unbound;
 * `assertCan` checks "does the user hold one of these roles AT THIS exact
 * church?".
 *
 * Reads the user's per-edge authority from `context.jwt?.servantTrees`
 * (populated at request time by `index.js` from `computeUserAuthority`).
 * No Cypher runs here — the trees are cached for the JWT's lifetime.
 *
 * Wire in custom resolvers immediately after `isAuth(...)`:
 *
 *   isAuth(permitAdmin('Stream'), context.jwt?.roles)
 *   assertCan(context, permitAdmin('Stream'), args.streamId)
 *
 * Throws FORBIDDEN if the caller does not hold a permitted role at the
 * target church. Throws BAD_USER_INPUT if `churchId` is missing — the
 * caller MUST supply a target.
 */

type AssertCanContext = {
  jwt?: {
    servantTrees?: ServantTree[]
  }
}

const forbidden = (message: string): GraphQLError =>
  new GraphQLError(message, {
    extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' },
  })

const badInput = (message: string): GraphQLError =>
  new GraphQLError(message, {
    extensions: { code: 'BAD_USER_INPUT', severity: 'USER_ERROR' },
  })

// eslint-disable-next-line import/prefer-default-export
export const assertCan = (
  context: AssertCanContext,
  permittedRoles: Role[],
  churchId: string | null | undefined
): void => {
  if (!churchId) {
    throw badInput('assertCan: churchId is required to verify access scope.')
  }
  const trees = context?.jwt?.servantTrees ?? []
  if (!canDoAt(trees, permittedRoles, churchId)) {
    throw forbidden(
      'You do not hold a required role at this church. ' +
        'Your servant edges do not cover the requested target.'
    )
  }
}
