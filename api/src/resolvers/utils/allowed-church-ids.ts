/* eslint-disable no-relative-import-paths/no-relative-import-paths */
import { Driver } from 'neo4j-driver'
import { ChurchLevel } from './types'

/**
 * Computes — once per login, cached for the JWT's remaining lifetime — the
 * caller's authority graph:
 *
 *   - `servantTrees`: one entry per servant edge the user holds. Each entry
 *     names the edge type (LEADS, IS_ADMIN_FOR, …), the church level
 *     (Bacenta, Stream, …), the church the edge points at, and the `reach`
 *     of that edge — the church itself plus every spine descendant. The
 *     reach is what the FE/BE use to ask "does the user hold role X AT
 *     this exact church?" without another Cypher round-trip.
 *
 *   - `allowedChurchIds`: a flat union of every reach plus every spine
 *     ancestor of every tree root. This is what the `@churchScoped`
 *     authorization filter consumes (as `$jwt.allowedChurchIds`) and what
 *     `useCanViewChurch` reads on the FE to gate breadcrumbs and any
 *     spine-walking surface. Ancestors are visible-but-not-actionable —
 *     a Bacenta leader needs to walk up to their Denomination so the church
 *     selector and SetPermissions can compute correctly, but holds no role
 *     at any of those ancestors.
 *
 * Return shape: `{ servantTrees: ServantTree[]; allowedChurchIds: string[] }`.
 *
 * # Scope (what's IN this authority graph and what isn't)
 *
 * Only spine churches are walked — `Bacenta | Governorship | Council |
 * Stream | Campus | Oversight | Denomination`. Servant edges that target
 * NON-spine churches (Ministry, Hub, HubCouncil, CreativeArts, Fellowship,
 * Basonta) are intentionally dropped here. Those subgraphs have their own
 * dashboards and use their own authorization paths; reading them through
 * the spine `@churchScoped` filter would either deny or grant the wrong
 * thing. If a user's only servant edges target non-spine churches (e.g.
 * `IS_ADMIN_FOR → Ministry`), they get `{servantTrees: [], allowedChurchIds: []}`
 * here — that is correct. Their access to the Ministry surface comes from
 * a different path; do not reach across.
 *
 * # Scaling note (revisit at 10k bacentas)
 *
 * Today FLC has roughly 1k bacentas. A Denomination-leader's `allowedChurchIds`
 * is ~1.1k UUIDs (~45 KB serialised), and the login Cypher's quadratic-free
 * dedup below (via UNWIND + collect DISTINCT) runs in O(N). Every per-query
 * gate downstream is an in-memory `array.includes` against the cached list.
 *
 * Revisit when the tree approaches 10k bacentas:
 *   - Per-request JWT payload (~450 KB) starts to bite on cold-start latency.
 *     Mitigation: drop `allowedChurchIds` from the FE GraphQL payload
 *     (`myAuthority`) and have the FE check `useCanViewChurch` via a
 *     server round-trip — keep the BE-side `$jwt.allowedChurchIds` only.
 *   - Login Cypher cost grows with `reach.length` per servant edge. The
 *     dedup is already O(N); the variable-length expand is the next hot
 *     spot. Mitigation: drop the `*1..6` depth bound to `*1..7` only if
 *     the spine actually deepens (it shouldn't), or encode reach as a
 *     bloom filter / range and recheck on demand.
 *   - Per-query Cypher filter cost `WHERE id IN $allowedChurchIds` is a
 *     series of index seeks, still bounded — but for queries that return
 *     thousands of nodes, the filter cost per row scales linearly. PROFILE
 *     the heaviest spine reads (`memberByEmail` is the worst offender
 *     historically, see SYN-95) and confirm the planner pushes the
 *     predicate into the index lookup.
 */

export type ServantEdgeType =
  | 'LEADS'
  | 'DEPUTY_LEADS'
  | 'IS_ADMIN_FOR'
  | 'DOES_ARRIVALS_FOR'
  | 'COUNTS_ARRIVALS_FOR'
  | 'IS_TELLER_FOR'
  | 'IS_ARRIVALS_PAYER_FOR'

export type ServantTree = {
  type: ServantEdgeType
  level: ChurchLevel
  churchId: string
  churchName: string
  reach: string[]
}

export type AuthorityPayload = {
  servantTrees: ServantTree[]
  allowedChurchIds: string[]
}

// Label disjunction on the matched variable rather than `any(l IN labels(x))`.
// The labelled form (`(scoped:Bacenta|Governorship|…)`) lets the planner fold
// a union of label-index lookups into the variable-length expand, pruning
// off-spine `HAS` descendants (ClosedBacenta, HubFellowship, etc.) at expand
// time.
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

