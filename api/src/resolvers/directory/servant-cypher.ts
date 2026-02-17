const servantCypher = {
  disconnectChurchLeader: `
   MATCH (church {id: $churchId}) 
   WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream 
   OR church:Campus OR church:Oversight OR church:Denomination
   OR church:CreativeArts OR church:Ministry OR church:HubCouncil OR church:Hub
   MATCH (church)<-[oldLeads:LEADS]-(leader:Member)
   DELETE oldLeads
   
   WITH church, leader

   OPTIONAL MATCH (bacenta:Bacenta {id: $churchId})
   REMOVE bacenta.momoNumber, bacenta.momoName, bacenta.mobileNetwork, bacenta.recipientCode

   WITH church,leader
   
   OPTIONAL MATCH (church)-[oldHistory:CURRENT_HISTORY]->(:ServiceLog)<-[oldLeaderHistory:CURRENT_HISTORY]-(leader)
   DELETE oldHistory, oldLeaderHistory
   
   RETURN leader.id AS id, leader.auth_id AS auth_id, leader.firstName AS firstName, leader.lastName AS lastName
   `,

  disconnectChurchAdmin: `
   MATCH (church {id: $churchId}) 
   WHERE church:Governorship OR church:Council OR church:Stream 
   OR church:Campus OR church:Oversight OR church:Denomination 
   OR church:CreativeArts OR church:Ministry
   MATCH (church)<-[oldAdmin:IS_ADMIN_FOR]-(admin:Member)
   DELETE oldAdmin
   
   
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,
  disconnectChurchArrivalsAdmin: `
   MATCH (church {id: $churchId}) 
   WHERE church:Governorship OR church:Council OR church:Stream 
   OR church:Campus OR church:Oversight 
   OR church:CreativeArts OR church:Ministry
   MATCH (church)<-[oldAdmin:DOES_ARRIVALS_FOR]-(admin:Member)
   DELETE oldAdmin
   
   WITH church, admin
   
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,

  disconnectChurchArrivalsCounter: `
   MATCH (church {id: $churchId}) 
   WHERE church:Stream
   MATCH (church)<-[oldAdmin:COUNTS_ARRIVALS_FOR]-(admin:Member {id: $arrivalsCounterId})
   DELETE oldAdmin
   
   WITH church, admin
   
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,

  disconnectChurchArrivalsPayer: `
   MATCH (church {id: $churchId}) 
   WHERE church:Council
   MATCH (church)<-[oldAdmin:IS_ARRIVALS_PAYER_FOR]-(admin:Member {id: $arrivalsPayerId})
   DELETE oldAdmin
   
   WITH church, admin
   
   
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,

  disconnectChurchTeller: `
   MATCH (church {id: $churchId})
   WHERE church:Stream
   MATCH (church)<-[oldTeller:IS_TELLER_FOR]-(admin:Member {id: $tellerId})
   DELETE oldTeller 
   
   WITH church, admin
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,

  // Create Church Leader Connection
  connectChurchLeader: `
   MATCH (church {id: $churchId})
   WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream 
   OR church:Campus OR church:Oversight OR church:Denomination
   OR church:CreativeArts OR church:Ministry OR church:HubCouncil OR church:Hub
   MATCH (leader:Member {id:$leaderId})
      SET leader.auth_id =  $auth_id
   MERGE (leader)-[:LEADS]->(church)
   
   WITH church, leader
   OPTIONAL MATCH (church)<-[:HAS]-(higherChurch)

   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,
  connectChurchAdmin: `
   MATCH (church {id:$churchId})
   WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream 
   OR church:Campus OR church:Oversight OR church:Denomination
   OR church:CreativeArts OR church:Ministry
   MATCH (admin:Member {id:$adminId})
   SET admin.auth_id =  $auth_id
   MERGE (admin)-[:IS_ADMIN_FOR]->(church)

   WITH church, admin
   OPTIONAL MATCH (church)<-[:HAS]-(higherChurch)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,

  connectChurchArrivalsAdmin: `
   MATCH (church {id:$churchId})<-[:HAS]-(higherChurch)
   WHERE church:Governorship OR church:Council OR church:Stream OR church:Campus
   MATCH (admin:Member {id: $arrivalsAdminId})
      SET admin.auth_id =  $auth_id
   MERGE (admin)-[:DOES_ARRIVALS_FOR]->(church)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,

  connectChurchArrivalsCounter: `
   MATCH (church {id:$churchId})<-[:HAS]-(higherChurch)
   WHERE church:Stream
   MATCH (admin:Member {id: $arrivalsCounterId})
      SET admin.auth_id =  $auth_id
   MERGE (admin)-[:COUNTS_ARRIVALS_FOR]->(church)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,

  connectChurchArrivalsPayer: `
   MATCH (church {id:$churchId})<-[:HAS]-(higherChurch)
   WHERE church:Council
   MATCH (admin:Member {id: $arrivalsPayerId})
      SET admin.auth_id =  $auth_id
   MERGE (admin)-[:IS_ARRIVALS_PAYER_FOR]->(church)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,

  connectChurchTeller: `
   MATCH (church {id:$churchId})<-[:HAS]-(higherChurch)
   WHERE church:Stream
   MATCH (admin:Member {id: $tellerId})
      SET admin.auth_id =  $auth_id
   MERGE (admin)-[:IS_TELLER_FOR]->(church)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,
  // Create the service log and returns its ID

  createHistoryLog: `
   CREATE (log:HistoryLog)
     SET log.id = apoc.create.uuid(),
      log.timeStamp = datetime(),
      log.historyRecord = $historyRecord
   
      RETURN log.id AS id
   `,

  makeHistoryServiceLog: `
   MATCH (swellDate:SwellDate)
      WITH swellDate ORDER BY swellDate.date DESC LIMIT 1
   MATCH (log:HistoryLog {id: $logId})
   SET log.priority= $priority
   SET log:ServiceLog

   WITH log, swellDate
   CREATE (target:Target {id: apoc.create.uuid()})
      SET target.target = 8,
      target.date = swellDate.date
   MERGE (log)-[:HAS_TARGET]->(target)
   RETURN log AS log
   `,

  // Connect log  leader, new church, and old leader
  connectServiceLog: `
   MATCH (church {id: $churchId}) 
   WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream 
   OR church:Campus OR church:Oversight 
   OR church:CreativeArts OR church:Ministry OR church:HubCouncil OR church:Hub
   OR church:ClosedFellowship OR church:ClosedBacenta
   MATCH (leader:Member {id: $servantId})
   MATCH (currentUser:Member {id: $jwt.userId}) 
   MATCH (log:ServiceLog {id: $logId})
   
   MERGE (date:TimeGraph {date: date()})
   MERGE (log)-[:LOGGED_BY]->(currentUser)
   MERGE (log)-[:RECORDED_ON]->(date)
   MERGE (leader)-[:HAS_HISTORY]->(log)
   MERGE (church)-[:HAS_HISTORY]->(log)
   MERGE (leader)-[:CURRENT_HISTORY]->(log)
   MERGE (church)-[:CURRENT_HISTORY]->(log)
   
   WITH church, log
      MATCH (oldLeader:Member {id: $oldServantId})
      MERGE (oldLeader)-[:OLD_HISTORY]->(log)
   
   WITH church
   MATCH (swellDate:SwellDate)
   OPTIONAL MATCH (isBacenta:Bacenta {id: $churchId})-[:CURRENT_HISTORY]->(log:ServiceLog)
   WITH church, log, isBacenta, swellDate ORDER BY swellDate.date DESC LIMIT 1
   MATCH (target:Target {code: isBacenta.code + '-' + toString(swellDate.date)})
   MERGE (log)-[:HAS_TARGET]->(target)
     SET target.target = 0,
     target.id = apoc.create.uuid(),
     target.date = swellDate.date

   RETURN church.id AS id
   `,

  // Connect log to leader, new church, and old leader
  // First Connection
  connectHistoryLog: `
   MATCH (church {id:$churchId}) 
   WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream 
   OR church:Campus OR church:Oversight 
   OR church:CreativeArts OR church:Ministry OR church:HubCouncil OR church:Hub
   OR church:ClosedFellowship OR church:ClosedBacenta
   MATCH (leader:Member {id: $servantId})
   MATCH (currentUser:Member {id: $jwt.userId}) 
   MATCH (log:HistoryLog {id: $logId})
   
   MERGE (date:TimeGraph {date: date()})
   CREATE (log)-[:LOGGED_BY]->(currentUser)
   CREATE (log)-[:RECORDED_ON]->(date)
   CREATE (leader)-[:HAS_HISTORY]->(log)
   CREATE (church)-[:HAS_HISTORY]->(log)
   
   RETURN church.id AS id
   `,
}

export default servantCypher
