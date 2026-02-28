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
import { MakeServant, RemoveServant } from './make-remove-servants'
import { ServantMutationConfig, SERVANT_MUTATIONS } from './servant-config'

/**
 * Resolver factory: Creates a resolver for any servant mutation
 */
const createServantResolver = (
  config: ServantMutationConfig,
  context: Context,
  args: Member
) => {
  const getPermittedRoles = (): Role[] => {
    // Special case: Denomination Leaders use 'fishers' role
    if (
      config.churchType === 'Denomination' &&
      config.servantType === 'Leader'
    ) {
      return ['fishers']
    }

    // Arrivals Counter uses special permission
    if (config.servantType === 'Leader' && config.churchType === 'Bacenta') {
      return permitAdminArrivals(config.requiredPermissionLevel)
    }

    // Standard permission hierarchy
    return permitAdmin(config.requiredPermissionLevel)
  }

  const isRemoval = config.action === 'remove'
  const handler = isRemoval ? RemoveServant : MakeServant

  return handler(
    context,
    args,
    getPermittedRoles(),
    config.churchType,
    config.servantType
  )
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
