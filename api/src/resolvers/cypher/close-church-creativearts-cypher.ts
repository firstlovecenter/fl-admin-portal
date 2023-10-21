export const getLastServiceRecord = `
MATCH (church {id: $churchId}) WHERE church:Hub OR church:Ministry OR church:CreativeArts
MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(otherRecords:RehearsalRecord)-[:SERVICE_HELD_ON]->(otherDate:TimeGraph)
WHERE NOT (otherRecords:NoService) AND duration.between(otherDate.date, date()).weeks < 52

WITH DISTINCT otherRecords AS lastService ORDER BY otherRecords.createdAt DESC LIMIT 1

RETURN lastService
`

export const checkHubHasNoMembers = `
MATCH (hub:Hub {id:$hubId})
MATCH (hub)-[:HAS]->(fellowships:HubFellowship)<-[:LEADS]-(member:Active:Member)
MATCH (fellowships)<-[:LEADS]-(leader:Member)
RETURN hub.name AS name, COUNT(member) AS memberCount, COUNT(fellowships) AS fellowshipCount
`

export const checkHubCouncilHasNoMembers = `
MATCH (hubCouncil:HubCouncil {id:$hubCouncilId})
MATCH (hubCouncil)-[:HAS]->(hubs:Hub)<-[:LEADS]-(member:Active:Member)
RETURN hubCouncil.name AS name, COUNT(member) AS memberCount, COUNT(hubs) AS hubCount
`
export const checkMinistryHasNoMembers = `
MATCH (ministry:Ministry {id:$ministryId})
MATCH (ministry)-[:HAS]->(hubCouncils:HubCouncil)<-[:LEADS]-(member:Active:Member)
RETURN ministry.name AS name, COUNT(member) AS memberCount, COUNT(hubCouncils) AS hubCouncilCount
`

export const checkCreativeArtsHasNoMembers = `
MATCH (creativeArt:CreativeArts {id:$creativeArtsId})
MATCH (creativeArt)-[:HAS]->(ministries:Ministry)<-[:LEADS]-(member:Active:Member)
RETURN creativeArt.name AS name, COUNT(member) AS memberCount, COUNT(ministries) AS ministryCount
`

export const closeDownHub = `
MATCH (hub:Hub {id: $hubId})<-[:HAS]-(hubCouncil:HubCouncil)

CREATE (log:HistoryLog {id: apoc.create.uuid()})
SET log.timeStamp = datetime(),
log.historyRecord = hub.name + ' Hub was closed down under ' + hubCouncil.name +' HubCouncil'

WITH hub, hubCouncil, log
MATCH (hubCouncil)-[:HAS]->(hubs:Hub)   
MATCH (admin:Member {auth_id: $auth.jwt.sub})
OPTIONAL MATCH (hub)-[:HAS]->(hubFellowships)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (hub)-[:HAS_HISTORY]->(log)
MERGE (hubCouncil)-[:HAS_HISTORY]->(log)

SET hub:ClosedHub
REMOVE hub:Hub, hubFellowships:HubFellowship

RETURN hubCouncil {
  .id, .name, 
  hubs:[hubs {.id,.name}]
}
`

export const closeDownHubCouncil = `
MATCH (hubCouncil:HubCouncil {id:$hubCouncilId})<-[:HAS]-(ministry:Ministry)

WITH hubCouncil, ministry
CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = hubCouncil.name + ' HubCouncil was closed down under ' + ministry.name +' Ministry with all its hubs'

WITH hubCouncil, ministry, log
MATCH (ministry)-[:HAS]->(hubCouncils:HubCouncil)   
MATCH (admin:Member {auth_id: $auth.jwt.sub})
OPTIONAL MATCH (hubCouncil)-[:HAS]->(hubs)-[:HAS]->(hubFellowships)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (hubCouncil)-[:HAS_HISTORY]->(log)
MERGE (ministry)-[:HAS_HISTORY]->(log)

SET hubCouncil:ClosedHubCouncil, hubs:ClosedHub
REMOVE hubCouncil:HubCouncil, hubs:Hub, hubFellowships:HubFellowship

RETURN ministry {
  .id, .name, 
  hubCouncils:[hubCouncils {.id, .name}]
}
`

export const closeDownMinistry = `
MATCH (ministry:Ministry {id:$ministryId})<-[:HAS]-(creativeArts:CreativeArts)
WITH ministry, creativeArts

CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = ministry.name + ' Ministry was closed down under ' + creativeArts.name +' CreativeArts'

WITH ministry, creativeArts, log
MATCH (admin:Member {auth_id: $auth.jwt.sub})
MATCH (creativeArts)-[:HAS]->(ministries)
OPTIONAL MATCH (ministry)-[:HAS]->(hubCouncils)-[:HAS]->(hubs)-[:HAS]->(hubFellowships)


MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (creativeArt)-[:HAS_HISTORY]->(log)

SET ministry:ClosedMinistry, hubCouncils:ClosedHubCouncil, hubs:ClosedHub
REMOVE ministry:Ministry, hubCouncils:HubCouncil, hubs:Hub, hubFellowships:HubFellowship

RETURN creativeArts {
  .id, .name,
  ministries: [ministries {.id, .name}]
}
`

export const closeDownCreativeArts = `
MATCH (creativeArt:CreativeArts {id:$creativeArtsId})<-[:HAS_MINISTRY]-(campus:Campus)
WITH creativeArt, campus

CREATE (log:HistoryLog {id:apoc.create.uuid()})
  SET log.timeStamp = datetime(),
  log.historyRecord = creativeArt.name + ' CreativeArts was closed down under ' + campus.name +' campus'

WITH creativeArt, campus, log
MATCH (campus)-[:HAS_MINISTRY]->(creativeArts)
MATCH (admin:Member {auth_id: $auth.jwt.sub})
OPTIONAL MATCH (creativeArt)-[:HAS]->(ministries)-[:HAS]->(hubCouncils)-[:HAS]->(hubs)-[:HAS]->(hubFellowships)

MERGE (date:TimeGraph {date:date()})
MERGE (log)-[:LOGGED_BY]->(admin)
MERGE (log)-[:RECORDED_ON]->(date)
MERGE (campus)-[:HAS_HISTORY]->(log)

SET creativeArt:ClosedCreativeArts, ministries:ClosedMinistry, hubCouncils:ClosedHubCouncil, hubs:ClosedHub
REMOVE creativeArt:CreativeArts, ministries:Ministry, hubCouncils:HubCouncil, hubs:Hub, hubFellowships:HubFellowship


RETURN campus {
  .id, .name,
  creativeArts: [creativeArts {.id, .name}]
}
`
