"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recordService = `
CREATE (serviceRecord:ServiceRecord {createdAt:datetime()})
        SET serviceRecord.id = apoc.create.uuid(),
        serviceRecord.attendance = $attendance,
        serviceRecord.familyPicture = $familyPicture
      WITH serviceRecord

      MATCH (church {id: $churchId}) WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream
      MATCH (church)-[current:CURRENT_HISTORY]->(log:ServiceLog)
      MATCH (leader:Member {auth_id: $jwt.sub})
      
      MERGE (serviceDate:TimeGraph {date:date($serviceDate)})

      WITH DISTINCT serviceRecord, leader, serviceDate, log
      MERGE (serviceRecord)-[:LOGGED_BY]->(leader)
      MERGE (serviceRecord)-[:SERVICE_HELD_ON]->(serviceDate)
      MERGE (log)-[:HAS_SERVICE]->(serviceRecord)

      RETURN serviceRecord
`;
exports.default = recordService;
