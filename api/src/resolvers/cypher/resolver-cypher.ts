export const matchMemberFromAuthId = `
 MATCH (member:Member  {id: $jwt.sub})
 RETURN member
`

export const matchMemberAndIMCLStatus = `
MATCH (member:Member {id: $id}) WHERE NOT member:Lost 
RETURN member
`
export const updateMemberBacenta = `
  MATCH (member:Active:Member {id: $id}) 
  MATCH (bacenta:Bacenta {id: $bacentaId})

  OPTIONAL MATCH (member)-[previous:BELONGS_TO]-> (:Bacenta)
  DELETE previous

  MERGE (member)-[:BELONGS_TO]-> (bacenta)
  RETURN member
  `

export const matchMemberQuery = `

MATCH (member:Member {id: $id})
RETURN member {
  
  leadsBacenta: [bacenta IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(bacenta:Bacenta) RETURN bacenta", {this: member}) | bacenta {.id, .name}],
  leadsGovernorship: [governorship IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(governorship:Governorship) RETURN governorship", {this: member}) | governorship {.id, .name}],
  leadsCouncil: [council IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(council:Council) RETURN council", {this: member}) | council {.id, .name}],
  leadsStream: [stream IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(stream:Stream) RETURN stream", {this: member}) | stream {.id, .name}],
  leadsCampus: [campus IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(campus:Campus) RETURN campus", {this: member}) | campus {.id, .name}],
  
  isAdminForCampus: [adminCampus IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:IS_ADMIN_FOR]->(adminCampus:Campus) RETURN adminCampus", {this: member}) | adminCampus {.id, .name}],
  isAdminForGovernorship: [adminGovernorship IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:IS_ADMIN_FOR]->(adminGovernorship:Governorship) RETURN adminGovernorship", {this: member}) | adminGovernorship {.id, .name}],
  isAdminForCouncil: [adminCouncil IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:IS_ADMIN_FOR]->(adminCouncil:Council) RETURN adminCouncil", {this: member}) | adminCouncil {.id, .name}],
  isAdminForStream: [adminStream IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:IS_ADMIN_FOR]->(adminStream:Stream) RETURN adminStream", {this: member}) | adminStream {.id, .name}],
  
  isArrivalsAdminForGovernorship: [arrivalsAdminGovernorship IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:DOES_ARRIVALS_FOR]->(arrivalsAdminGovernorship:Governorship) RETURN arrivalsAdminGovernorship", {this: member}) | arrivalsAdminGovernorship {.id, .name}],
  isArrivalsAdminForCouncil: [arrivalsAdminCouncil IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:DOES_ARRIVALS_FOR]->(arrivalsAdminCouncil:Council) RETURN arrivalsAdminCouncil", {this: member}) | arrivalsAdminCouncil {.id, .name}],
  isArrivalsAdminForStream: [arrivalsAdminStream IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:DOES_ARRIVALS_FOR]->(arrivalsAdminStream:Stream) RETURN arrivalsAdminStream", {this: member}) | arrivalsAdminStream {.id, .name}],
  isArrivalsAdminForCampus: [arrivalsAdminCampus IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:DOES_ARRIVALS_FOR]->(arrivalsAdminCampus:Campus) RETURN arrivalsAdminCampus", {this: member}) | arrivalsAdminCampus {.id, .name}],
  
  isArrivalsCounterForStream: [arrivalsCounterStream IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:COUNTS_ARRIVALS_FOR]->(arrivalsCounterStream:Stream) RETURN arrivalsCounterStream", {this: member}) | arrivalsCounterStream {.id, .name}],
  isArrivalsPayerForCouncil: [arrivalsPayerCouncil IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:CONFIRMS_ARRIVALS_FOR]->(arrivalsPayerCouncil:Council) RETURN arrivalsPayerCouncil", {this: member}) | arrivalsPayerCouncil {.id, .name}]
} AS member
  `

export const updateMemberAuthId = `
MATCH (member:Member {id:$id})
RETURN member
`

export const matchMemberOversightQuery = `
MATCH (member:Member {id:$id})
RETURN member { 
  leadsOversight: [oversight IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(oversight:Oversight) RETURN oversight", {this: member}) | oversight {.id, .name}],
  isAdminForOversight: [oversight IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:IS_ADMIN_FOR]->(oversight:Oversight) RETURN oversight", {this: member}) | oversight {.id, .name}]
} AS member
`

