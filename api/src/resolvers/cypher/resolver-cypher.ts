export const matchMemberFromAuthId = `
 MATCH (member:Member  {auth_id: $auth.jwt.sub})
 RETURN member
`

export const matchMemberAndIMCLStatus = `
MATCH (member:Member {id: $id}) WHERE NOT member:Lost 
RETURN member
`
export const updateMemberFellowship = `
  MATCH (member:Active:Member {id: $id}) 
  MATCH (fellowship:Fellowship {id: $fellowshipId})

  OPTIONAL MATCH (member)-[previous:BELONGS_TO]-> (:Fellowship)
  DELETE previous

  MERGE (member)-[:BELONGS_TO]-> (fellowship)
  RETURN member
  `

export const matchMemberQuery = `

WITH apoc.cypher.runFirstColumn(
  "MATCH (member:Member {id:$id})
  RETURN member", {offset:0, first:5, id: $id}, True) AS x UNWIND x AS member
  RETURN member { .id,.auth_id, .firstName,.lastName,.email,.phoneNumber,.whatsappNumber,.pictureUrl,
  leadsFellowship: [ member_fellowships IN apoc.cypher.runFirstColumn("MATCH (this)-[:LEADS]->(fellowship:Fellowship)
  RETURN fellowship", {this: member}, true) | member_fellowships { .id,.name }],
  leadsBacenta: [ member_bacentas IN apoc.cypher.runFirstColumn("MATCH (this)-[:LEADS]->(bacenta:Bacenta)
  RETURN bacenta", {this: member}, true) | member_bacentas { .id,.name }],
   leadsConstituency: [ member_constituency IN apoc.cypher.runFirstColumn("MATCH (this)-[:LEADS]->(constituency:Constituency)
  RETURN constituency", {this: member}, true) | member_constituency { .id,.name }],
   leadsCouncil: [ member_council IN apoc.cypher.runFirstColumn("MATCH (this)-[:LEADS]->(council:Council)
  RETURN council", {this: member}, true) | member_council { .id,.name }],
  leadsStream: [ member_stream IN apoc.cypher.runFirstColumn("MATCH (this)-[:LEADS]->(stream:Stream)
  RETURN stream", {this: member}, true) | member_stream { .id,.name }],
  leadsCampus: [ member_campus IN apoc.cypher.runFirstColumn("MATCH (this)-[:LEADS]->(campus:Campus)
  RETURN campus", {this: member}, true) | member_campus { .id,.name }],
  isAdminForCampus: [ member_adminCampuses IN apoc.cypher.runFirstColumn("MATCH (this)-[:IS_ADMIN_FOR]->(adminCampus:Campus)
  RETURN adminCampus", {this: member}, true) | member_adminCampuses { .id,.name }],
  isAdminForConstituency: [ member_adminConstituencies IN apoc.cypher.runFirstColumn("MATCH (this)-[:IS_ADMIN_FOR]->(adminConstituency:Constituency)
  RETURN adminConstituency", {this: member}, true) | member_adminConstituencies { .id,.name }],
  isAdminForCouncil: [ member_adminCouncils IN apoc.cypher.runFirstColumn("MATCH (this)-[:IS_ADMIN_FOR]->(adminCouncil:Council)
  RETURN adminCouncil", {this: member}, true) | member_adminCouncils { .id,.name}],
   isAdminForStream: [ member_adminStreams IN apoc.cypher.runFirstColumn("MATCH (this)-[:IS_ADMIN_FOR]->(adminStream:Stream)
  RETURN adminStream", {this: member}, true) | member_adminStreams { .id,.name}],
  isArrivalsAdminForConstituency: [ member_arrivalsAdminConstituency IN apoc.cypher.runFirstColumn("MATCH (this)-[:DOES_ARRIVALS_FOR]->(arrivalsAdminConstituency:Constituency)
  RETURN arrivalsAdminConstituency", {this: member}, true) | member_arrivalsAdminConstituency { .id,.name }],
  isArrivalsAdminForCouncil: [ member_arrivalsAdminCouncils IN apoc.cypher.runFirstColumn("MATCH (this)-[:DOES_ARRIVALS_FOR]->(arrivalsAdminCouncil:Council)
  RETURN arrivalsAdminCouncil", {this: member}, true) | member_arrivalsAdminCouncils { .id,.name}],
  isArrivalsAdminForStream: [ member_arrivalsAdminStreams IN apoc.cypher.runFirstColumn("MATCH (this)-[:DOES_ARRIVALS_FOR]->(arrivalsAdminStream:Stream)
  RETURN arrivalsAdminStream", {this: member}, true) | member_arrivalsAdminStreams { .id,.name}],
  isArrivalsAdminForCampus: [ member_arrivalsAdminCampuses IN apoc.cypher.runFirstColumn("MATCH (this)-[:DOES_ARRIVALS_FOR]->(arrivalsAdminCampus:Campus)
  RETURN arrivalsAdminCampus", {this: member}, true) | member_arrivalsAdminCampuses { .id,.name}],
  isArrivalsCounterForStream: [ member_arrivalsCounterStreams IN apoc.cypher.runFirstColumn("MATCH (this)-[:COUNTS_ARRIVALS_FOR]->(arrivalsCounterStream:Stream)
  RETURN arrivalsCounterStream", {this: member}, true) | member_arrivalsCounterStreams { .id,.name}],
  isArrivalsPayerForCouncil: [ member_arrivalsPayerCouncils IN apoc.cypher.runFirstColumn("MATCH (this)-[:CONFIRMS_ARRIVALS_FOR]->(arrivalsPayerCouncil:Council)
  RETURN arrivalsPayerCouncil", {this: member}, true) | member_arrivalsPayerCouncils { .id,.name}]
  } AS member
  `

