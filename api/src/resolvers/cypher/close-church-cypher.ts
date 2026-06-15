export const getLastServiceRecord = `//cypher
MATCH (church {id: $churchId}) WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus
MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(otherRecords:ServiceRecord)-[:SERVICE_HELD_ON]->(otherDate:TimeGraph)
WHERE NOT (otherRecords:NoService) AND duration.between(otherDate.date, date()).weeks < 52

WITH DISTINCT otherRecords AS lastService ORDER BY otherRecords.createdAt DESC LIMIT 1

RETURN lastService
`

export const checkBacentaHasNoMembers = `//cypher
MATCH (bacenta:Bacenta {id:$bacentaId})
OPTIONAL MATCH (bacenta)<-[:BELONGS_TO]-(member:Active:Member)
RETURN bacenta.name AS name, COUNT(member) AS memberCount
`

export const checkGovernorshipHasNoMembers = `//cypher
MATCH (governorship:Governorship {id:$governorshipId})
OPTIONAL MATCH (governorship)-[:HAS]->(bacentas:Bacenta)
RETURN governorship.name AS name,  COUNT(bacentas) AS bacentaCount
`
export const checkCouncilHasNoMembers = `//cypher
MATCH (council:Council {id:$councilId})
OPTIONAL MATCH (council)-[:HAS]->(governorships:Governorship)
RETURN council.name AS name, COUNT(governorships) AS governorshipCount
`

export const checkStreamHasNoMembers = `//cypher
MATCH (stream:Stream {id:$streamId})
OPTIONAL MATCH (stream)-[:HAS]->(councils:Council)
// Councils drop their :Council label on close-down, so (councils:Council) already
// excludes closed ones. Ministries keep :Ministry and gain :ClosedMinistry, so they
// need the explicit filter below.
OPTIONAL MATCH (stream)-[:HAS_MINISTRY]->(ministries:Ministry) WHERE NOT ministries:ClosedMinistry
RETURN stream.name AS name, COUNT(DISTINCT councils) AS councilCount, COUNT(DISTINCT ministries) AS ministryCount
`
export const checkCampusHasNoMembers = `//cypher
MATCH (campus:Campus {id:$campusId})
OPTIONAL MATCH (campus)-[:HAS]->(streams:Stream)
RETURN campus.name AS name, COUNT(streams) AS streamCount
`
export const checkOversightHasNoMembers = `//cypher
MATCH (oversight:Oversight {id:$oversightId})
OPTIONAL MATCH (oversight)-[:HAS]->(campuses:Campus)
RETURN oversight.name AS name, COUNT(campuses) AS campusCount
`

export const closeDownBacenta = `//cypher
MATCH (bacenta:Bacenta {id:$bacentaId})<-[:HAS]-(governorship:Governorship)

WITH bacenta, governorship
CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = bacenta.name + ' Bacenta was closed down under ' + governorship.name +' Governorship'

WITH bacenta, governorship, log
MATCH (governorship)-[:HAS]->(bacentas:Bacenta)
MATCH (admin:Member {id: $jwt.userId})
UNWIND labels(governorship) AS stream


MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (bacenta)-[:HAS_HISTORY]->(log)
MERGE (governorship)-[:HAS_HISTORY]->(log)

SET bacenta:ClosedBacenta
REMOVE bacenta:Bacenta

RETURN governorship {
  .id, .name, 
  bacentas:[bacentas {.id, .name}]
    }
`

export const closeDownGovernorship = `//cypher
MATCH (governorship:Governorship {id:$governorshipId})<-[:HAS]-(council:Council)
WITH governorship, council

CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = governorship.name + ' Governorship was closed down under ' + council.name +' Council'

WITH governorship, council, log
MATCH (admin:Member {id: $jwt.userId})
MATCH (council)-[:HAS]->(governorships)
OPTIONAL MATCH (governorship)-[:HAS]->(bacentas)



MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (council)-[:HAS_HISTORY]->(log)

SET governorship:ClosedGovernorship, bacentas:ClosedBacenta
REMOVE governorship:Governorship,bacentas:Bacenta

RETURN council {
  .id, .name,
  governorships: [governorships {.id, .name}]
}
`

