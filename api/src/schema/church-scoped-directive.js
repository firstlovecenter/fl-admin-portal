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
  Campus: [
    'leadsCampusOf',
    'isAdminForCampusOf',
    'isArrivalsAdminForCampusOf',
  ],
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
    // scope is an ancestor of target: walk up via singular fields
    let cursor = targetLevel
    while (cursor !== scopeLevel) {
      const field = PARENT_FIELD_OF[cursor]
      if (!field) {
        throw new Error(
          `fieldPathBetween: ${targetLevel} has no ancestor path to ${scopeLevel}`
        )
      }
      parts.push(field)
      cursor = HIERARCHY[indexOf(cursor) - 1]
    }
  } else {
    // scope is a descendant of target: walk down via list fields with _SOME
    let cursor = targetLevel
    while (cursor !== scopeLevel) {
      const field = CHILDREN_FIELD_OF[cursor]
      if (!field) {
        throw new Error(
          `fieldPathBetween: ${targetLevel} has no descendant path to ${scopeLevel}`
        )
      }
      parts.push(`${field}_SOME`)
      cursor = HIERARCHY[indexOf(cursor) + 1]
    }
  }
  return parts
}

const buildBranch = (pathParts, scopeKey) => {
  const leaf = { id_EQ: `$jwt.${scopeKey}Id` }
  let inner = leaf
  for (let i = pathParts.length - 1; i >= 0; i -= 1) {
    inner = { [pathParts[i]]: inner }
  }
  return inner
}

const buildAuthorizationBranches = (targetLevel) => {
  indexOf(targetLevel) // validate
  const branches = []
  for (const scopeLevel of HIERARCHY) {
    const path = fieldPathBetween(targetLevel, scopeLevel)
    for (const scopeKey of SCOPES_AT_LEVEL[scopeLevel]) {
      branches.push(buildBranch(path, scopeKey))
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

// Anchor the marker to the type-header line so a comment elsewhere in any of
// the 16 SDL files can never get expanded into a free-floating directive.
// Captures: 1) the type header, 2) the `level: X` argument, 3) the level name
// in the type header (for cross-check below).
const MARKER_RE =
  /(type\s+([A-Za-z]+)\s+implements\s+\w+\s*)#\s*@churchScoped\(\s*level:\s*([A-Za-z]+)\s*\)/g

const expandChurchScopedMarkers = (sdl) =>
  sdl.replace(MARKER_RE, (_, header, typeName, level) => {
    if (typeName !== level) {
      throw new Error(
        `church-scoped-directive: marker level "${level}" does not match ` +
          `type "${typeName}". Update the marker so they agree.`
      )
    }
    return `${header}${buildChurchScopedDirective(level)}`
  })

module.exports = {
  buildChurchScopedDirective,
  expandChurchScopedMarkers,
  HIERARCHY,
  SCOPES_AT_LEVEL,
  PARENT_FIELD_OF,
  CHILDREN_FIELD_OF,
  fieldPathBetween,
  buildAuthorizationBranches,
}