export const matchMemberOversightQuery = `
WITH apoc.cypher.runFirstColumn(  
  "MATCH (member:Member {id:$id})
  RETURN member", {offset:0, first:5, id: $id}, True) AS x UNWIND x AS member
  RETURN member { .id,.auth_id, .firstName,.lastName,.email,.phoneNumber,.whatsappNumber,.pictureUrl,
  leadsOversight: [ member_oversight IN apoc.cypher.runFirstColumn("MATCH (this)-[:LEADS]->(oversight:Oversight)
  RETURN oversight", {this:member}, true) | member_oversight {.id, .name}],
  isAdminForOversight: [ member_oversight IN apoc.cypher.runFirstColumn("MATCH (this)-[:IS_ADMIN_FOR]->(oversight:Oversight)
  RETURN oversight", {this:member}, true) | member_oversight {.id, .name}]} AS member
    `

export const matchMemberDenominationQuery = `
WITH apoc.cypher.runFirstColumn(
  "MATCH (member:Member {id:$id})
  RETURN member", {offset:0, first:5, id: $id}, True) AS x UNWIND x AS member
  RETURN member { .id,.auth_id, .firstName,.lastName,.email,.phoneNumber,.whatsappNumber,.pictureUrl,
  leadsDenomination: [ member_denomination IN apoc.cypher.runFirstColumn("MATCH (this)-[:LEADS]->(denomination:Denomination)
  RETURN denomination", {this: member}, true) | member_denomination { .id,.name }],
  isAdminForDenomination: [ member_denomination IN apoc.cypher.runFirstColumn("MATCH (this)-[:IS_ADMIN_FOR]->(denomination:Denomination)
  RETURN denomination", {this: member}, true) | member_denomination { .id,.name }]} AS member
  `

