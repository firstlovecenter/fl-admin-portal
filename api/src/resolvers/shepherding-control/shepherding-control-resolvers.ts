import { permitShepherdingControl } from '../permissions'
import { Context } from '../utils/neo4j-types'
import { isAuth, throwToSentry } from '../utils/utils'
import SHEPHERDING_SCOPE_CHECK_CYPHER, {
  ShepherdingLevel,
} from './shepherding-control-cypher'

type ScopeCheckArgs = {
  level: ShepherdingLevel
  id: string
}

const shepherdingScopeCheck = async (
  _source: unknown,
  args: ScopeCheckArgs,
  context: Context
): Promise<boolean> => {
  isAuth(permitShepherdingControl(), context.jwt.roles)

  const cypher = SHEPHERDING_SCOPE_CHECK_CYPHER[args.level]
  if (!cypher) {
    // The SDL gates `level` to `ShepherdingChurchLevel` enum, so this branch
    // only fires when the SDL and the Cypher map drift. Fail loudly so the
    // mismatch is caught in dev.
    throw new Error(`shepherdingScopeCheck: unknown level "${args.level}"`)
  }

  const session = context.executionContext.session()
  try {
    const result = await session.executeRead((tx) =>
      tx.run(cypher, { id: args.id, userId: context.jwt.userId })
    )
    return Boolean(result.records[0]?.get('allowed'))
  } catch (error) {
    throwToSentry('Error running shepherding scope check', error)
  } finally {
    await session.close()
  }

  // Unreachable — throwToSentry above always throws. Declared so TS can see
  // a valid return on the catch path; mirrors the pattern in maps-resolvers.
  return false
}

const shepherdingControlResolvers = {
  Query: {
    shepherdingScopeCheck,
  },
}

export default shepherdingControlResolvers