export const closeDownCouncil = `//cypher
MATCH (council:Council {id:$councilId})<-[:HAS]-(stream:Stream)
WITH council, stream

CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = council.name + ' Council was closed down under ' + stream.name +' stream'

WITH council, stream, log
MATCH (admin:Member {id: $jwt.userId})
MATCH (stream)-[:HAS]->(councils)
OPTIONAL MATCH (council)-[:HAS]->(governorships)-[:HAS]->(bacentas)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (stream)-[:HAS_HISTORY]->(log)

SET council:ClosedCouncil, governorships:ClosedGovernorship, bacentas:ClosedBacenta
REMOVE council:Council, governorships:Governorship,bacentas:Bacenta

RETURN stream {
  .id, .name,
  councils: [councils {.id, .name}]
}
`
export const closeDownStream = `//cypher
MATCH (stream:Stream {id:$streamId})<-[:HAS]-(campus:Campus)
WITH stream, campus

CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = stream.name + ' Stream was closed down under ' + campus.name +' Campus'

WITH stream, campus, log
MATCH (admin:Member {id: $jwt.userId})
MATCH (campus)-[:HAS]->(streams)
OPTIONAL MATCH (stream)-[:HAS]->(councils)-[:HAS]->(governorships)-[:HAS]->(bacentas)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (campus)-[:HAS_HISTORY]->(log)

SET  stream:ClosedStream, councils:ClosedCouncil, governorships:ClosedGovernorship, bacentas:ClosedBacenta
REMOVE  stream:Stream, councils:Council, governorships:Governorship, bacentas:Bacenta

RETURN campus {
  .id, .name,
  streams: [streams {.id, .name}]
}
`
export const closeDownCampus = `//cypher
MATCH (campus:Campus {id:$campusId})<-[:HAS]-(oversight:Oversight)
WITH campus, oversight

CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = campus.name + ' Campus was closed down under ' + oversight.name +' Oversight'

WITH campus, oversight, log
MATCH (admin:Member {id: $jwt.userId})
MATCH (oversight)-[:HAS]->(campuses)
OPTIONAL MATCH (campus)-[:HAS]->(streams)-[:HAS]->(councils)-[:HAS]->(governorships)-[:HAS]->(bacentas)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (oversight)-[:HAS_HISTORY]->(log)

SET  campus:ClosedCampus, streams:ClosedStream, councils:ClosedCouncil, governorships:ClosedGovernorship, bacentas:ClosedBacenta
REMOVE campus:Campus, streams:Stream, councils:Council, governorships:Governorship, bacentas:Bacenta

RETURN oversight {
  .id, .name,
  campuses: [campuses {.id, .name}]
}
`

export const closeDownOversight = `//cypher
MATCH (oversight:Oversight {id:$oversightId})<-[:HAS]-(denomination:Denomination)
WITH oversight, denomination

CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = oversight.name + ' Oversight was closed down under ' + denomination.name +' Denomination'

WITH oversight, denomination, log
MATCH (admin:Member {id: $jwt.userId})
MATCH (denomination)-[:HAS]->(oversights)
OPTIONAL MATCH (oversight)-[:HAS]->(campuses)-[:HAS]->(streams)-[:HAS]->(councils)-[:HAS]->(governorships)-[:HAS]->(bacentas)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (denomination)-[:HAS_HISTORY]->(log)

SET  oversight:ClosedOversight, campuses:ClosedCampus, streams:ClosedStream, councils:ClosedCouncil, governorships:ClosedGovernorship, bacentas:ClosedBacenta
REMOVE oversight:Oversight, campuses:Campus, streams:Stream, councils:Council, governorships:Governorship, bacentas:Bacenta

RETURN denomination {
  .id, .name,
  oversights: [oversights {.id, .name}]
}
`
