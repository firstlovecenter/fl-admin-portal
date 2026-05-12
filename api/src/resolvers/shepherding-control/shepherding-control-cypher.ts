// Per-level scope-check Cypher. We anchor on the target node (bound by
// `$id`), then walk backwards up the church hierarchy at most 6 hops,
// gated by a label-allowlist so non-hierarchy `:HAS` edges (spouse,
// HistoryLog, Basonta, etc.) cannot leak into the path. The Boolean fold
// — direct match OR ancestor match — collapses into `*0..6` so a single
// EXISTS suffices.
//
// Each statement is built at module load from the literal LEVELS tuple
// below; `args.level` never crosses the interpolation boundary (the
// resolver looks up the precomputed string from the whitelist record).
// ADR-012.

export const SHEPHERDING_LEVELS = [
  'Denomination',
  'Oversight',
  'Campus',
  'Stream',
  'Council',
  'Governorship',
  'Bacenta',
] as const

export type ShepherdingLevel = (typeof SHEPHERDING_LEVELS)[number]

const HIERARCHY_LABELS = `['Denomination','Oversight','Campus','Stream','Council','Governorship','Bacenta']`

const buildScopeCheck = (label: ShepherdingLevel): string => `
  MATCH (caller:Active:Member {id: $userId})
  OPTIONAL MATCH (target:${label} {id: $id})
  RETURN target IS NOT NULL AND EXISTS {
    MATCH path = (target)<-[:HAS*0..6]-(ancestor)
    WHERE all(n IN nodes(path)
              WHERE any(l IN labels(n) WHERE l IN ${HIERARCHY_LABELS}))
      AND (caller)-[:LEADS|IS_ADMIN_FOR]->(ancestor)
  } AS allowed
`

const SHEPHERDING_SCOPE_CHECK_CYPHER: Record<ShepherdingLevel, string> =
  Object.fromEntries(
    SHEPHERDING_LEVELS.map((label) => [label, buildScopeCheck(label)])
  ) as Record<ShepherdingLevel, string>

export default SHEPHERDING_SCOPE_CHECK_CYPHER
