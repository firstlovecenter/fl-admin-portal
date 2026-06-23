/**
 * Sub-churches directory report Cypher.
 *
 * Returns one row per descendant church under the given church (NOT the
 * church itself — the user already has that context from the page header
 * and the report card is named "Sub-Churches Directory"). The CSV is
 * grouped by `level` on the frontend, so we produce one row per unit at
 * every level beneath the current one.
 *
 * Bacenta has no sub-churches, so its report is empty and the frontend
 * already hides the entry point at Bacenta scope.
 *
 * Each row includes the full `ancestors` chain (closest first) up to —
 * but not including — the scope, with each ancestor's leader contact
 * details. This lets the frontend build per-level CSVs that show, e.g.
 * at Council scope on the Bacenta CSV: Governorship + Governor first
 * name / last name / phone / WhatsApp alongside the bacenta's own leader.
 */

/* eslint-disable fl-cypher/no-interpolated-cypher --
   This file composes Cypher purely from the compile-time `DirectoryLevel`
   union ('Bacenta' | 'Governorship' | … | 'Oversight') and hardcoded Cypher
   variable aliases ('bacenta', 'bacentaLeader', etc.) via the static helpers
   `leaderField` / `ancestorObject` / `ancestorListExpr` /
   `directoryEntryProjection`. Every interpolated expression is either one of
   those literals or a helper-function CALL over those literals — the rule's
   `allowedIdentifiers` override only exempts bare-Identifier fragments, so it
   cannot express this call-based composition. No user input, JWT value, or
   resolver argument is ever interpolated: the only runtime value is `$id`,
   bound as a $param. ADR-012's intent (no injection vector via user input) is
   preserved.
   Reviewers: before approving changes to this disable, confirm every new
   interpolation is a `DirectoryLevel` literal, a hardcoded alias, or a call to
   one of the static helpers above — never a resolver arg or JWT field. */

type DirectoryLevel =
  | 'Bacenta'
  | 'Governorship'
  | 'Council'
  | 'Stream'
  | 'Campus'
  | 'Oversight'

const leaderField = (leaderAlias: string, field: string) =>
  `CASE WHEN ${leaderAlias} IS NULL THEN null ELSE ${leaderAlias}.${field} END`

type AncestorSpec = {
  level: DirectoryLevel
  alias: string
  leaderAlias: string
}

const ancestorObject = (spec: AncestorSpec) => `{
    id: ${spec.alias}.id,
    level: '${spec.level}',
    name: ${spec.alias}.name,
    leaderFirstName: ${leaderField(spec.leaderAlias, 'firstName')},
    leaderLastName: ${leaderField(spec.leaderAlias, 'lastName')},
    leaderPhone: ${leaderField(spec.leaderAlias, 'phoneNumber')},
    leaderWhatsApp: ${leaderField(spec.leaderAlias, 'whatsappNumber')}
  }`

const ancestorListExpr = (ancestors: AncestorSpec[]) =>
  ancestors.length === 0
    ? '[]'
    : `[${ancestors.map(ancestorObject).join(', ')}]`

// `latitude` / `longitude` are sourced from the node's `location: Point`.
// Only `Bacenta` (and `Member`) carry locations in the schema today; for any
// alias that doesn't have a `location` property, `${alias}.location` returns
// null in Cypher and the `CASE WHEN ... IS NULL` guards keep the projection
// safe — the entry just gets empty coordinate fields.
const directoryEntryProjection = (
  level: DirectoryLevel,
  alias: string,
  leaderAlias: string,
  ancestors: AncestorSpec[]
) => `
  ${alias} {
    .id,
    level: '${level}',
    .name,
    leaderFirstName: ${leaderField(leaderAlias, 'firstName')},
    leaderLastName: ${leaderField(leaderAlias, 'lastName')},
    leaderPhone: ${leaderField(leaderAlias, 'phoneNumber')},
    leaderWhatsApp: ${leaderField(leaderAlias, 'whatsappNumber')},
    ancestors: ${ancestorListExpr(ancestors)},
    latitude: CASE WHEN ${alias}.location IS NULL THEN null ELSE ${alias}.location.y END,
    longitude: CASE WHEN ${alias}.location IS NULL THEN null ELSE ${alias}.location.x END
  }
`

