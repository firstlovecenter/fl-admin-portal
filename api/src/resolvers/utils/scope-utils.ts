/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { GraphQLError } from 'graphql'
import { Session } from 'neo4j-driver'

/**
 * Verifies that the user identified by `jwt.userId` has any servant edge
 * (LEADS, IS_ADMIN_FOR, DOES_ARRIVALS_FOR, etc.) at the target church or any
 * ancestor of it. Throws FORBIDDEN if not.
 *
 * This is the imperative companion to the (currently unwired) declarative
 * `@authorization(filter:)` approach. Custom resolvers that take a churchId
 * as an argument MUST call `assertChurchScope` after `isAuth(...)` to close
 * the IDOR write gap — `isAuth` only checks role membership, not target.
 *
 * Servant edge types are taken from the SDL: LEADS, DEPUTY_LEADS,
 * IS_ADMIN_FOR, DOES_ARRIVALS_FOR, COUNTS_ARRIVALS_FOR, IS_TELLER_FOR,
 * IS_ARRIVALS_PAYER_FOR, IS_SHEEP_SEEKER_FOR.
 *
 * The hierarchy walk uses the bidirectional `[:HAS*0..]` so a leaf-level
 * scope (leaderBacenta on Bacenta X) grants access to X and a higher-level
 * scope (adminCampus on Campus Y) grants access to every Bacenta beneath Y.
 */

// Servant edges declared in the SDL between Member and a Church-level node:
//   LEADS, DEPUTY_LEADS                   — leaders / acting leaders
//   IS_ADMIN_FOR                          — admins
//   DOES_ARRIVALS_FOR                     — arrivals admins
//   COUNTS_ARRIVALS_FOR                   — arrivals counters
//   IS_TELLER_FOR                         — tellers
//   IS_ARRIVALS_PAYER_FOR                 — arrivals payers
// Activity-log edges (CONFIRMED_BANKING_FOR, OFFERING_BANKED_BY, etc.) are
// deliberately NOT included — they record events, they don't grant authority.
// `IS_SHEEP_SEEKER_FOR` appears in `directory-search.graphql` but has no SDL
// `@relationship` and no resolver writes it; excluded until that path is wired.
const SERVANT_EDGES = [
  'LEADS',
  'DEPUTY_LEADS',
  'IS_ADMIN_FOR',
  'DOES_ARRIVALS_FOR',
  'COUNTS_ARRIVALS_FOR',
  'IS_TELLER_FOR',
  'IS_ARRIVALS_PAYER_FOR',
].join('|')

// Church spine height = 6 (Denomination → Oversight → Campus → Stream →
// Council → Governorship → Bacenta). Bounding `*0..6` keeps the EXISTS
// subquery cheap and prevents the matcher from wandering across `HAS` edges
// that future schema work might add outside the church spine.
const CHURCH_LEVEL_LABELS =
  "['Bacenta','Governorship','Council','Stream','Campus','Oversight','Denomination']"

const ASSERT_CYPHER = `
  MATCH (church {id: $churchId})
  WHERE any(l IN labels(church) WHERE l IN ${CHURCH_LEVEL_LABELS})
    AND EXISTS {
      MATCH (church)<-[:HAS*0..6]-(scoped)
            <-[:${SERVANT_EDGES}]-(:Active:Member {id: $userId})
    }
  RETURN church.id AS id
`

const ASSERT_VIA_SERVICE_RECORD_CYPHER = `
  MATCH (record:ServiceRecord {id: $recordId})
        <-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)
  WHERE any(l IN labels(church) WHERE l IN ${CHURCH_LEVEL_LABELS})
    AND EXISTS {
      MATCH (church)<-[:HAS*0..6]-(scoped)
            <-[:${SERVANT_EDGES}]-(:Active:Member {id: $userId})
    }
  RETURN record.id AS id
`

const ASSERT_VIA_TRANSACTION_CYPHER = `
  MATCH (transaction:AccountTransaction {id: $transactionId})
        <-[:HAS_TRANSACTION]-(church:Council)
  WHERE EXISTS {
    MATCH (church)<-[:HAS*0..6]-(scoped)
          <-[:${SERVANT_EDGES}]-(:Active:Member {id: $userId})
  }
  RETURN transaction.id AS id
`

