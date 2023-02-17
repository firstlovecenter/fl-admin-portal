const servantCypher = {
  disconnectChurchLeader: `
   MATCH (church {id: $churchId}) 
   WHERE church:Fellowship OR church:Bacenta OR church:Constituency OR church:Council OR church:Stream OR church:GatheringService OR church:Sonta OR church:Ministry
   OR church:ClosedFellowship OR church:ClosedBacenta
   MATCH (church)<-[oldLeads:LEADS]-(leader:Member)
   DELETE oldLeads
   
   WITH church, leader

   OPTIONAL MATCH (bacenta:Bacenta {id: $churchId})
   REMOVE bacenta.momoNumber

   WITH church,leader
   
   OPTIONAL MATCH (church)-[oldHistory:CURRENT_HISTORY]->(:ServiceLog)<-[oldLeaderHistory:CURRENT_HISTORY]-(leader)
   DELETE oldHistory, oldLeaderHistory
   
   RETURN leader.id AS id, leader.auth_id AS auth_id, leader.firstName AS firstName, leader.lastName AS lastName
   `,

  disconnectChurchAdmin: `
   MATCH (church {id: $churchId}) 
   WHERE church:Constituency OR church:Council OR church:Stream OR church:GatheringService OR church:Sonta OR church:Ministry
   OR church:ClosedFellowship OR church:ClosedBacenta
   MATCH (church)<-[oldAdmin:IS_ADMIN_FOR]-(admin:Member)
   DELETE oldAdmin
   
   
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,
  disconnectChurchArrivalsAdmin: `
   MATCH (church {id: $churchId}) 
   WHERE church:Constituency OR church:Council OR church:Stream OR church:GatheringService OR church:Sonta OR church:Ministry
   OR church:ClosedFellowship OR church:ClosedBacenta
   MATCH (church)<-[oldAdmin:DOES_ARRIVALS_FOR]-(admin:Member)
   DELETE oldAdmin
   
   WITH church, admin
   
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,

  disconnectChurchArrivalsCounter: `
   MATCH (church {id: $churchId}) 
   WHERE church:Stream OR church:GatheringService
   MATCH (church)<-[oldAdmin:COUNTS_ARRIVALS_FOR]-(admin:Member {id: $arrivalsCounterId})
   DELETE oldAdmin
   
   WITH church, admin
   
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,

  disconnectChurchArrivalsConfirmer: `
   MATCH (church {id: $churchId}) 
   WHERE church:Stream OR church:GatheringService
   MATCH (church)<-[oldAdmin:CONFIRMS_ARRIVALS_FOR]-(admin:Member {id: $arrivalsConfirmerId})
   DELETE oldAdmin
   
   WITH church, admin
   
   
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,

  disconnectChurchTeller: `
   MATCH (church {id: $churchId})
   WHERE church:Stream OR church:GatheringService
   MATCH (church)<-[oldTeller:IS_TELLER_FOR]-(admin:Member {id: $tellerId})
   DELETE oldTeller 
   
   WITH church, admin
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,

  disconnectChurchSheepSeeker: `
   MATCH (church {id: $churchId})
   WHERE church:Stream OR church:GatheringService
   MATCH (church)<-[oldSeeker:IS_SHEEP_SEEKER_FOR]-(admin:Member {id: $sheepseekerId})
   DELETE oldSeeker 
   
   WITH church, admin
   RETURN admin.id AS id, admin.auth_id AS auth_id, admin.firstName AS firstName, admin.lastName AS lastName
   `,

  // Create Church Leader Connection
  connectChurchLeader: `
   MATCH (church {id: $churchId})<-[:HAS]-(higherChurch)
   WHERE church:Fellowship OR church:Bacenta OR church:Constituency OR church:Council OR church:Stream OR church:GatheringService OR church:Sonta OR church:Ministry
   OR church:ClosedFellowship OR church:ClosedBacenta
   MATCH (leader:Member {id:$leaderId})
      SET leader.auth_id =  $auth_id
   MERGE (leader)-[:LEADS]->(church)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,
  connectChurchAdmin: `
   MATCH (church {id:$churchId})<-[:HAS]-(higherChurch)
   WHERE church:Constituency OR church:Council OR church:Stream OR church:GatheringService OR church:Sonta OR church:Ministry
   MATCH (admin:Member {id:$adminId})
      SET admin.auth_id =  $auth_id
   MERGE (admin)-[:IS_ADMIN_FOR]->(church)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,

  connectChurchArrivalsAdmin: `
   MATCH (church {id:$churchId})<-[:HAS]-(higherChurch)
   WHERE church:Constituency OR church:Council OR church:Stream OR church:GatheringService OR church:Sonta OR church:Ministry
   MATCH (admin:Member {id: $arrivalsAdminId})
      SET admin.auth_id =  $auth_id
   MERGE (admin)-[:DOES_ARRIVALS_FOR]->(church)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,

  connectChurchArrivalsCounter: `
   MATCH (church {id:$churchId})<-[:HAS]-(higherChurch)
   WHERE church:Stream OR church:GatheringService
   MATCH (admin:Member {id: $arrivalsCounterId})
      SET admin.auth_id =  $auth_id
   MERGE (admin)-[:COUNTS_ARRIVALS_FOR]->(church)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,

  connectChurchArrivalsConfirmer: `
   MATCH (church {id:$churchId})<-[:HAS]-(higherChurch)
   WHERE church:Stream OR church:GatheringService
   MATCH (admin:Member {id: $arrivalsConfirmerId})
      SET admin.auth_id =  $auth_id
   MERGE (admin)-[:CONFIRMS_ARRIVALS_FOR]->(church)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,

  connectChurchTeller: `
   MATCH (church {id:$churchId})<-[:HAS]-(higherChurch)
   WHERE church:Stream OR church:GatheringService 
   MATCH (admin:Member {id: $tellerId})
      SET admin.auth_id =  $auth_id
   MERGE (admin)-[:IS_TELLER_FOR]->(church)
   
   RETURN church.id AS id, church.name AS name, higherChurch.id AS higherChurchId, higherChurch.name AS higherChurchName
   `,

  connectChurchSheepSeeker: `
   MATCH (church {id:$churchId})<-[:HAS]-(higherChurch)
   WHERE church:Stream OR church:GatheringService 
   MATCH (seeker:Member {id: $sheepseekerId})
      SET seeker.auth_id =  $auth_id
   MERGE (seeker)-[:IS_SHEEP_SEEKER_FOR]->(church)
   
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
   SET log:ServiceLog

   WITH log, swellDate
   CREATE (target:Target {id: apoc.create.uuid()})
      SET target.target = 8,
      target.date = swellDate.date
   MERGE (log)-[:HAS_TARGET]->(target)
   RETURN log AS log
   `,

  // Connect log to leader, new church, and old leader
  connectServiceLog: `
   MATCH (church {id: $churchId}) 
   WHERE church:Fellowship OR church:Bacenta 
   OR church:Constituency OR church:Council 
   OR church:Stream OR church:GatheringService 
   OR church:Sonta OR church:Ministry
   OR church:ClosedFellowship OR church:ClosedBacenta
   
   MATCH (leader:Member {id: $servantId})
   MATCH (currentUser:Member {auth_id: $auth.jwt.sub}) 
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
   WHERE church:Fellowship OR church:Bacenta 
   OR church:Constituency OR church:Council 
   OR church:Stream OR church:GatheringService 
   OR church:Sonta OR church:Ministry OR church:Member 
   OR church:ClosedFellowship OR church:ClosedBacenta
   
   MATCH (leader:Member {id: $servantId})
   MATCH (currentUser:Member {auth_id: $auth.jwt.sub}) 
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