export const bacentaDirectoryReport = `
  RETURN [] AS entries
`

export const governorshipDirectoryReport = `
  MATCH (governorship:Governorship {id: $id})

  CALL {
    WITH governorship
    OPTIONAL MATCH (governorship)-[:HAS]->(bacenta:Bacenta)
    WHERE bacenta IS NOT NULL
    OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Bacenta',
      'bacenta',
      'bacentaLeader',
      []
    )}) AS bacentaEntries
  }

  RETURN bacentaEntries AS entries
`

export const councilDirectoryReport = `
  MATCH (council:Council {id: $id})

  CALL {
    WITH council
    OPTIONAL MATCH (council)-[:HAS]->(governorship:Governorship)
    WHERE governorship IS NOT NULL
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Governorship',
      'governorship',
      'governorshipLeader',
      []
    )}) AS govEntries
  }
  CALL {
    WITH council
    OPTIONAL MATCH (council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)
    WHERE bacenta IS NOT NULL
    OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    RETURN collect(${directoryEntryProjection('Bacenta', 'bacenta', 'bacentaLeader', [
      { level: 'Governorship', alias: 'governorship', leaderAlias: 'governorshipLeader' },
    ])}) AS bacentaEntries
  }

  RETURN govEntries + bacentaEntries AS entries
`

export const streamDirectoryReport = `
  MATCH (stream:Stream {id: $id})

  CALL {
    WITH stream
    OPTIONAL MATCH (stream)-[:HAS]->(council:Council)
    WHERE council IS NOT NULL
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Council',
      'council',
      'councilLeader',
      []
    )}) AS councilEntries
  }
  CALL {
    WITH stream
    OPTIONAL MATCH (stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)
    WHERE governorship IS NOT NULL
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    RETURN collect(${directoryEntryProjection('Governorship', 'governorship', 'governorshipLeader', [
      { level: 'Council', alias: 'council', leaderAlias: 'councilLeader' },
    ])}) AS govEntries
  }
  CALL {
    WITH stream
    OPTIONAL MATCH (stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)
    WHERE bacenta IS NOT NULL
    OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    RETURN collect(${directoryEntryProjection('Bacenta', 'bacenta', 'bacentaLeader', [
      { level: 'Governorship', alias: 'governorship', leaderAlias: 'governorshipLeader' },
      { level: 'Council', alias: 'council', leaderAlias: 'councilLeader' },
    ])}) AS bacentaEntries
  }

  RETURN councilEntries + govEntries + bacentaEntries AS entries
`

export const campusDirectoryReport = `
  MATCH (campus:Campus {id: $id})

  CALL {
    WITH campus
    OPTIONAL MATCH (campus)-[:HAS]->(stream:Stream)
    WHERE stream IS NOT NULL
    OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Stream',
      'stream',
      'streamLeader',
      []
    )}) AS streamEntries
  }
  CALL {
    WITH campus
    OPTIONAL MATCH (campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)
    WHERE council IS NOT NULL
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
    RETURN collect(${directoryEntryProjection('Council', 'council', 'councilLeader', [
      { level: 'Stream', alias: 'stream', leaderAlias: 'streamLeader' },
    ])}) AS councilEntries
  }
  CALL {
    WITH campus
    OPTIONAL MATCH (campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)
    WHERE governorship IS NOT NULL
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
    RETURN collect(${directoryEntryProjection('Governorship', 'governorship', 'governorshipLeader', [
      { level: 'Council', alias: 'council', leaderAlias: 'councilLeader' },
      { level: 'Stream', alias: 'stream', leaderAlias: 'streamLeader' },
    ])}) AS govEntries
  }
  CALL {
    WITH campus
    OPTIONAL MATCH (campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)
    WHERE bacenta IS NOT NULL
    OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
    RETURN collect(${directoryEntryProjection('Bacenta', 'bacenta', 'bacentaLeader', [
      { level: 'Governorship', alias: 'governorship', leaderAlias: 'governorshipLeader' },
      { level: 'Council', alias: 'council', leaderAlias: 'councilLeader' },
      { level: 'Stream', alias: 'stream', leaderAlias: 'streamLeader' },
    ])}) AS bacentaEntries
  }

  RETURN streamEntries + councilEntries + govEntries + bacentaEntries AS entries
`