const ASSERT_VIA_VEHICLE_RECORD_CYPHER = `
  MATCH (record:VehicleRecord {id: $vehicleRecordId})
        <-[:INCLUDES_RECORD]-(:BussingRecord)
        <-[:HAS_BUSSING]-(:ServiceLog)
        <-[:HAS_HISTORY]-(church)
  WHERE any(l IN labels(church) WHERE l IN ${CHURCH_LEVEL_LABELS})
    AND EXISTS {
      MATCH (church)<-[:HAS*0..6]-(scoped)
            <-[:${SERVANT_EDGES}]-(:Active:Member {id: $userId})
    }
  RETURN record.id AS id
`

const forbidden = (message: string): GraphQLError =>
  new GraphQLError(message, {
    extensions: { code: 'FORBIDDEN', severity: 'USER_ERROR' },
  })

// Accept the narrow Context shape the existing resolvers use; only the
// session() factory and a JWT-with-userId are needed here.
type ScopeContext = {
  executionContext: { session: () => Session }
  jwt: { userId?: string }
}

const runAssert = async (
  context: ScopeContext,
  cypher: string,
  params: Record<string, string>,
  failureLog: Record<string, string>
): Promise<void> => {
  const userId = context.jwt?.userId
  if (!userId) {
    throw forbidden('You are not authenticated for this operation.')
  }
  const session: Session = context.executionContext.session()
  try {
    const result = await session.executeRead((tx) =>
      tx.run(cypher, { ...params, userId })
    )
    if (result.records.length === 0) {
      console.error('❌ Church-scope check failed', {
        ...failureLog,
        userId,
      })
      throw forbidden(
        'You are not permitted to access this resource. ' +
          'Your role does not cover the requested church or any of its ancestors.'
      )
    }
  } finally {
    await session.close()
  }
}

export const assertChurchScope = async (
  context: ScopeContext,
  churchId: string | undefined | null
): Promise<void> => {
  if (!churchId) {
    throw forbidden(
      'assertChurchScope: churchId is required to verify access scope.'
    )
  }
  await runAssert(context, ASSERT_CYPHER, { churchId }, { churchId })
}

// Variant for resolvers whose only church-anchor argument is a ServiceRecord
// id (e.g. BankServiceOffering). Walks ServiceRecord -> ServiceLog -> Bacenta
// before applying the same scope check.
export const assertScopeViaServiceRecord = async (
  context: ScopeContext,
  serviceRecordId: string | undefined | null
): Promise<void> => {
  if (!serviceRecordId) {
    throw forbidden(
      'assertScopeViaServiceRecord: serviceRecordId is required to verify access scope.'
    )
  }
  await runAssert(
    context,
    ASSERT_VIA_SERVICE_RECORD_CYPHER,
    { recordId: serviceRecordId },
    { serviceRecordId }
  )
}

// Variant for resolvers anchored on an AccountTransaction id (ApproveExpense,
// DeclineExpense). Walks AccountTransaction <- HAS_TRANSACTION - Council, then
// applies the same scope check.
export const assertScopeViaTransaction = async (
  context: ScopeContext,
  transactionId: string | undefined | null
): Promise<void> => {
  if (!transactionId) {
    throw forbidden(
      'assertScopeViaTransaction: transactionId is required to verify access scope.'
    )
  }
  await runAssert(
    context,
    ASSERT_VIA_TRANSACTION_CYPHER,
    { transactionId },
    { transactionId }
  )
}

// Variant for resolvers anchored on a VehicleRecord id (SetVehicleSupport,
// SendVehicleSupport). Walks VehicleRecord <- INCLUDES_RECORD - BussingRecord
// <- HAS_BUSSING - ServiceLog <- HAS_HISTORY - Bacenta, then applies the same
// scope check.
export const assertScopeViaVehicleRecord = async (
  context: ScopeContext,
  vehicleRecordId: string | undefined | null
): Promise<void> => {
  if (!vehicleRecordId) {
    throw forbidden(
      'assertScopeViaVehicleRecord: vehicleRecordId is required to verify access scope.'
    )
  }
  await runAssert(
    context,
    ASSERT_VIA_VEHICLE_RECORD_CYPHER,
    { vehicleRecordId },
    { vehicleRecordId }
  )
}
