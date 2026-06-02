/* eslint-disable @typescript-eslint/no-var-requires */
/*
 * Expands `# @churchScoped(level: <Level>)` and
 * `# @churchScopedVia(field: <field>, level: <Level>)` markers in SDL into a
 * full `@authorization(filter: [...])` directive that gates READ/AGGREGATE
 * access on the church spine.
 *
 * The filter is the AND of two predicates:
 *   1. The caller's JWT has at least one of the level-appropriate roles
 *      (leaderDenomination, adminDenomination, leaderOversight, …) — a
 *      coarse "does this user belong on this level of the spine at all?"
 *      gate.
 *   2. The node's id is in `$jwt.allowedChurchIds` — the flat list of
 *      every church-spine id the user actually has servant edges to,
 *      computed once per request from Neo4j and injected into
 *      `context.jwt`. See `api/src/resolvers/utils/allowed-church-ids.ts`.
 *
 * Earlier (SYN-95) versions emitted a 20-branch OR predicate that walked
 * up to 4 `some`-nested relationship hops per branch (e.g.
 * `streams.some.councils.some.governorships.some.bacentas.some.id eq …`).
 * That worked on a single relationship resolution but multiplied
 * combinatorially when `memberByEmail` selected 21 relationships at once,
 * hanging the splash screen indefinitely. The flat-list form below is
 * O(1) per node regardless of fan-out.
 *
 * Marker placement (unchanged):
 *
 *   type Bacenta implements Church
 *     # @churchScoped(level: Bacenta)
 *   {
 *     id: ID @id
 *     ...
 *   }
 *
 *   type AccountTransaction
 *     # @churchScopedVia(field: council, level: Council)
 *   {
 *     ...
 *     council: Council @relationship(type: "HAS_TRANSACTION", direction: IN)
 *   }
 *
 * Hierarchy (root → leaf):
 *   Denomination → Oversight → Campus → Stream → Council → Governorship → Bacenta
 */

const HIERARCHY = [
  'Denomination',
  'Oversight',
  'Campus',
  'Stream',
  'Council',
  'Governorship',
  'Bacenta',
]

// Council-and-above leader/admin roles. Used for `@churchScopedVia` on
// non-spine financial nodes (e.g. AccountTransaction) — the SYN-95 IDOR was
// that a `leaderBacenta` could read any council's ledger via the root
// `accountTransactions` query. Gating those reads to Council-level+ roles
// (combined with the AccountTransaction's council being in the caller's
// `allowedChurchIds`) closes that finding.
//
// Spine `@churchScoped` reads (on Oversight/Campus/Stream/Council) do NOT
// take a role gate — every authenticated user must be able to walk
// `member.bacenta.governorship.council.stream.campus.oversight.denomination`
// to populate `SetPermissions` and `ChurchContext`. The `allowedChurchIds`
// predicate (computed from servant edges in Neo4j) is the per-instance
// boundary that stops cross-tenant reads on the spine.
const FINANCIAL_READ_ROLES = [
  'leaderDenomination',
  'leaderOversight',
  'leaderCampus',
  'leaderStream',
  'leaderCouncil',
  'adminDenomination',
  'adminOversight',
  'adminCampus',
  'adminStream',
  'adminCouncil',
]

const assertKnownLevel = (level) => {
  if (!HIERARCHY.includes(level)) {
    throw new Error(
      `church-scoped-directive: unknown level "${level}". ` +
        `Expected one of: ${HIERARCHY.join(', ')}`
    )
  }
}

const toGraphQL = (value) => {
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(toGraphQL).join(', ')}]`
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value).map(
      ([k, v]) => `${k}: ${toGraphQL(v)}`
    )
    return `{ ${entries.join(', ')} }`
  }
  throw new Error(`toGraphQL: unsupported value ${typeof value}`)
}

// JWT-side predicate: OR over each role-with-includes check. v7 keeps the
// legacy `includes` syntax for `roles`-array lookups.
const financialRolesPredicate = () => ({
  OR: FINANCIAL_READ_ROLES.map((role) => ({ roles: { includes: role } })),
})

// Node-side predicate. The node is either the spine type itself (for
// `@churchScoped`) or reached via a singular relationship from a non-spine
// node (for `@churchScopedVia`).
const idInAllowedPredicate = () => ({
  id: { in: '$jwt.allowedChurchIds' },
})

// Spine type read gate: id-in-list only. Any authenticated user must be
// able to traverse their own ancestor chain (Bacenta → … → Denomination);
// blocking that with a role gate breaks `SetPermissions` + `ChurchContext`
// for every leader below Council. The `allowedChurchIds` list is computed
// from the user's servant edges in Neo4j and so already excludes
// cross-tenant nodes the user doesn't own.
const buildChurchScopedDirective = (level) => {
  assertKnownLevel(level)
  const where = { node: idInAllowedPredicate() }
  return `@authorization(filter: [{ operations: [READ, AGGREGATE], where: ${toGraphQL(
    where
  )} }])`
}

// Non-spine via-marker (e.g. AccountTransaction → council:Council). Gates
// the read on BOTH the caller having a Council-level financial role AND the
// related church being in the caller's allowedChurchIds. The role gate is
// the SYN-95 IDOR fix; the id gate is the per-instance scope.
const buildChurchScopedViaDirective = (relationshipField, level) => {
  assertKnownLevel(level)
  const where = {
    AND: [
      { jwt: financialRolesPredicate() },
      { node: { [relationshipField]: idInAllowedPredicate() } },
    ],
  }
  return `@authorization(filter: [{ operations: [READ, AGGREGATE], where: ${toGraphQL(
    where
  )} }])`
}

// Anchor the marker to the type-header line so a comment elsewhere in any of
// the SDL files can never get expanded into a free-floating directive.
// Captures: 1) the type header, 2) the type name, 3) the marker's level arg.
// Allow optional intervening directives (e.g. `@node`) between the type
// header and the marker comment.
const MARKER_RE =
  /(type\s+([A-Za-z]+)\s+implements\s+\w+(?:\s+@\w+(?:\([^)]*\))?)*\s*)#\s*@churchScoped\(\s*level:\s*([A-Za-z]+)\s*\)/g

// Marker for a non-spine node that scopes via a singular relationship field
// to a spine node — e.g. AccountTransaction → council. Anchored to a type
// header that does NOT implement Church.
const MARKER_VIA_RE =
  /(type\s+([A-Za-z]+)(?:\s+@\w+(?:\([^)]*\))?)*\s*)#\s*@churchScopedVia\(\s*field:\s*([A-Za-z_][A-Za-z0-9_]*)\s*,\s*level:\s*([A-Za-z]+)\s*\)/g

const expandChurchScopedMarkers = (sdl) => {
  const expanded = sdl.replace(MARKER_RE, (_, header, typeName, level) => {
    if (typeName !== level) {
      throw new Error(
        `church-scoped-directive: marker level "${level}" does not match ` +
          `type "${typeName}". Update the marker so they agree.`
      )
    }
    return `${header}${buildChurchScopedDirective(level)}`
  })

  return expanded.replace(
    MARKER_VIA_RE,
    (_, header, _typeName, field, level) =>
      `${header}${buildChurchScopedViaDirective(field, level)}`
  )
}

module.exports = {
  buildChurchScopedDirective,
  buildChurchScopedViaDirective,
  expandChurchScopedMarkers,
  HIERARCHY,
  FINANCIAL_READ_ROLES,
}
