export const checkFellowshipHasNoMembers = `//cypher
MATCH (fellowship:Fellowship {id: $fellowshipId})
OPTIONAL MATCH (fellowship)<-[:BELONGS_TO]-(member:Active:Member)
RETURN fellowship.name AS name, COUNT(member) AS memberCount
`

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
OPTIONAL MATCH (governorship)-[:HAS_MINISTRY]->(hub:Hub)
RETURN governorship.name AS name,  COUNT(bacentas) AS bacentaCount,  COUNT(hub) AS hubCount
`
export const checkCouncilHasNoMembers = `//cypher
MATCH (council:Council {id:$councilId})
OPTIONAL MATCH (council)-[:HAS]->(governorships:Governorship)<-[:LEADS]-(member:Active:Member)
OPTIONAL MATCH (council)-[:HAS_MINISTRY]->(hubCouncils:HubCouncil)<-[:LEADS]-(leader:Active:Member)
RETURN council.name AS name, COUNT(member) AS memberCount, COUNT(governorships) AS governorshipCount, COUNT(leader) AS hubCouncilLeaderCount, COUNT(hubCouncils) AS hubCouncilCount
`

export const checkStreamHasNoMembers = `//cypher
MATCH (stream:Stream {id:$streamId})
OPTIONAL MATCH (stream)-[:HAS]->(councils:Council)<-[:LEADS]-(member:Active:Member)
OPTIONAL MATCH (stream)-[:HAS_MINISTRY]->(ministries:Ministry)<-[:LEADS]-(leader:Active:Member)
RETURN stream.name AS name, COUNT(member) AS memberCount, COUNT(councils) AS councilCount, COUNT(leader) AS ministryLeaderCount, COUNT(ministries) as ministryCount
`
export const checkCampusHasNoMembers = `//cypher
MATCH (campus:Campus {id:$campusId})
OPTIONAL MATCH (campus)-[:HAS]->(streams:Stream)<-[:LEADS]-(member:Active:Member)
OPTIONAL MATCH (campus)-[:HAS_MINISTRY]->(creativeArts:CreativeArts)<-[:LEADS]-(leader:Active:Member)
RETURN campus.name AS name, COUNT(member) AS memberCount, COUNT(streams) AS streamCount, COUNT(leader) AS leaderCount, COUNT(creativeArts) AS creativeArtsCount
`
export const checkOversightHasNoMembers = `//cypher
MATCH (oversight:Oversight {id:$oversightId})
MATCH (oversight)-[:HAS]->(campuses:Campus)<-[:LEADS]-(member:Active:Member)
RETURN oversight.name AS name, COUNT(member) AS memberCount, COUNT(campuses) AS campusCount
`

export const closeDownFellowship = `//cypher
MATCH (fellowship:Fellowship {id: $fellowshipId})<-[:HAS]-(bacenta:Bacenta)

CREATE (log:HistoryLog {id: apoc.create.uuid()})
SET log.timeStamp = datetime(),
log.historyRecord = fellowship.name + ' Fellowship was closed down under ' + bacenta.name +' Bacenta'

WITH fellowship, bacenta, log
MATCH (admin:Member {id: $jwt.userId})
MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (fellowship)-[:HAS_HISTORY]->(log)
MERGE (bacenta)-[:HAS_HISTORY]->(log)

SET fellowship:ClosedFellowship
REMOVE fellowship:Fellowship, fellowship:Active

WITH bacenta

MATCH (bacenta)-[:HAS]->(fellowships:Fellowship)

RETURN bacenta {
  .id, .name, 
  fellowships:[fellowships {.id,.name}]
    }
`

export const closeDownBacenta = `//cypher
MATCH (bacenta:Bacenta {id:$bacentaId})<-[:HAS]-(governorship:Governorship)

WITH bacenta, governorship
CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = bacenta.name + ' Bacenta was closed down under ' + governorship.name +' Governorship with all its fellowships'

WITH bacenta, governorship, log
MATCH (governorship)-[:HAS]->(bacentas:Bacenta)   
MATCH (admin:Member {id: $jwt.userId})
OPTIONAL MATCH (bacenta)-[:HAS]->(fellowships:Fellowship)
UNWIND labels(governorship) AS stream


MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (bacenta)-[:HAS_HISTORY]->(log)
MERGE (governorship)-[:HAS_HISTORY]->(log)

SET bacenta:ClosedBacenta, fellowships:ClosedFellowship
REMOVE bacenta:Bacenta,  fellowships:Fellowship:Active

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
OPTIONAL MATCH (governorship)-[:HAS]->(bacentas)-[:HAS]->(fellowships)



MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (council)-[:HAS_HISTORY]->(log)

SET governorship:ClosedGovernorship, bacentas:ClosedBacenta, fellowships:ClosedFellowship
REMOVE governorship:Governorship,bacentas:Bacenta,fellowships:Fellowship

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
OPTIONAL MATCH (council)-[:HAS]->(governorships)-[:HAS]->(bacentas)-[:HAS]->(fellowships)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (stream)-[:HAS_HISTORY]->(log)

SET council:ClosedCouncil, governorships:ClosedGovernorship, bacentas:ClosedBacenta, fellowships:ClosedFellowship
REMOVE council:Council, governorships:Governorship,bacentas:Bacenta,fellowships:Fellowship

RETURN stream {
  .id, .name,
  councils: [councils {.id, .name}]
}
`
export const closeDownStream = `//cypher
MATCH (stream:Stream {id:$streamId})<-[:HAS]-(campus:Campus)
MATCH (campus)-[:HAS]->(allStreams:Stream)
WITH stream, campus, collect(allStreams {.id, .name}) AS streamsList

CREATE (log:HistoryLog {id:apoc.create.uuid()})
SET log.timeStamp = datetime(),
log.historyRecord = stream.name + ' Stream was closed down under ' + campus.name +' Campus'

WITH stream, campus, log, streamsList
MATCH (admin:Member {id: $jwt.userId})
OPTIONAL MATCH (stream)-[:HAS]->(councils)-[:HAS]->(governorships)-[:HAS]->(bacentas)-[:HAS]->(fellowships)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (campus)-[:HAS_HISTORY]->(log)

SET stream:ClosedStream, councils:ClosedCouncil, governorships:ClosedGovernorship, bacentas:ClosedBacenta, fellowships:ClosedFellowship
REMOVE stream:Stream, councils:Council, governorships:Governorship, bacentas:Bacenta, fellowships:Fellowship

RETURN campus {
  .id, .name,
  streams: streamsList
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
OPTIONAL MATCH (campus)-[:HAS]->(streams)-[:HAS]->(councils)-[:HAS]->(governorships)-[:HAS]->(bacentas)-[:HAS]->(fellowships)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (oversight)-[:HAS_HISTORY]->(log)

SET  campus:ClosedCampus, streams:ClosedStream, councils:ClosedCouncil, governorships:ClosedGovernorship, bacentas:ClosedBacenta, fellowships:ClosedFellowship
REMOVE campus:Campus, streams:Stream, councils:Council, governorships:Governorship, bacentas:Bacenta, fellowships:Fellowship

RETURN oversight {
  .id, .name,
  campuses: [campuses {.id, .name}]
}
`

export const closeDownOversight = `//cypher
MATCH (oversight:OverSight {id:$oversightId})<-[:HAS]-(denomination:Denomination)
WITH oversight, denomination

CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = oversight.name + ' Oversight was closed down under ' + denomination.name +' Denomination'

WITH oversight, denomination, log
MATCH (admin:Member {id: $jwt.userId})
MATCH (denomination)-[:HAS]->(oversights)
OPTIONAL MATCH (oversight)-[:HAS]->(campuses)-[:HAS]->(streams)-[:HAS]->(councils)-[:HAS]->(governorships)-[:HAS]->(bacentas)-[:HAS]->(fellowships)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (denomination)-[:HAS_HISTORY]->(log)

SET  oversight:ClosedOversight, campuses:ClosedCampus streams:ClosedStream, councils:ClosedCouncil, governorships:ClosedGovernorship, bacentas:ClosedBacenta, fellowships:ClosedFellowship
REMOVE oversight:Oversight, campus:Campus, streams:Stream, councils:Council, governorships:Governorship, bacentas:Bacenta,fellowships:Fellowship

RETURN denomination {
  .id, .name,
  oversights: [oversights {.id, .name}]
}
`
