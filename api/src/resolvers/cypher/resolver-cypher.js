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
  leadsGatheringService: [ member_gatheringService IN apoc.cypher.runFirstColumn("MATCH (this)-[:LEADS]->(gatheringService:GatheringService)
  RETURN gatheringService", {this: member}, true) | member_gatheringService { .id,.name }],
  leadsSonta: [ member_sontas IN apoc.cypher.runFirstColumn("MATCH (this)-[:LEADS]->(sonta:Sonta)
  RETURN sonta", {this: member}, true) | member_sontas { .id,.name }],
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
  isArrivalsAdminForGatheringService: [ member_arrivalsAdminGatheringServices IN apoc.cypher.runFirstColumn("MATCH (this)-[:DOES_ARRIVALS_FOR]->(arrivalsAdminGatheringService:GatheringService)
  RETURN arrivalsAdminGatheringService", {this: member}, true) | member_arrivalsAdminGatheringServices { .id,.name}],
  isArrivalsCounterForStream: [ member_arrivalsCounterStreams IN apoc.cypher.runFirstColumn("MATCH (this)-[:COUNTS_ARRIVALS_FOR]->(arrivalsCounterStream:Stream)
  RETURN arrivalsCounterStream", {this: member}, true) | member_arrivalsCounterStreams { .id,.name}],
  isArrivalsConfirmerForStream: [ member_arrivalsConfirmerStreams IN apoc.cypher.runFirstColumn("MATCH (this)-[:CONFIRMS_ARRIVALS_FOR]->(arrivalsConfirmerStream:Stream)
  RETURN arrivalsConfirmerStream", {this: member}, true) | member_arrivalsConfirmerStreams { .id,.name}]
  } AS member
  `

export const matchChurchQuery = `
  MATCH (church {id:$id}) 
  WHERE church:Fellowship OR church:Bacenta OR church:Constituency OR church:Council OR church:Stream OR church:GatheringService OR church:Sonta OR church:Ministry OR church:Member 
  OR church:ClosedFellowship OR church:ClosedBacenta
  RETURN church.id AS id, church.name AS name, church.firstName AS firstName, church.lastName AS lastName, labels(church) AS type
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
  MATCH (currentUser:Member {auth_id:$auth.jwt.sub})
  MERGE (member)-[:HAS_HISTORY]->(log)
  MERGE (log)-[:LOGGED_BY]->(currentUser)
  MERGE (date:TimeGraph {date: date()})
  MERGE (log)-[:RECORDED_ON]->(date)

RETURN member.id`

export const checkMemberEmailExists = `
MATCH (member:Member)
WHERE member.email = $email
OR member.whatsappNumber = $whatsappNumber
RETURN member.email AS email, member.whatsappNumber AS whatsappNumber
`

export const checkMemberHasNoActiveRelationships = `
MATCH p=(member:Member {id: $id})-[:LEADS|DOES_ARRIVALS_FOR|IS_ADMIN_FOR]->(church)
RETURN p
`

export const makeMemberInactive = `
MATCH (member:Member {id: $id})
SET member:InactiveMember
REMOVE member:Member

RETURN member
`

export const createMember = `
MATCH (fellowship:Fellowship {id: $fellowship})
CREATE (member:Member {whatsappNumber:$whatsappNumber})
      SET
      	member.id = apoc.create.uuid(),
      	member.firstName = $firstName,
      	member.middleName = $middleName,
      	member.lastName = $lastName,
      	member.email = $email,
      	member.phoneNumber = $phoneNumber,
      	member.pictureUrl = $pictureUrl

      CREATE (log:HistoryLog:RegistrationLog)
        SET
        log.id =  apoc.create.uuid(),
        log.timeStamp = datetime(),
        log.historyRecord = $firstName +' ' +$lastName+' was registered on '+apoc.date.convertFormat(toString(date()), 'date', 'dd MMMM yyyy') + ' with ' + fellowship.name + ' Fellowship'

      WITH member, log
      MATCH (currentUser:Member {auth_id:$auth_id})
      MATCH (maritalStatus:MaritalStatus {status:$maritalStatus})
      MATCH (gender:Gender {gender: $gender})
      MATCH (fellowship:Fellowship {id: $fellowship})
      MERGE (today:TimeGraph {date: date()})
      MERGE (log)-[:RECORDED_ON]->(today)
      MERGE (log)-[:LOGGED_BY]->(currentUser)
      MERGE (member)-[:HAS_HISTORY]->(log)
      MERGE (member)-[:HAS_MARITAL_STATUS]-> (maritalStatus)
      MERGE (member)-[:HAS_GENDER]-> (gender)
      MERGE (date:TimeGraph {date: date($dob)})
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
         	WITH member  WHERE $ministry IS NOT NULL
         	MATCH (ministry:Ministry {id:$ministry})
      	MERGE (member)-[:BELONGS_TO]-> (ministry)
         	RETURN count(member) AS member_ministry
         	}

           MATCH (fellowship:Fellowship {id: $fellowship})
           MATCH (fellowship)<-[:HAS]-(bacenta:Bacenta)
          MATCH (bacenta:Bacenta)<-[:HAS]-(constituency:Constituency)<-[:HAS]-(council:Council)
           RETURN member  {.id, .firstName,.middleName,.lastName,.email,.phoneNumber,.whatsappNumber,
            fellowship:fellowship {.id,bacenta:bacenta{.id,constituency:constituency{.id}}}}
      `