export const matchMemberTellerQuery = `
  WITH apoc.cypher.runFirstColumn(
    "MATCH (member:Member {id:$id})
    RETURN member", {offset:0, first:5, id: $id}, True) AS x UNWIND x AS member
    RETURN member { .id,.auth_id, .firstName,.lastName,.email,.phoneNumber,.whatsappNumber,.pictureUrl,
    isTellerForStream: [ member_tellerStreams IN apoc.cypher.runFirstColumn("MATCH (this)-[:IS_TELLER_FOR]->(tellerStream:Stream)
    RETURN tellerStream", {this: member}, true) | member_tellerStreams { .id,.name }]} AS member 
  `

export const matchMemberSheepSeekerQuery = `
  WITH apoc.cypher.runFirstColumn(
    "MATCH (member:Member {id:$id})
    RETURN member", {offset:0, first:5, id: $id}, True) AS x UNWIND x AS member
    RETURN member { .id,.auth_id, .firstName,.lastName,.email,.phoneNumber,.whatsappNumber,.pictureUrl,
    isSheepSeekerForStream: [ member_SheepSeekerStreams IN apoc.cypher.runFirstColumn("MATCH (this)-[:IS_SHEEP_SEEKER_FOR]->(seekerStream:Stream)
    RETURN seekerStream", {this: member}, true) | member_SheepSeekerStreams { .id,.name }]} AS member 
  `

export const matchChurchQuery = `
  MATCH (church {id:$id}) 
  WHERE church:Fellowship OR church:Bacenta OR church:Constituency OR church:Council OR church:Stream OR church:Campus OR church:Oversight OR church:Denomination
  OR church:ClosedFellowship OR church:ClosedBacenta 
  OR church:CreativeArts OR church:Ministry OR church:HubCouncil OR church:Hub

  WITH church, labels(church) as labels 
  UNWIND labels AS label 
  WITH church, label WHERE label IN ['Fellowship','Bacenta', 'Constituency', 'Council', 
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

export const setMemberAuthId = `
MATCH (member:Member {id:$id})
SET member.auth_id = $auth_id
RETURN member.auth_id`

export const updateMemberEmail = `
MATCH (member:Member {id: $id})
    SET member.email = $email
RETURN member.id AS id, member.auth_id AS auth_id, member.firstName AS firstName, member.lastName AS lastName, member.email AS email, member.pictureUrl AS pictureUrl
`

export const removeMemberAuthId = `
MATCH (member:Member {auth_id:$auth_id})
REMOVE member.auth_id

CREATE (log:HistoryLog)
  SET
   log.id = apoc.create.uuid(),
   log.timeStamp = datetime(),
   log.historyRecord = $log

   WITH member
   MERGE (date:TimeGraph {date: date()})

   WITH member, date
  MATCH (currentUser:Member {auth_id:$auth.jwt.sub})
  CREATE (member)-[:HAS_HISTORY]->(log)
  CREATE (log)-[:LOGGED_BY]->(currentUser)
  CREATE (log)-[:RECORDED_ON]->(date)

RETURN member.id`

export const checkMemberEmailExists = `
OPTIONAL MATCH (member:Member)
WHERE member.email = $email 
OR member.whatsappNumber = $whatsappNumber 
RETURN member IS NOT NULL AS predicate, member AS member
`

export const checkMemberHasNoActiveRelationships = `
MATCH p=(member:Member {id:$id})-[:LEADS|DOES_ARRIVALS_FOR|IS_ADMIN_FOR|COUNTS_ARRIVALS_FOR|IS_TELLER_FOR]->(church)
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
MATCH (admin:Member {auth_id:$auth.jwt.sub})
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
MATCH (admin:Member {auth_id:$auth.jwt.sub})
MERGE (today:TimeGraph {date: date()})
MERGE (admin)<-[:LOGGED_BY]-(log)
MERGE (member)-[:HAS_HISTORY]->(log)
MERGE (church)-[:HAS_HISTORY]->(log)
MERGE (log)-[:RECORDED_ON]->(today)

