// Per-level Cypher for the streaming membership CSV export.
//
// Differences from the legacy `download-credits-member-cypher.ts`:
//   1. Returns ONE ROW per member (no `collect(...)`) so the driver can
//      stream records into the CSV writer.
//   2. Returns flat scalars in the column order used by the CSV header,
//      so the handler can write rows without per-record reshaping.
//
// Column order MUST stay in lockstep with `CSV_COLUMNS` in
// `downloads-handler.ts`. Adding/removing columns is a two-file change.

import type { ChurchLevel } from '../utils/types'

// No `ORDER BY` here on purpose. Sorting forces Cypher to materialize the
// full result set server-side before emitting the first row, which defeats
// the streaming intent for large levels (Campus, Oversight). The CSV is
// imported into spreadsheets that can sort downstream. The 5-row preview
// (rendered via the GraphQL `members(limit: 5)` field on each level) does
// have an ORDER BY because it's bounded.
const ROW_RETURN = `
RETURN
  governorship.name AS governorship,
  governorshipLeader.firstName + ' ' + governorshipLeader.lastName AS governorshipLeader,
  bacenta.name AS bacenta,
  bacentaLeader.firstName + ' ' + bacentaLeader.lastName AS bacentaLeader,
  member.firstName AS firstName,
  member.lastName AS lastName,
  member.phoneNumber AS phoneNumber,
  member.whatsappNumber AS whatsappNumber,
  member.email AS email,
  maritalStatus.status AS maritalStatus,
  gender.gender AS gender,
  toString(dob.date) AS dateOfBirth,
  member.visitationArea AS visitationArea,
  basonta.name AS basonta
`

// All four are OPTIONAL: legacy used required MATCH and silently dropped
// members whose profile was incomplete (no marital status / gender / dob /
// basonta). That is silent data loss in the export — switching to OPTIONAL
// surfaces those members with blank cells instead.
const COMMON_OPTIONALS = `
OPTIONAL MATCH (member)-[:HAS_MARITAL_STATUS]->(maritalStatus:MaritalStatus)
OPTIONAL MATCH (member)-[:HAS_GENDER]->(gender:Gender)
OPTIONAL MATCH (member)-[:WAS_BORN_ON]->(dob:TimeGraph)
OPTIONAL MATCH (member)-[:BELONGS_TO]->(basonta:Basonta)
`

export const bacentaDownloadRows = `
MATCH (bacenta:Bacenta {id: $id})<-[:BELONGS_TO]-(member:Active:Member)
MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)
MATCH (bacenta)<-[:HAS]-(governorship:Governorship)
MATCH (governorship)<-[:LEADS]-(governorshipLeader:Member)
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const governorshipDownloadRows = `
MATCH (governorship:Governorship {id: $id})-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
MATCH (governorship)<-[:LEADS]-(governorshipLeader:Member)
MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const councilDownloadRows = `
MATCH (council:Council {id: $id})-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
MATCH (governorship)<-[:LEADS]-(governorshipLeader:Member)
MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const streamDownloadRows = `
MATCH (stream:Stream {id: $id})-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
MATCH (governorship)<-[:LEADS]-(governorshipLeader:Member)
MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const campusDownloadRows = `
MATCH (campus:Campus {id: $id})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
MATCH (governorship)<-[:LEADS]-(governorshipLeader:Member)
MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export const oversightDownloadRows = `
MATCH (oversight:Oversight {id: $id})-[:HAS]->(campus:Campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
MATCH (governorship)<-[:LEADS]-(governorshipLeader:Member)
MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)
${COMMON_OPTIONALS}
${ROW_RETURN}
`

export type DownloadLevel = Extract<
  ChurchLevel,
  'Bacenta' | 'Governorship' | 'Council' | 'Stream' | 'Campus' | 'Oversight'
>

export const ROWS_BY_LEVEL: Record<DownloadLevel, string> = {
  Bacenta: bacentaDownloadRows,
  Governorship: governorshipDownloadRows,
  Council: councilDownloadRows,
  Stream: streamDownloadRows,
  Campus: campusDownloadRows,
  Oversight: oversightDownloadRows,
}

// Used to populate the Content-Disposition filename. Kept as a separate
// (cheap) lookup so the row query can stay focused on per-member columns.
export const NAME_QUERY_BY_LEVEL: Record<DownloadLevel, string> = {
  Bacenta: `MATCH (n:Bacenta {id: $id}) RETURN n.name AS name`,
  Governorship: `MATCH (n:Governorship {id: $id}) RETURN n.name AS name`,
  Council: `MATCH (n:Council {id: $id}) RETURN n.name AS name`,
  Stream: `MATCH (n:Stream {id: $id}) RETURN n.name AS name`,
  Campus: `MATCH (n:Campus {id: $id}) RETURN n.name AS name`,
  Oversight: `MATCH (n:Oversight {id: $id}) RETURN n.name AS name`,
}
