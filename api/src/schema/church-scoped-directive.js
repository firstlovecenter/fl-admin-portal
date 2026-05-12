/* eslint-disable @typescript-eslint/no-var-requires */
/*
 * Expands `# @churchScoped(level: <Level>)` markers in SDL into a full
 * `@authorization(filter: [...])` directive that grants READ/AGGREGATE access
 * to a node when any of the user's `churchScopes` JWT claims belongs to the
 * same hierarchical chain — same level, an ancestor, or a descendant.
 *
 * Place the marker between `type X implements Y` and the opening `{`:
 *
 *   type Bacenta implements Church
 *     # @churchScoped(level: Bacenta)
 *   {
 *     id: ID @id
 *     ...
 *   }
 *
 * Hierarchy (root → leaf):
 *   Denomination → Oversight → Campus → Stream → Council → Governorship → Bacenta
 *
 * Each child carries a singular @relationship field pointing at its parent
 * (e.g. `governorship: Governorship`); each parent carries a list field
 * pointing at its children (e.g. `bacentas: [Bacenta!]!`). For list-direction
 * traversal we use the `_SOME` filter input suffix (v6.6 syntax).
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

const SCOPES_AT_LEVEL = {
  Bacenta: ['leadsBacentaOf'],
  Governorship: ['leadsGovernorshipOf', 'isAdminForGovernorshipOf'],
  Council: [
    'leadsCouncilOf',
    'isAdminForCouncilOf',
    'isArrivalsAdminForCouncilOf',
    'isArrivalsPayerCouncilOf',
  ],
  Stream: [
    'leadsStreamOf',
    'isAdminForStreamOf',
    'isArrivalsAdminForStreamOf',
    'isArrivalsCounterForStreamOf',
    'isTellerForStreamOf',
    'isSheepSeekerForStreamOf',
  ],
  Campus: ['leadsCampusOf', 'isAdminForCampusOf', 'isArrivalsAdminForCampusOf'],
  Oversight: ['leadsOversightOf', 'isAdminForOversightOf'],
  Denomination: ['leadsDenominationOf', 'isAdminForDenominationOf'],
}

// child → parent: singular @relationship field name on the child type.
const PARENT_FIELD_OF = {
  Bacenta: 'governorship',
  Governorship: 'council',
  Council: 'stream',
  Stream: 'campus',
  Campus: 'oversight',
  Oversight: 'denomination',
  Denomination: null,
}

// parent → children: list @relationship field name on the parent type.
// The filter input exposes this as `<field>_SOME`.
const CHILDREN_FIELD_OF = {
  Denomination: 'oversights',
  Oversight: 'campuses',
  Campus: 'streams',
  Stream: 'councils',
  Council: 'governorships',
  Governorship: 'bacentas',
  Bacenta: null,
}

const indexOf = (level) => {
  const idx = HIERARCHY.indexOf(level)
  if (idx < 0) {
    throw new Error(
      `church-scoped-directive: unknown level "${level}". ` +
        `Expected one of: ${HIERARCHY.join(', ')}`
    )
  }
  return idx
}

// Build the field-path from the type at `targetLevel` to a node at
// `scopeLevel`. Walks up through PARENT_FIELD_OF for ancestors, down through
// CHILDREN_FIELD_OF (with `_SOME`) for descendants.
const fieldPathBetween = (targetLevel, scopeLevel) => {
  const targetIdx = indexOf(targetLevel)
  const scopeIdx = indexOf(scopeLevel)
  const parts = []
  if (targetIdx === scopeIdx) return parts
  if (scopeIdx < targetIdx) {
    // scope is an ancestor of target: walk up via singular fields. Singular
    // relationships in v7 nest directly: `governorship: { ... }`.
    let cursor = targetLevel
    while (cursor !== scopeLevel) {
      const field = PARENT_FIELD_OF[cursor]
      if (!field) {
        throw new Error(
          `fieldPathBetween: ${targetLevel} has no ancestor path to ${scopeLevel}`
        )
      }
      parts.push({ field, list: false })
      cursor = HIERARCHY[indexOf(cursor) - 1]
    }
  } else {
    // scope is a descendant of target: walk down via list fields wrapped in
    // a `some` predicate (v7 nested-input form). The buildBranch step needs
    // to know which path components are list traversals so it can emit
    // `<field>: { some: { ... } }` rather than `<field>: { ... }`.
    let cursor = targetLevel
    while (cursor !== scopeLevel) {
      const field = CHILDREN_FIELD_OF[cursor]
      if (!field) {
        throw new Error(
          `fieldPathBetween: ${targetLevel} has no descendant path to ${scopeLevel}`
        )
      }
      parts.push({ field, list: true })
      cursor = HIERARCHY[indexOf(cursor) + 1]
    }
    return parts
  }
  return parts
}

const buildBranch = (pathParts, scopeKey) => {
  // v7 nested-input filter form. Singular relationship fields nest directly
  // (`governorship: { ... }`); list relationship fields wrap the predicate
  // in `some` (`bacentas: { some: { ... } }`).
  //
  // We reference the JWT claim by its nested path
  // (`$jwt.churchScopes.<key>.id`) rather than via a `@jwtClaim`-aliased
  // flat field. Empirically, v7's `@jwtClaim` does not populate the claims
  // map for nested-object aliases — the alias lookup falls through and the
  // engine compares against `undefined`, which excludes everything. Direct
  // path resolution works.
  const leaf = { id: { eq: `$jwt.churchScopes.${scopeKey}.id` } }
  let inner = leaf
  for (let i = pathParts.length - 1; i >= 0; i -= 1) {
    const segment = pathParts[i]
    inner = segment.list
      ? { [segment.field]: { some: inner } }
      : { [segment.field]: inner }
  }
  return inner
}

// `includeDescendants` controls whether scope-holders BELOW `targetLevel`
// can also read. Default true (used by spine `@churchScoped` so a Bacenta
// leader can read THEIR own Bacenta — the predicate matches that Bacenta
// only). For node-level financial filters via `@churchScopedVia`, set
// false so a Bacenta leader cannot read sibling-Bacenta financials by
// virtue of sharing a Council.
const buildAuthorizationBranches = (
  targetLevel,
  { includeDescendants = true } = {}
) => {
  const targetIdx = indexOf(targetLevel)
  const branches = []
  for (const scopeLevel of HIERARCHY) {
    const scopeIdx = indexOf(scopeLevel)
    if (includeDescendants || scopeIdx <= targetIdx) {
      const path = fieldPathBetween(targetLevel, scopeLevel)
      for (const scopeKey of SCOPES_AT_LEVEL[scopeLevel]) {
        branches.push(buildBranch(path, scopeKey))
      }
    }
  }
  return branches
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

const buildChurchScopedDirective = (level) => {
  const branches = buildAuthorizationBranches(level)
  const where = { node: { OR: branches } }
  return `@authorization(filter: [{ operations: [READ, AGGREGATE], where: ${toGraphQL(
    where
  )} }])`
}

// Like buildChurchScopedDirective, but for a node that doesn't itself sit on
// the church spine — instead, it carries a singular @relationship to a
// church-spine node (e.g. AccountTransaction.council). The generated filter
// nests the scope predicate inside the relationship field so the auto-
// generated read query (e.g. `accountTransactions(where: { id: { eq: ... } })`)
// is restricted to nodes whose related church is in the caller's scope.
//
// Descendants are EXCLUDED — a Bacenta leader sharing a Council with the
// node should not gain READ access by virtue of being below the via-level
// (their AccountTransaction reads aren't "their own data" the way their own
// Bacenta would be). Use the spine `@churchScoped` if descendant inclusion
// is desired.
const buildChurchScopedViaDirective = (relationshipField, level) => {
  const branches = buildAuthorizationBranches(level, {
    includeDescendants: false,
  })
  const where = { node: { [relationshipField]: { OR: branches } } }
  return `@authorization(filter: [{ operations: [READ, AGGREGATE], where: ${toGraphQL(
    where
  )} }])`
}

// Anchor the marker to the type-header line so a comment elsewhere in any of
// the 16 SDL files can never get expanded into a free-floating directive.
// Captures: 1) the type header, 2) the `level: X` argument, 3) the level name
// in the type header (for cross-check below).
// Allow optional intervening directives (e.g. `@node`) between the type
// header and the marker comment. Greedy on the header lets us capture e.g.
// `type Bacenta implements Church @node` before the `# @churchScoped(...)`.
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
  SCOPES_AT_LEVEL,
  PARENT_FIELD_OF,
  CHILDREN_FIELD_OF,
  fieldPathBetween,
  buildAuthorizationBranches,
}