export const oversightDirectoryReport = `
  MATCH (oversight:Oversight {id: $id})

  CALL {
    WITH oversight
    OPTIONAL MATCH (oversight)-[:HAS]->(campus:Campus)
    WHERE campus IS NOT NULL
    OPTIONAL MATCH (campus)<-[:LEADS]-(campusLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Campus',
      'campus',
      'campusLeader',
      []
    )}) AS campusEntries
  }
  CALL {
    WITH oversight
    OPTIONAL MATCH (oversight)-[:HAS]->(campus:Campus)-[:HAS]->(stream:Stream)
    WHERE stream IS NOT NULL
    OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
    OPTIONAL MATCH (campus)<-[:LEADS]-(campusLeader:Active:Member)
    RETURN collect(${directoryEntryProjection('Stream', 'stream', 'streamLeader', [
      { level: 'Campus', alias: 'campus', leaderAlias: 'campusLeader' },
    ])}) AS streamEntries
  }
  CALL {
    WITH oversight
    OPTIONAL MATCH (oversight)-[:HAS]->(campus:Campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)
    WHERE council IS NOT NULL
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
    OPTIONAL MATCH (campus)<-[:LEADS]-(campusLeader:Active:Member)
    RETURN collect(${directoryEntryProjection('Council', 'council', 'councilLeader', [
      { level: 'Stream', alias: 'stream', leaderAlias: 'streamLeader' },
      { level: 'Campus', alias: 'campus', leaderAlias: 'campusLeader' },
    ])}) AS councilEntries
  }
  CALL {
    WITH oversight
    OPTIONAL MATCH (oversight)-[:HAS]->(campus:Campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)
    WHERE governorship IS NOT NULL
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
    OPTIONAL MATCH (campus)<-[:LEADS]-(campusLeader:Active:Member)
    RETURN collect(${directoryEntryProjection('Governorship', 'governorship', 'governorshipLeader', [
      { level: 'Council', alias: 'council', leaderAlias: 'councilLeader' },
      { level: 'Stream', alias: 'stream', leaderAlias: 'streamLeader' },
      { level: 'Campus', alias: 'campus', leaderAlias: 'campusLeader' },
    ])}) AS govEntries
  }
  CALL {
    WITH oversight
    OPTIONAL MATCH (oversight)-[:HAS]->(campus:Campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)
    WHERE bacenta IS NOT NULL
    OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
    OPTIONAL MATCH (campus)<-[:LEADS]-(campusLeader:Active:Member)
    RETURN collect(${directoryEntryProjection('Bacenta', 'bacenta', 'bacentaLeader', [
      { level: 'Governorship', alias: 'governorship', leaderAlias: 'governorshipLeader' },
      { level: 'Council', alias: 'council', leaderAlias: 'councilLeader' },
      { level: 'Stream', alias: 'stream', leaderAlias: 'streamLeader' },
      { level: 'Campus', alias: 'campus', leaderAlias: 'campusLeader' },
    ])}) AS bacentaEntries
  }

  RETURN campusEntries + streamEntries + councilEntries + govEntries + bacentaEntries AS entries
`
