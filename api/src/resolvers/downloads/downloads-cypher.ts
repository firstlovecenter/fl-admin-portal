// Per-level Cypher for the streaming membership CSV export.
//
//   1. Returns ONE ROW per member (no `collect(...)`) so the driver can
//      stream records into the CSV writer.
//   2. Returns flat scalars whose names match the keys the handler reads,
//      so the handler can write rows without per-record reshaping.
//
// Keys here MUST match the `ColumnDef.key` values produced by
// `buildColumnsForLevels` / `IDENTITY_COLUMNS` in `downloads-handler.ts`
// AND the parallel FE `TICKABLE_LEVELS` / `buildPreviewHeaders` in
// `web-react-ts/.../DownloadMembershipList.tsx`. Adding a new column is a
// three-file change. Removing a column from RETURN without removing the
// matching FE/BE entry leaves blank cells in the CSV.
//
// The 7 per-level templates below compose three static Cypher fragments
// (`LEADER_OPTIONALS`, `COMMON_OPTIONALS`, `ROW_RETURN`) via `${…}` so the
// column list and the leader join live in one place each. `fl-cypher/
// no-interpolated-cypher` (ADR-012) is configured in `api/package.json` with
// an `allowedIdentifiers` override that exempts exactly these three
// identifiers in exactly this file — see the rule's docblock for why bare
// `Identifier` references to compile-time `const FOO = `…`` fragments carry
// no injection risk. Any new `${…}` introduced here MUST be a reference to
// a fragment that is also listed in the override, or it will be flagged.

import type { ChurchLevel } from '../utils/types'

// No `ORDER BY` here on purpose. Sorting forces Cypher to materialize the
// full result set server-side before emitting the first row, which defeats
// the streaming intent for large levels (Campus, Oversight). The CSV is
// imported into spreadsheets that can sort downstream. The 5-row preview
// (rendered via the GraphQL `members(limit: 5)` field on each level) does
// have an ORDER BY because it's bounded.
//
// Every export emits the full upward hierarchy from Oversight down to
// Bacenta so a Denomination/Oversight/Campus/Stream/Council CSV is
// self-describing — the consumer can see which Council a Bacenta belongs
// to without joining against another sheet. Higher-level columns are
// repeated for every member row (denormalised on purpose for spreadsheet
// use).
// Leader names use trim(coalesce(firstName, '') + ' ' + coalesce(lastName, ''))
// rather than `firstName + ' ' + lastName` because raw `+` in Cypher 5 collapses
// to null if EITHER operand is null — a member with a missing last name (rare
// but present in the directory) would otherwise show as a blank leader cell.
const ROW_RETURN = `
RETURN
  oversight.name AS oversight,
  trim(coalesce(oversightLeader.firstName, '') + ' ' + coalesce(oversightLeader.lastName, '')) AS oversightLeader,
  oversightLeader.phoneNumber AS oversightLeaderPhone,
  campus.name AS campus,
  trim(coalesce(campusLeader.firstName, '') + ' ' + coalesce(campusLeader.lastName, '')) AS campusLeader,
  campusLeader.phoneNumber AS campusLeaderPhone,
  stream.name AS stream,
  trim(coalesce(streamLeader.firstName, '') + ' ' + coalesce(streamLeader.lastName, '')) AS streamLeader,
  streamLeader.phoneNumber AS streamLeaderPhone,
  council.name AS council,
  trim(coalesce(councilLeader.firstName, '') + ' ' + coalesce(councilLeader.lastName, '')) AS councilLeader,
  councilLeader.phoneNumber AS councilLeaderPhone,
  governorship.name AS governorship,
  trim(coalesce(governorshipLeader.firstName, '') + ' ' + coalesce(governorshipLeader.lastName, '')) AS governorshipLeader,
  governorshipLeader.phoneNumber AS governorshipLeaderPhone,
  bacenta.name AS bacenta,
  trim(coalesce(bacentaLeader.firstName, '') + ' ' + coalesce(bacentaLeader.lastName, '')) AS bacentaLeader,
  bacentaLeader.phoneNumber AS bacentaLeaderPhone,
  member.firstName AS firstName,
  member.lastName AS lastName,
  member.phoneNumber AS phoneNumber,
  member.whatsappNumber AS whatsappNumber,
  member.email AS email,
  maritalStatus,
  gender,
  dateOfBirth,
  member.visitationArea AS visitationArea,
  basonta
`