DETACH DELETE member
`

export const createMember = `
MATCH (fellowship:Fellowship {id: $fellowship})
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
        log.historyRecord = $firstName +' ' +$lastName+' was registered on '+apoc.date.convertFormat(toString(date()), 'date', 'dd MMMM yyyy') + ' with ' + fellowship.name + ' Fellowship'

      WITH member, log
      MERGE (today:TimeGraph {date: date()})
      MERGE (date:TimeGraph {date: date($dob)})

      WITH member, log, today, date
      MATCH (currentUser:Member {auth_id:$auth_id})
      MATCH (maritalStatus:MaritalStatus {status:$maritalStatus})
      MATCH (gender:Gender {gender: $gender})
      MATCH (fellowship:Fellowship {id: $fellowship})

      MERGE (log)-[:RECORDED_ON]->(today)
      MERGE (log)-[:LOGGED_BY]->(currentUser)
      MERGE (member)-[:HAS_HISTORY]->(log)
      MERGE (member)-[:HAS_MARITAL_STATUS]-> (maritalStatus)
      MERGE (member)-[:HAS_GENDER]-> (gender)
      MERGE (member)-[:WAS_BORN_ON]->(date)
      MERGE (member)-[:BELONGS_TO]->(fellowship)


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

           MATCH (fellowship:Fellowship {id: $fellowship})
           MATCH (fellowship)<-[:HAS]-(bacenta:Bacenta)
          MATCH (bacenta:Bacenta)<-[:HAS]-(constituency:Constituency)<-[:HAS]-(council:Council)
           RETURN member  {.id, .firstName,.middleName,.lastName,.email,.phoneNumber,.whatsappNumber,
            fellowship:fellowship {.id,bacenta:bacenta{.id,constituency:constituency{.id}}}}
      `

export const activateInactiveMember = `
MATCH (member:Inactive:Member {id: $id})
MATCH (fellowship:Fellowship {id: $fellowship})
MATCH (member)-[r1:BELONGS_TO]->(oldChurch) WHERE oldChurch:Fellowship OR oldChurch:ClosedFellowship
MATCH (member)-[r2:HAS_MARITAL_STATUS]-> (maritalStatus)
MATCH  (member)-[r3:WAS_BORN_ON]->(date)
DELETE r1, r2, r3

WITH member, fellowship
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
        log.historyRecord = $firstName +' ' +$lastName+' was reregistered on '+apoc.date.convertFormat(toString(date()), 'date', 'dd MMMM yyyy') + ' with ' + fellowship.name + ' Fellowship'

      WITH member, log
      MERGE (today:TimeGraph {date: date()})
      MERGE (date:TimeGraph {date: date($dob)})

      WITH member, log, today, date
      MATCH (currentUser:Member {auth_id:$auth_id})
      MATCH (maritalStatus:MaritalStatus {status:$maritalStatus})
      MATCH (fellowship:Fellowship {id: $fellowship})

      MERGE (log)-[:RECORDED_ON]->(today)
      MERGE (log)-[:LOGGED_BY]->(currentUser)
      MERGE (member)-[:HAS_HISTORY]->(log)
      MERGE (member)-[:HAS_MARITAL_STATUS]-> (maritalStatus)
      MERGE (member)-[:WAS_BORN_ON]->(date)
      MERGE (member)-[:BELONGS_TO]->(fellowship)


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

           MATCH (fellowship:Fellowship {id: $fellowship})
           MATCH (fellowship)<-[:HAS]-(bacenta:Bacenta)
          MATCH (bacenta:Bacenta)<-[:HAS]-(constituency:Constituency)<-[:HAS]-(council:Council)
           RETURN member  {.id, .firstName,.middleName,.lastName,.email,.phoneNumber,.whatsappNumber,
            fellowship:fellowship {.id,bacenta:bacenta{.id,constituency:constituency{.id}}}}
      `

export const checkInactiveMember = `
OPTIONAL MATCH (member:Inactive:Member)
WHERE member.email = $email
OR member.whatsappNumber = $whatsappNumber
RETURN count(member) AS count, member.id AS id
`
