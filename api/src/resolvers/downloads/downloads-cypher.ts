// Per-level Cypher for the streaming membership CSV export.
//
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
//
// Every export emits the full upward hierarchy from Oversight down to
// Bacenta so a Denomination/Oversight/Campus/Stream/Council CSV is
// self-describing — the consumer can see which Council a Bacenta belongs
// to without joining against another sheet. Higher-level columns are
// repeated for every member row (denormalised on purpose for spreadsheet
// use).
const ROW_RETURN = `
RETURN
  oversight.name AS oversight,
  oversightLeader.firstName + ' ' + oversightLeader.lastName AS oversightLeader,
  campus.name AS campus,
  campusLeader.firstName + ' ' + campusLeader.lastName AS campusLeader,
  stream.name AS stream,
  streamLeader.firstName + ' ' + streamLeader.lastName AS streamLeader,
  council.name AS council,
  councilLeader.firstName + ' ' + councilLeader.lastName AS councilLeader,
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

// All OPTIONAL: legacy used required MATCH and silently dropped members
// whose profile was incomplete (no marital status / gender / dob / basonta).
// That is silent data loss in the export — switching to OPTIONAL surfaces
// those members with blank cells instead.
const COMMON_OPTIONALS = `
OPTIONAL MATCH (member)-[:HAS_MARITAL_STATUS]->(maritalStatus:MaritalStatus)
OPTIONAL MATCH (member)-[:HAS_GENDER]->(gender:Gender)
OPTIONAL MATCH (member)-[:WAS_BORN_ON]->(dob:TimeGraph)
OPTIONAL MATCH (member)-[:BELONGS_TO]->(basonta:Basonta)
`

// Leader matches for every hierarchy level. OPTIONAL so a missing leader
// at any level yields a blank cell instead of dropping the member from
// the export. Assumes every level variable (oversight, campus, stream,
// council, governorship, bacenta) is already bound — each per-level query
// guarantees that via its entry MATCH + upward walk.
const LEADER_OPTIONALS = `
OPTIONAL MATCH (oversight)<-[:LEADS]-(oversightLeader:Member)
OPTIONAL MATCH (campus)<-[:LEADS]-(campusLeader:Member)
OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Member)
OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Member)
OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Member)
OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Member)
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
export const NAME_QUERY_BY_LEVEL: Record<DownloadLevel, string> = {
  Bacenta: `MATCH (n:Bacenta {id: $id}) RETURN n.name AS name`,
  Governorship: `MATCH (n:Governorship {id: $id}) RETURN n.name AS name`,
  Council: `MATCH (n:Council {id: $id}) RETURN n.name AS name`,
  Stream: `MATCH (n:Stream {id: $id}) RETURN n.name AS name`,
  Campus: `MATCH (n:Campus {id: $id}) RETURN n.name AS name`,
  Oversight: `MATCH (n:Oversight {id: $id}) RETURN n.name AS name`,
  Denomination: `MATCH (n:Denomination {id: $id}) RETURN n.name AS name`,
}