// All OPTIONAL: legacy used required MATCH and silently dropped members
// whose profile was incomplete (no marital status / gender / dob / basonta).
// That is silent data loss in the export — switching to OPTIONAL surfaces
// those members with blank cells instead.
//
// Each lookup is wrapped in a `CALL { WITH member … LIMIT 1 RETURN … }`
// subquery so that members with duplicate `HAS_GENDER` / `HAS_MARITAL_STATUS`
// (the dev DB has some) do NOT fan out into multiple CSV rows. Without
// `LIMIT 1` the previous implementation emitted one row per cartesian combo
// (e.g. 2 genders × 2 marital statuses = 4 duplicate rows per such member),
// silently corrupting downstream consumers. Verified on dev: 72-member
// Denomination shrinks from 80 emitted rows to 72.
const COMMON_OPTIONALS = `
CALL {
  WITH member
  OPTIONAL MATCH (member)-[:HAS_MARITAL_STATUS]->(m:MaritalStatus)
  RETURN m.status AS maritalStatus LIMIT 1
}
CALL {
  WITH member
  OPTIONAL MATCH (member)-[:HAS_GENDER]->(g:Gender)
  RETURN g.gender AS gender LIMIT 1
}
CALL {
  WITH member
  OPTIONAL MATCH (member)-[:WAS_BORN_ON]->(d:TimeGraph)
  RETURN toString(d.date) AS dateOfBirth LIMIT 1
}
CALL {
  WITH member
  OPTIONAL MATCH (member)-[:BELONGS_TO]->(b:Basonta)
  RETURN b.name AS basonta LIMIT 1
}
`

// Leader matches for every hierarchy level. OPTIONAL so a missing leader
// at any level yields a blank cell instead of dropping the member from
// the export. Assumes every level variable (oversight, campus, stream,
// council, governorship, bacenta) is already bound — each per-level query
// guarantees that via its entry MATCH + upward walk.
const LEADER_OPTIONALS = `
OPTIONAL MATCH (oversight)<-[:LEADS]-(oversightLeader:Active:Member)
OPTIONAL MATCH (campus)<-[:LEADS]-(campusLeader:Active:Member)
OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
`