export const matchMemberDenominationQuery = `
MATCH (member:Member {id:$id})
RETURN member { 
  leadsDenomination: [denomination IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:LEADS]->(denomination:Denomination) RETURN denomination", {this: member}) | denomination {.id, .name}],
  isAdminForDenomination: [denomination IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:IS_ADMIN_FOR]->(denomination:Denomination) RETURN denomination", {this: member}) | denomination {.id, .name}]
} AS member
`

export const matchMemberTellerQuery = `
MATCH (member:Member {id:$id})
RETURN member { 
  isTellerForStream: [tellerStream IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:IS_TELLER_FOR]->(tellerStream:Stream) RETURN tellerStream", {this: member}) | tellerStream {.id, .name}]
} AS member 
`

export const matchMemberSheepSeekerQuery = `
  WITH apoc.cypher.runFirstColumnMany(
    "MATCH (member:Member {id:$id})
    RETURN member", {offset:0, first:5, id: $id}, True) AS x UNWIND x AS member
    RETURN member { .id,.auth_id, .firstName,.lastName,.email,.phoneNumber,.whatsappNumber,.pictureUrl,
    isSheepSeekerForStream: [ member_SheepSeekerStreams IN apoc.cypher.runFirstColumnMany("MATCH (this)-[:IS_SHEEP_SEEKER_FOR]->(seekerStream:Stream)
    RETURN seekerStream", {this: member}, true) | member_SheepSeekerStreams { .id,.name }]} AS member 
  `

export const matchChurchQuery = `
  MATCH (church {id:$id}) 
  WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus OR church:Oversight OR church:Denomination
  OR church:ClosedBacenta 
  OR church:CreativeArts OR church:Ministry OR church:HubCouncil OR church:Hub

  WITH church, labels(church) as labels 
  UNWIND labels AS label 
  WITH church, label WHERE label IN ['Fellowship','Bacenta', 'Governorship', 'Council', 
  'Stream', 'Campus', 'Oversight', 'Denomination', 'ClosedFellowship', 'ClosedBacenta', 'CreativeArts', 'Ministry', 'HubCouncil', 'Hub']

  RETURN church.id AS id, church.name AS name, church.firstName AS firstName, church.lastName AS lastName, label AS type
  `

export const getChurchDataQuery = `
  MATCH (church {id:$id}) 
  WHERE church:Fellowship OR church:Bacenta OR church:Constituency OR church:Council OR church:Stream 
  OR church:Campus OR church:Oversight OR church:Denomination
  OR church:CreativeArts OR church:Ministry OR church:HubCouncil OR church:Hub

  MATCH (church)-[:HAS_HISTORY]->(:SERVICE_LOG)-[:HAS_SERVICE]->(records:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
  WHERE date.date >= date() - duration('P8W')
  
  OPTIONAL MATCH (church)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph)
  WHERE date.date >= date() - duration('P8W')
  
  WITH records, bussing
  RETURN COLLECT(records.income) as income, COLLECT(records.attendance) as attendance,
  ROUND(AVG(records.income)) AS averageIncome, ROUND(AVG(records.attendance)) AS averageAttendance,
  COLLECT(bussing.attendance) as bussingAttendance, ROUND(AVG(bussing.attendance)) as averageBussingAttendance
`

export const updateMemberEmail = `
MATCH (member:Member {id: $id})
    SET member.email = $email
`

export const createHistoryLog = `
CREATE (log:HistoryLog)
  SET
   log.id = apoc.create.uuid(),
   log.timeStamp = datetime(),
   log.historyRecord = $log

   WITH member
   MERGE (date:TimeGraph {date: date()})

   WITH member, date
  MATCH (currentUser:Member {id:$jwt.sub})
  CREATE (member)-[:HAS_HISTORY]->(log)
  CREATE (log)-[:LOGGED_BY]->(currentUser)
  CREATE (log)-[:RECORDED_ON]->(date)

RETURN member.id
`

export const checkMemberEmailExists = `
OPTIONAL MATCH (member:Member)
WHERE member.email = $email 
OR member.whatsappNumber = $whatsappNumber 
RETURN member IS NOT NULL AS predicate, member AS member
`