// One round-trip:
//   1. Anchor the user with the label-index lookup on (Member&Active).
//   2. OPTIONAL MATCH each servant edge to a spine node — the OPTIONAL
//      preserves the row when the user has no edges (returns empty trees).
//   3. Per-edge subquery #1: walk the spine downwards from `scoped` and
//      collect `[scoped.id] + descendants` as `reach`.
//   4. Per-edge subquery #2: walk the spine upwards from `scoped` and
//      collect ancestor ids — needed so the user can render breadcrumbs
//      that climb to their Denomination even though they hold no role
//      above their tree root.
//   5. Build the `servantTrees` list and the union of all reaches +
//      ancestors. Dedup is O(N) via `UNWIND … collect(DISTINCT …)` inside
//      a CALL subquery so the outer row survives even when both inner
//      lists are empty (the zero-edge user case).
//   6. The spine-level label resolution uses an explicit CASE rather than
//      `labels(scoped)[0]` — Governorship nodes carry the multi-label
//      `[:Constituency:Active:Governorship:Team]` in prod and `labels[0]`
//      would silently return `Constituency`, which is not a `ChurchLevel`,
//      breaking every downstream `edgeToRole` lookup for governors.
const AUTHORITY_CYPHER = `
  MATCH (m:Member&Active {id: $userId})
  OPTIONAL MATCH (m)-[edge:${SERVANT_EDGES}]->(scoped${SPINE_LABEL_DISJUNCTION})
  CALL {
    WITH scoped
    OPTIONAL MATCH (scoped)-[:HAS*1..6]->(d${SPINE_LABEL_DISJUNCTION})
    WITH scoped, collect(DISTINCT d.id) AS descIds
    RETURN CASE
             WHEN scoped IS NULL THEN []
             ELSE [scoped.id] + [id IN descIds WHERE id <> scoped.id]
           END AS reach
  }
  CALL {
    WITH scoped
    OPTIONAL MATCH (a${SPINE_LABEL_DISJUNCTION})-[:HAS*1..6]->(scoped)
    WITH scoped, collect(DISTINCT a.id) AS ancIds
    RETURN CASE WHEN scoped IS NULL THEN [] ELSE ancIds END AS ancestors
  }
  WITH edge, scoped, reach, ancestors,
       CASE
         WHEN scoped:Denomination THEN 'Denomination'
         WHEN scoped:Oversight    THEN 'Oversight'
         WHEN scoped:Campus       THEN 'Campus'
         WHEN scoped:Stream       THEN 'Stream'
         WHEN scoped:Council      THEN 'Council'
         WHEN scoped:Governorship THEN 'Governorship'
         WHEN scoped:Bacenta      THEN 'Bacenta'
         ELSE NULL
       END AS spineLevel
  WITH
    collect(CASE WHEN scoped IS NULL OR spineLevel IS NULL THEN NULL ELSE {
      type: type(edge),
      level: spineLevel,
      churchId: scoped.id,
      churchName: scoped.name,
      reach: reach
    } END) AS rawTrees,
    collect(reach) AS reachLists,
    collect(ancestors) AS ancestorLists
  WITH
    [t IN rawTrees WHERE t IS NOT NULL] AS servantTrees,
    reachLists, ancestorLists
  CALL {
    WITH reachLists, ancestorLists
    UNWIND reachLists + ancestorLists AS lst
    UNWIND lst AS id
    WITH id WHERE id IS NOT NULL
    RETURN collect(DISTINCT id) AS allowedChurchIds
  }
  RETURN servantTrees, allowedChurchIds
`

type CacheEntry = {
  authority: AuthorityPayload
  expiresAtMs: number
}

// Module-level cache keyed on `${userId}:${iat}`. The iat in the key means a
// re-issued token (after a role change forces a refresh) gets a fresh entry
// automatically — no manual invalidation needed.
const cache = new Map<string, CacheEntry>()

// Keep memory bounded if a deploy stays up long enough to accumulate
// expired entries that no longer get hit. 5 000 entries ≈ a few hundred KB
// of metadata; with `reach` payloads attached a Denomination-leader entry
// is on the order of ~10 KB, so the worst-case ceiling stays well under 100 MB.
const MAX_CACHE_ENTRIES = 5000

// Per-call frozen factory rather than a shared singleton so a future caller
// that accidentally mutates `authority.servantTrees` doesn't poison the
// cache for every other user.
const emptyAuthority = (): AuthorityPayload => ({
  servantTrees: [],
  allowedChurchIds: [],
})

const sweepExpired = (nowMs: number): void => {
  for (const [key, entry] of cache) {
    if (entry.expiresAtMs <= nowMs) {
      cache.delete(key)
    }
  }
}

export const computeUserAuthority = async (
  driver: Driver,
  userId: string,
  iat: number | undefined,
  expSec: number | undefined
): Promise<AuthorityPayload> => {
  const nowMs = Date.now()
  const cacheKey = `${userId}:${iat ?? 0}`
  const cached = cache.get(cacheKey)
  if (cached && cached.expiresAtMs > nowMs) {
    return cached.authority
  }

  const session = driver.session()
  let authority: AuthorityPayload = emptyAuthority()
  try {
    const result = await session.executeRead((tx) =>
      tx.run(AUTHORITY_CYPHER, { userId })
    )
    if (result.records.length > 0) {
      const servantTrees =
        (result.records[0].get('servantTrees') as ServantTree[]) ?? []
      const allowedChurchIds =
        (result.records[0].get('allowedChurchIds') as string[]) ?? []
      authority = { servantTrees, allowedChurchIds }
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
  cache.set(cacheKey, { authority, expiresAtMs })

  return authority
}

// Back-compat shim — callers that only need the flat id list can still use
// the legacy entry point. Internally this delegates to `computeUserAuthority`
// so the cache stays single-keyed and consistent.
export const computeAllowedChurchIds = async (
  driver: Driver,
  userId: string,
  iat: number | undefined,
  expSec: number | undefined
): Promise<string[]> => {
  const authority = await computeUserAuthority(driver, userId, iat, expSec)
  return authority.allowedChurchIds
}

// Exposed for tests; also useful if the auth-service ever signals
// out-of-band that a user's scope changed mid-session.
export const clearAllowedChurchIdsCache = (): void => {
  cache.clear()
}