export const bacentaDownloadRows = `
MATCH (bacenta:Bacenta {id: $id})<-[:BELONGS_TO]-(member:Active:Member)
OPTIONAL MATCH (bacenta)<-[:HAS]-(governorship:Governorship)<-[:HAS]-(council:Council)<-[:HAS]-(stream:Stream)<-[:HAS]-(campus:Campus)<-[:HAS]-(oversight:Oversight)
${LEADER_OPTIONALS}
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const governorshipDownloadRows = `
MATCH (governorship:Governorship {id: $id})-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
OPTIONAL MATCH (governorship)<-[:HAS]-(council:Council)<-[:HAS]-(stream:Stream)<-[:HAS]-(campus:Campus)<-[:HAS]-(oversight:Oversight)
${LEADER_OPTIONALS}
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const councilDownloadRows = `
MATCH (council:Council {id: $id})-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
OPTIONAL MATCH (council)<-[:HAS]-(stream:Stream)<-[:HAS]-(campus:Campus)<-[:HAS]-(oversight:Oversight)
${LEADER_OPTIONALS}
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const streamDownloadRows = `
MATCH (stream:Stream {id: $id})-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
OPTIONAL MATCH (stream)<-[:HAS]-(campus:Campus)<-[:HAS]-(oversight:Oversight)
${LEADER_OPTIONALS}
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const campusDownloadRows = `
MATCH (campus:Campus {id: $id})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
OPTIONAL MATCH (campus)<-[:HAS]-(oversight:Oversight)
${LEADER_OPTIONALS}
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const oversightDownloadRows = `
MATCH (oversight:Oversight {id: $id})-[:HAS]->(campus:Campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
${LEADER_OPTIONALS}
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const denominationDownloadRows = `
MATCH (denomination:Denomination {id: $id})-[:HAS]->(oversight:Oversight)-[:HAS]->(campus:Campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
${LEADER_OPTIONALS}
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export type DownloadLevel = Extract<
  ChurchLevel,
  | 'Bacenta'
  | 'Governorship'
  | 'Council'
  | 'Stream'
  | 'Campus'
  | 'Oversight'
  | 'Denomination'
>

export const ROWS_BY_LEVEL: Record<DownloadLevel, string> = {
  Bacenta: bacentaDownloadRows,
  Governorship: governorshipDownloadRows,
  Council: councilDownloadRows,
  Stream: streamDownloadRows,
  Campus: campusDownloadRows,
  Oversight: oversightDownloadRows,
  Denomination: denominationDownloadRows,
}

// Used to populate the Content-Disposition filename. Kept as a separate
// (cheap) lookup so the row query can stay focused on per-member columns.
//
// Each query also gates on the caller having a `:LEADS`, `:DEPUTY_LEADS`,
// or `:IS_ADMIN_FOR` servant edge that either lands on this exact church
// or on an ancestor that reaches it via `:HAS*1..6`. Combined with
// `isAuth(permitLeaderAdmin(level), …)` in the handler, this closes the
// SYN-95-style IDOR — without the inline EXISTS, an `adminDenomination`
// from a different denomination could download our denomination's full
// PII. `DEPUTY_LEADS` is included because `edgeToRole` in
// `permissions.ts` maps it to the same `leader<Level>` role family as
// `LEADS`. A 0-row return surfaces as the existing 404 path in the
// handler so we don't leak whether the id exists vs is out-of-scope.
//
// The authority check is split into two adjacent `EXISTS` blocks instead
// of `EXISTS { … WHERE scoped = n OR (scoped)-[:HAS*1..6]->(n) }`. The
// previous single-block form left the Cypher 5 planner free to evaluate
// the variable-length walk eagerly even when the direct branch was true,
// because the planner doesn't always short-circuit `OR` across pattern
// variants. Splitting forces a strict-OR shape: the direct lookup is a
// plain `:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR` index hit with zero traversal,
// and the spine-walk variant only runs when the direct check fails.
//
// Each level's statement is written out longhand because the `MATCH (n:
// <Label> {id: $id})` line is the only piece that varies per level and
// `fl-cypher/no-interpolated-cypher` (ADR-012) forbids `${}` for the
// label. The two `EXISTS` blocks are identical text across levels and
// could be lifted to a shared fragment under the file's static-fragment
// override, but the duplication is local and obvious — keep it inline.
export const NAME_QUERY_BY_LEVEL: Record<DownloadLevel, string> = {
  Bacenta: `MATCH (n:Bacenta {id: $id})
    WHERE EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(n)
    } OR EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(scoped)
      WHERE (scoped)-[:HAS*1..6]->(n)
    }
    RETURN n.name AS name`,
  Governorship: `MATCH (n:Governorship {id: $id})
    WHERE EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(n)
    } OR EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(scoped)
      WHERE (scoped)-[:HAS*1..6]->(n)
    }
    RETURN n.name AS name`,
  Council: `MATCH (n:Council {id: $id})
    WHERE EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(n)
    } OR EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(scoped)
      WHERE (scoped)-[:HAS*1..6]->(n)
    }
    RETURN n.name AS name`,
  Stream: `MATCH (n:Stream {id: $id})
    WHERE EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(n)
    } OR EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(scoped)
      WHERE (scoped)-[:HAS*1..6]->(n)
    }
    RETURN n.name AS name`,
  Campus: `MATCH (n:Campus {id: $id})
    WHERE EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(n)
    } OR EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(scoped)
      WHERE (scoped)-[:HAS*1..6]->(n)
    }
    RETURN n.name AS name`,
  Oversight: `MATCH (n:Oversight {id: $id})
    WHERE EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(n)
    } OR EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(scoped)
      WHERE (scoped)-[:HAS*1..6]->(n)
    }
    RETURN n.name AS name`,
  Denomination: `MATCH (n:Denomination {id: $id})
    WHERE EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(n)
    } OR EXISTS {
      MATCH (caller:Active:Member {id: $userId})-[:LEADS|DEPUTY_LEADS|IS_ADMIN_FOR]->(scoped)
      WHERE (scoped)-[:HAS*1..6]->(n)
    }
    RETURN n.name AS name`,
}