export const checkMemberHasNoActiveRelationships = `
MATCH p=(member:Member {id:$id})-[:LEADS|DOES_ARRIVALS_FOR|IS_ADMIN_FOR|COUNTS_ARRIVALS_FOR|IS_TELLER_FOR]->(church)
WHERE NOT church:ClosedFellowship AND NOT church:ClosedBacenta AND NOT church:ClosedGovernorship AND NOT church:ClosedCouncil AND NOT church:ClosedStream AND NOT church:ClosedCampus AND NOT church:ClosedOversight AND NOT church:ClosedDenomination 
AND NOT church:ClosedCreativeArts AND NOT church:ClosedMinistry AND NOT church:ClosedHubCouncil AND NOT church:ClosedHub
RETURN COUNT(p) as relationshipCount
`

export const makeMemberInactive = `
MATCH (member:Member {id:$id})
WITH member, ['Active'] as labels
CALL apoc.create.removeLabels(member, labels)
YIELD node
WITH node
SET node:Inactive

WITH node
CREATE (log:HistoryLog)
SET log.id = apoc.create.uuid(),
log.timeStamp = datetime(),
log.historyRecord = $reason

WITH log, node
MATCH (node)-[:BELONGS_TO]->(church)
MATCH (admin:Member {id:$jwt.sub})
MERGE (today:TimeGraph {date: date()})
MERGE (admin)<-[:LOGGED_BY]-(log)
MERGE (node)-[:HAS_HISTORY]->(log)
MERGE (church)-[:HAS_HISTORY]->(log)
MERGE (log)-[:RECORDED_ON]->(today)

RETURN node as member
`

export const removeDuplicateMember = `
MATCH (member:Member {id:$id})
SET member:Inactive, member:DuplicateMember
REMOVE member:Active, member:Member

WITH member 
CREATE (log:HistoryLog)
SET log.id = apoc.create.uuid(),
log.timeStamp = datetime(),
log.historyRecord = $reason

WITH log, member 
MATCH (member)-[:BELONGS_TO]->(church)
MATCH (admin:Member {id:$jwt.sub})
MERGE (today:TimeGraph {date: date()})
MERGE (admin)<-[:LOGGED_BY]-(log)
MERGE (member)-[:HAS_HISTORY]->(log)
MERGE (church)-[:HAS_HISTORY]->(log)
MERGE (log)-[:RECORDED_ON]->(today)

DETACH DELETE member
`

export const createMember = `
MATCH (bacenta:Bacenta {id: $bacenta})
CREATE (member:Active:Member:IDL:Deer {whatsappNumber:$whatsappNumber})
      SET
      	member.id = apoc.create.uuid(),
      	member.firstName = $firstName,
      	member.middleName = $middleName,
      	member.lastName = $lastName,
      	member.email = $email,
      	member.phoneNumber = $phoneNumber,
        member.visitationArea = $visitationArea,
      	member.pictureUrl = $pictureUrl,
        member.registrationDate = datetime(),
        
        member.hasHolyGhostBaptism = false,
        member.hasWaterBaptism = false,
        member.graduatedUnderstandingSchools = [],
        member.hasAudioCollections = false,
        member.hasCampAttendance = false,
        member.hasBibleTranslations = false

      CREATE (log:HistoryLog:RegistrationLog)
        SET
        log.id =  apoc.create.uuid(),
        log.timeStamp = datetime(),
        log.historyRecord = $firstName +' ' +$lastName+' was registered on '+apoc.date.convertFormat(toString(date()), 'date', 'dd MMMM yyyy') + ' with ' + bacenta.name + ' Bacenta'

      WITH member, log
      MERGE (today:TimeGraph {date: date()})
      MERGE (date:TimeGraph {date: date($dob)})

      WITH member, log, today, date
      MATCH (currentUser:Member {auth_id:$auth_id})
      MATCH (maritalStatus:MaritalStatus {status:$maritalStatus})
      MATCH (gender:Gender {gender: $gender})
      MATCH (bacenta:Bacenta {id: $bacenta})

      MERGE (log)-[:RECORDED_ON]->(today)
      MERGE (log)-[:LOGGED_BY]->(currentUser)
      MERGE (member)-[:HAS_HISTORY]->(log)
      MERGE (member)-[:HAS_MARITAL_STATUS]-> (maritalStatus)
      MERGE (member)-[:HAS_GENDER]-> (gender)
      MERGE (member)-[:WAS_BORN_ON]->(date)
      MERGE (member)-[:BELONGS_TO]->(bacenta)


      WITH member
         CALL {
         	WITH member
         	WITH member  WHERE $occupation IS NOT NULL
         	MERGE (occupation:Occupation {occupation:$occupation})
      	MERGE (member)-[:HAS_OCCUPATION]-> (occupation)
         	RETURN count(member) AS member_occupation
         	}

      WITH member
      CALL {
         	WITH member
         	WITH member  WHERE $basonta IS NOT NULL
         	MATCH (basonta:Basonta {id:$basonta})
      	MERGE (member)-[:BELONGS_TO]-> (basonta)
         	RETURN count(member) AS member_basonta
         	}

           MATCH (bacenta:Bacenta {id: $bacenta})
          MATCH (bacenta:Bacenta)<-[:HAS]-(governorship:Governorship)<-[:HAS]-(council:Council)
           RETURN member  {.id, .firstName,.middleName,.lastName,.email,.phoneNumber,.whatsappNumber,
            bacenta:bacenta{.id,governorship:governorship{.id}}}
      `

