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
 */

const directoryEntryProjection = (
  level:
    | 'Bacenta'
    | 'Governorship'
    | 'Council'
    | 'Stream'
    | 'Campus'
    | 'Oversight',
  alias: string,
  parentAlias: string | null,
  leaderAlias: string
) => `
  ${alias} {
    .id,
    level: '${level}',
    .name,
    parentName: ${parentAlias ? `${parentAlias}.name` : 'null'},
    leaderName: CASE WHEN ${leaderAlias} IS NULL THEN null ELSE ${leaderAlias}.firstName + ' ' + ${leaderAlias}.lastName END,
    leaderPhone: CASE WHEN ${leaderAlias} IS NULL THEN null ELSE ${leaderAlias}.phoneNumber END,
    leaderWhatsApp: CASE WHEN ${leaderAlias} IS NULL THEN null ELSE ${leaderAlias}.whatsappNumber END
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
      'governorship',
      'bacentaLeader'
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
      'council',
      'governorshipLeader'
    )}) AS govEntries
  }
  CALL {
    WITH council
    OPTIONAL MATCH (council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)
    WHERE bacenta IS NOT NULL
    OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Bacenta',
      'bacenta',
      'governorship',
      'bacentaLeader'
    )}) AS bacentaEntries
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
      'stream',
      'councilLeader'
    )}) AS councilEntries
  }
  CALL {
    WITH stream
    OPTIONAL MATCH (stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)
    WHERE governorship IS NOT NULL
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Governorship',
      'governorship',
      'council',
      'governorshipLeader'
    )}) AS govEntries
  }
  CALL {
    WITH stream
    OPTIONAL MATCH (stream)-[:HAS]->(:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)
    WHERE bacenta IS NOT NULL
    OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Bacenta',
      'bacenta',
      'governorship',
      'bacentaLeader'
    )}) AS bacentaEntries
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
      'campus',
      'streamLeader'
    )}) AS streamEntries
  }
  CALL {
    WITH campus
    OPTIONAL MATCH (campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)
    WHERE council IS NOT NULL
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Council',
      'council',
      'stream',
      'councilLeader'
    )}) AS councilEntries
  }
  CALL {
    WITH campus
    OPTIONAL MATCH (campus)-[:HAS]->(:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)
    WHERE governorship IS NOT NULL
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Governorship',
      'governorship',
      'council',
      'governorshipLeader'
    )}) AS govEntries
  }
  CALL {
    WITH campus
    OPTIONAL MATCH (campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)
    WHERE bacenta IS NOT NULL
    OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Bacenta',
      'bacenta',
      'governorship',
      'bacentaLeader'
    )}) AS bacentaEntries
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
      'oversight',
      'campusLeader'
    )}) AS campusEntries
  }
  CALL {
    WITH oversight
    OPTIONAL MATCH (oversight)-[:HAS]->(campus:Campus)-[:HAS]->(stream:Stream)
    WHERE stream IS NOT NULL
    OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Stream',
      'stream',
      'campus',
      'streamLeader'
    )}) AS streamEntries
  }
  CALL {
    WITH oversight
    OPTIONAL MATCH (oversight)-[:HAS]->(:Campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)
    WHERE council IS NOT NULL
    OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Council',
      'council',
      'stream',
      'councilLeader'
    )}) AS councilEntries
  }
  CALL {
    WITH oversight
    OPTIONAL MATCH (oversight)-[:HAS]->(:Campus)-[:HAS]->(:Stream)-[:HAS]->(council:Council)-[:HAS]->(governorship:Governorship)
    WHERE governorship IS NOT NULL
    OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Governorship',
      'governorship',
      'council',
      'governorshipLeader'
    )}) AS govEntries
  }
  CALL {
    WITH oversight
    OPTIONAL MATCH (oversight)-[:HAS]->(:Campus)-[:HAS]->(:Stream)-[:HAS]->(:Council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)
    WHERE bacenta IS NOT NULL
    OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
    RETURN collect(${directoryEntryProjection(
      'Bacenta',
      'bacenta',
      'governorship',
      'bacentaLeader'
    )}) AS bacentaEntries
  }

  RETURN campusEntries + streamEntries + councilEntries + govEntries + bacentaEntries AS entries
`
