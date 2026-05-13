/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { Driver } from 'neo4j-driver'

/**
 * Computes the flat list of church-node ids the user is permitted to read,
 * derived from their servant edges in Neo4j (not from JWT scope ids). The
 * walk follows the same servant-edge taxonomy as `scope-utils.ts` so the
 * declarative `@authorization` filter and the imperative `assertChurchScope`
 * agree on what "in scope" means.
 *
 * For each church node connected to the user by a servant edge:
 *  - the node itself
 *  - every ancestor on the church spine
 *  - every descendant on the church spine
 *
 * The undirected `*0..6` walks Neo4j-wise look attractive but leak sideways
 * (siblings of an ancestor become reachable). The two directional
 * `-[:HAS*0..6]->` walks below stay strictly within the user's branch.
 *
 * Bounded `*0..6` matches the spine height (Denomination → Bacenta) and
 * keeps the planner honest — without it Neo4j would speculatively explore
 * unrelated `HAS` edges.
 *
 * Replaces the deep-nested `streams.some.councils.some.governorships.some.bacentas.some.id eq …`
 * predicate emitted by the old `@churchScoped` directive. With this flat
 * list, the filter on each church-spine type collapses to `id IN $jwt.allowedChurchIds`
 * — O(1) per node, no compounding traversal.
 */

// Label disjunction on the matched variable rather than `any(l IN labels(x))`.
// The labelled form (`(scoped:Bacenta|Governorship|…)`) lets the planner fold
// a union of label-index lookups into the variable-length expand, pruning
// off-spine `HAS` descendants (ClosedBacenta, HubFellowship, etc.) at expand
// time. `any(l IN labels(x))` is opaque to the planner and forces an
// expand-then-materialise-then-filter shape. Confirmed equivalent result set
// on dev (11 / 29 ids for narrow / broad scopes).
const SPINE_LABEL_DISJUNCTION =
  ':Bacenta|Governorship|Council|Stream|Campus|Oversight|Denomination'

// Servant-edge taxonomy. Kept in sync with `scope-utils.ts SERVANT_EDGES`
// so the declarative `allowedChurchIds` and the imperative
// `assertChurchScope` agree on what "in scope" means. Drift between the two
// is a security-class defect — any new edge added to one MUST be added to
// the other.
const SERVANT_EDGES = [
  'LEADS',
  'DEPUTY_LEADS',
  'IS_ADMIN_FOR',
  'DOES_ARRIVALS_FOR',
  'COUNTS_ARRIVALS_FOR',
  'IS_TELLER_FOR',
  'IS_ARRIVALS_PAYER_FOR',
].join('|')

// `*1..6` instead of `*0..6` on the variable-length walks: `scoped` is
// already collected on its own line, so the `*0` self-edge would be a
// redundant row the planner has to dedupe out. The spine height is 6 hops
// (Denomination → Bacenta), bounding the walk keeps it cheap and stops the
// planner from speculating beyond the spine.
// `(m:Member&Active)` Cypher 5 conjunction form rather than `:Active:Member`
// — mixing the two forms ('|' disjunction with ':' conjunction) in the same
// query raises Neo.ClientError.Statement.SyntaxError. The spine match below
// uses disjunction, so the Member anchor matches it.
const ALLOWED_CHURCH_IDS_CYPHER = `
  MATCH (m:Member&Active {id: $userId})
        -[:${SERVANT_EDGES}]->(scoped${SPINE_LABEL_DISJUNCTION})
  OPTIONAL MATCH (ancestor${SPINE_LABEL_DISJUNCTION})-[:HAS*1..6]->(scoped)
  OPTIONAL MATCH (scoped)-[:HAS*1..6]->(descendant${SPINE_LABEL_DISJUNCTION})
  WITH collect(DISTINCT scoped) + collect(DISTINCT ancestor) + collect(DISTINCT descendant) AS nodes
  UNWIND nodes AS n
  WITH collect(DISTINCT n.id) AS allowedChurchIds
  RETURN allowedChurchIds
`

type CacheEntry = {
  ids: string[]
  expiresAtMs: number
}

// Module-level cache keyed on `${userId}:${iat}`. The iat in the key means a
// re-issued token (after a role change forces a refresh) gets a fresh entry
// automatically — no manual invalidation needed.
const cache = new Map<string, CacheEntry>()

// Keep memory bounded if a deploy stays up long enough to accumulate
// expired entries that no longer get hit. 5 000 entries ≈ a few hundred KB.
const MAX_CACHE_ENTRIES = 5000

const sweepExpired = (nowMs: number): void => {
  for (const [key, entry] of cache) {
    if (entry.expiresAtMs <= nowMs) {
      cache.delete(key)
    }
  }
}

export const computeAllowedChurchIds = async (
  driver: Driver,
  userId: string,
  iat: number | undefined,
  expSec: number | undefined
): Promise<string[]> => {
  const nowMs = Date.now()
  const cacheKey = `${userId}:${iat ?? 0}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAtMs > nowMs) {
    return cached.ids
  }

  const session = driver.session()
  let ids: string[] = []
  try {
    const result = await session.executeRead((tx) =>
      tx.run(ALLOWED_CHURCH_IDS_CYPHER, { userId })
    )
    if (result.records.length > 0) {
      ids = result.records[0].get('allowedChurchIds') ?? []
    }
  } finally {
    await session.close()
  }

  // Cache for the JWT's remaining lifetime, capped at 30 minutes so a
  // long-lived or clock-skewed token can't pin a stale list forever.
  const expiresAtMs = Math.min(
    expSec ? expSec * 1000 : nowMs + 30 * 60 * 1000,
    nowMs + 30 * 60 * 1000
  )
  if (cache.size >= MAX_CACHE_ENTRIES) {
    sweepExpired(nowMs)
  }
  cache.set(cacheKey, { ids, expiresAtMs })

  return ids
}

// Exposed for tests; also useful if the auth-service ever signals
// out-of-band that a user's scope changed mid-session.
export const clearAllowedChurchIdsCache = (): void => {
  cache.clear()
}