export const activateInactiveMember = `
MATCH (member:Inactive:Member {id: $id})
MATCH (bacenta:Bacenta {id: $bacenta})
MATCH (member)-[r1:BELONGS_TO]->(oldChurch) WHERE oldChurch:Bacenta OR oldChurch:ClosedBacenta
MATCH (member)-[r2:HAS_MARITAL_STATUS]-> (maritalStatus)
MATCH  (member)-[r3:WAS_BORN_ON]->(date)
DELETE r1, r2, r3

WITH member, bacenta
  SET
        member:IDL, member:Active,
        member.firstName = $firstName,
        member.middleName = $middleName,
        member.lastName = $lastName,
        member.phoneNumber = $phoneNumber,
        member.visitationArea = $visitationArea,
        member.pictureUrl = $pictureUrl

        REMOVE 
        member:Inactive

      CREATE (log:HistoryLog:RegistrationLog)
        SET
        log.id =  apoc.create.uuid(),
        log.timeStamp = datetime(),
        log.historyRecord = $firstName +' ' +$lastName+' was reregistered on '+apoc.date.convertFormat(toString(date()), 'date', 'dd MMMM yyyy') + ' with ' + bacenta.name + ' Bacenta'

      WITH member, log
      MERGE (today:TimeGraph {date: date()})
      MERGE (date:TimeGraph {date: date($dob)})

      WITH member, log, today, date
      MATCH (currentUser:Member {auth_id:$auth_id})
      MATCH (maritalStatus:MaritalStatus {status:$maritalStatus})
      MATCH (bacenta:Bacenta {id: $bacenta})

      MERGE (log)-[:RECORDED_ON]->(today)
      MERGE (log)-[:LOGGED_BY]->(currentUser)
      MERGE (member)-[:HAS_HISTORY]->(log)
      MERGE (member)-[:HAS_MARITAL_STATUS]-> (maritalStatus)
      MERGE (member)-[:WAS_BORN_ON]->(date)
      MERGE (member)-[:BELONGS_TO]->(bacenta)


      WITH member
         CALL {
          WITH member
          WITH member  WHERE $occupation IS NOT NULL
          MERGE (occupation:Occupation {occupation:$occupation})
        MERGE (member)-[:HAS_OCCUPATION]-> (occupation)
          RETURN count(member) AS member_occupation
          }

      WITH member
      CALL {
          WITH member
          WITH member  WHERE $basonta IS NOT NULL
          MATCH (basonta:CreativeArts {id:$basonta})
          MERGE (member)-[:BELONGS_TO]-> (basonta)
          RETURN count(member) AS member_basonta
          }

           MATCH (bacenta:Bacenta {id: $bacenta})
          MATCH (bacenta:Bacenta)<-[:HAS]-(governorship:Governorship)<-[:HAS]-(council:Council)
           RETURN member  {.id, .firstName,.middleName,.lastName,.email,.phoneNumber,.whatsappNumber,
            bacenta:bacenta {.id,governorship:governorship{.id}}}
      `

export const checkInactiveMember = `
OPTIONAL MATCH (member:Inactive:Member)
WHERE member.email = $email
OR member.whatsappNumber = $whatsappNumber
RETURN count(member) AS count, member.id AS id
`
