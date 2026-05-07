/**
 * Directory report Cypher.
 *
 * Returns a flat list of every sub-church under the given church (and the
 * church itself) with that unit's leader's name + phone numbers. The CSV is
 * grouped by `level` on the frontend, so we produce one row per unit at every
 * level beneath (and including) the current one.
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
  MATCH (bacenta:Bacenta {id: $id})
  OPTIONAL MATCH (bacenta)<-[:LEADS]-(bacentaLeader:Active:Member)
  OPTIONAL MATCH (governorship:Governorship)-[:HAS]->(bacenta)

  WITH ${directoryEntryProjection(
    'Bacenta',
    'bacenta',
    'governorship',
    'bacentaLeader'
  )} AS entry
  RETURN collect(entry) AS entries
`

export const governorshipDirectoryReport = `
  MATCH (governorship:Governorship {id: $id})
  OPTIONAL MATCH (governorship)<-[:LEADS]-(governorshipLeader:Active:Member)
  OPTIONAL MATCH (parentCouncil:Council)-[:HAS]->(governorship)

  WITH governorship, governorshipLeader, parentCouncil,
       ${directoryEntryProjection(
         'Governorship',
         'governorship',
         'parentCouncil',
         'governorshipLeader'
       )} AS govEntry

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

  RETURN [govEntry] + bacentaEntries AS entries
`

export const councilDirectoryReport = `
  MATCH (council:Council {id: $id})
  OPTIONAL MATCH (council)<-[:LEADS]-(councilLeader:Active:Member)
  OPTIONAL MATCH (parentStream:Stream)-[:HAS]->(council)

  WITH council, councilLeader, parentStream,
       ${directoryEntryProjection(
         'Council',
         'council',
         'parentStream',
         'councilLeader'
       )} AS councilEntry

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

  RETURN [councilEntry] + govEntries + bacentaEntries AS entries
`

export const streamDirectoryReport = `
  MATCH (stream:Stream {id: $id})
  OPTIONAL MATCH (stream)<-[:LEADS]-(streamLeader:Active:Member)
  OPTIONAL MATCH (parentCampus:Campus)-[:HAS]->(stream)

  WITH stream, streamLeader, parentCampus,
       ${directoryEntryProjection(
         'Stream',
         'stream',
         'parentCampus',
         'streamLeader'
       )} AS streamEntry

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

  RETURN [streamEntry] + councilEntries + govEntries + bacentaEntries AS entries
`

export const campusDirectoryReport = `
  MATCH (campus:Campus {id: $id})
  OPTIONAL MATCH (campus)<-[:LEADS]-(campusLeader:Active:Member)
  OPTIONAL MATCH (parentOversight:Oversight)-[:HAS]->(campus)

  WITH campus, campusLeader, parentOversight,
       ${directoryEntryProjection(
         'Campus',
         'campus',
         'parentOversight',
         'campusLeader'
       )} AS campusEntry

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

  RETURN [campusEntry] + streamEntries + councilEntries + govEntries + bacentaEntries AS entries
`

export const oversightDirectoryReport = `
  MATCH (oversight:Oversight {id: $id})
  OPTIONAL MATCH (oversight)<-[:LEADS]-(oversightLeader:Active:Member)

  WITH oversight, oversightLeader,
       ${directoryEntryProjection(
         'Oversight',
         'oversight',
         null,
         'oversightLeader'
       )} AS oversightEntry

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

  RETURN [oversightEntry] + campusEntries + streamEntries + councilEntries + govEntries + bacentaEntries AS entries
`
