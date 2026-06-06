/**
 * Servant Resolver Factory
 *
 * This is the MAGIC: A factory that generates all 40+ resolvers from a single
 * configuration. When you need to add a new mutation? Add one line to servant-config.ts.
 * That's it.
 *
 * Pattern: Higher-order function wrapping common logic.
 * Result: FROM 200+ lines → 50 lines
 */

import { Context } from '../utils/neo4j-types'
import { Member, Role } from '../utils/types'
import { permitAdmin, permitAdminArrivals } from '../permissions'
import { isAuth } from '../utils/utils'
import { MakeServant, RemoveServant } from './make-remove-servants'
import { ServantMutationConfig, SERVANT_MUTATIONS } from './servant-config'

/**
 * Resolver factory: Creates a resolver for any servant mutation
 */
const createServantResolver = async (
  config: ServantMutationConfig,
  context: Context,
  args: Member
) => {
  // Denomination Leader make/remove is gated on adminDenomination at the
  // target church (the returned permitAdmin('Denomination') drives
  // validateMutation's isAuth + assertCan) PLUS the broad `fishers` marker.
  // `fishers` is coarse-only (maps to no servant edge), so it is asserted
  // separately below rather than returned here. Mirrors the FE gate (ADR-001):
  // DenominationForm's <RoleView roles={['fishers']}> + the
  // permitAdmin('Denomination') editdenomination route.
  const isDenominationLeader =
    config.churchType === 'Denomination' && config.servantType === 'Leader'

  const getPermittedRoles = (): Role[] => {
    if (isDenominationLeader) {
      return permitAdmin('Denomination')
    }

    // Arrivals Counter uses special permission
    if (config.servantType === 'Leader' && config.churchType === 'Bacenta') {
      return permitAdminArrivals(config.requiredPermissionLevel)
    }

    // Standard permission hierarchy
    return permitAdmin(config.requiredPermissionLevel)
  }

  // Coarse `fishers` guard (JWT-only), layered on top of the adminDenomination
  // gate. Throws FORBIDDEN before any handler/DB work runs.
  if (isDenominationLeader) {
    isAuth(['fishers'], context.jwt?.roles)
  }

  const isRemoval = config.action === 'remove'
  const handler = isRemoval ? RemoveServant : MakeServant

  const result = await handler(
    context,
    args,
    getPermittedRoles(),
    config.churchType,
    config.servantType
  )

  // Config-declared side-effect (servant-config.ts `mirrorStreamTeller`):
  // mirror the Stream Admin make/remove onto the IS_TELLER_FOR edge for the
  // same stream + member, so Stream Admins double as Stream Tellers and can
  // confirm the midweek manual-banking offerings handed in by their
  // governorships. Teller make/remove is directory-lock exempt and the edge
  // MERGE/DELETE is idempotent, so the same `handler` (make or remove) is
  // safe to run for the teller edge. The nested call re-runs isAuth +
  // assertCan bound to `streamId`, so it cannot mint a teller edge on a
  // stream the caller does not administer.
  if (config.mirrorStreamTeller) {
    const adminArgs = args as unknown as Record<string, string>
    const tellerArgs = {
      streamId: adminArgs.streamId,
      tellerId: adminArgs.adminId,
    }
    await handler(
      context,
      tellerArgs,
      permitAdmin('Stream'),
      'Stream',
      'Teller'
    )
  }

  return result
}

/**
 * Build resolver map from configuration
 *
 * This is the "factory floor"—takes SERVANT_MUTATIONS and produces
 * the complete resolver object. No manual mutation definitions needed.
 */
export const buildServantResolvers = () => {
  const resolvers: Record<string, any> = {}

  SERVANT_MUTATIONS.forEach((config) => {
    resolvers[config.name] = async (
      _obj: any,
      args: Member,
      context: Context
    ) => createServantResolver(config, context, args)
  })

  return resolvers
}

/**
 * Export the complete resolver map
 */
export default buildServantResolvers()
