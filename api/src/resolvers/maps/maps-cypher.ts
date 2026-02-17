export const memberBacentaSearchByName = `
MATCH (this:Member {id: $id})-[:LEADS|HAS|IS_ADMIN_FOR*1..5]->(bacenta:Active:Bacenta)<-[:LEADS]-(bacentaLeader:Member)
MATCH (bacenta)<-[:HAS]-(:Governorship)<-[:HAS]-(council:Council)<-[:LEADS]-(councilLeader:Member)
WHERE toLower(bacenta.name) CONTAINS toLower($key) AND bacenta.location IS NOT NULL
RETURN DISTINCT bacenta,
bacentaLeader {
  .id,
  .firstName,
  .lastName,
  .phoneNumber,
  .whatsappNumber,
  .pictureUrl
},
council {
  .id,
  .name
},
councilLeader {
  .id,
  .firstName,
  .lastName,
  .phoneNumber,
  .whatsappNumber,
  .pictureUrl
}
LIMIT toInteger($limit)
`

export const memberLoadCouncilUnvisitedMembers = `
MATCH (this:Member {id: $id})-[:LEADS|IS_ADMIN_FOR]->(council:Council)-[:HAS]->(:Governorship)-[:HAS]->(:Bacenta)<-[:BELONGS_TO]-(member:Member)-[:LEADS|IS_ADMIN_FOR]->()
MATCH (cycle:CouncilCycle {half: toInteger(ceil(toFloat(date().month)/toFloat(6))) - 1, year: date().year})
MATCH (author:Member {id: $jwt.userId})-[:CURRENT_HISTORY]->(log:ServiceLog)<-[:CURRENT_HISTORY]-(council)
WHERE NOT EXISTS {
   MATCH (log)-[:PERFORMED_DUTY]->(visitation:VisitationActivity)
   WHERE (visitation)-[:TOWARDS]->(member) AND (visitation)-[:DURING_CYCLE]->(cycle)
}

OPTIONAL MATCH (author)-[:LEADS]->(lowerChurch)<-[:BELONGS_TO]-(alreadyMember:Member)
WHERE lowerChurch:Governorship OR lowerChurch:Bacenta
WITH member, author, collect(DISTINCT alreadyMember) AS alreadyMembers WHERE NOT member IN alreadyMembers
WITH member, author WHERE member <> author
AND member.location IS NOT NULL

WITH DISTINCT member
MATCH (member)-[:BELONGS_TO]->(bacenta:Bacenta)<-[:HAS*2]-(council:Council)<-[:LEADS]-(pastor:Member)

  RETURN DISTINCT member, 
  bacenta {
    .id,
    .name,
    .location
  },
  council {
    .id,
    .name
  },
    pastor {
      .id,
      .firstName,
      .lastName,
      .phoneNumber,
      .whatsappNumber,
      .pictureUrl
    }
   ORDER BY toLower(member.lastName), toLower(member.firstName)
`

export const memberMemberSearchByName = `
MATCH (this:Member {id: $id})-[:LEADS|HAS|IS_ADMIN_FOR*1..6]->(:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
WHERE toLower(member.firstName+ ' ' + member.lastName) CONTAINS toLower($key) AND member.location IS NOT NULL
WITH DISTINCT member
MATCH (member)-[:BELONGS_TO]->(bacenta:Bacenta)<-[:HAS*2]-(council:Council)<-[:LEADS]-(pastor:Member)

  RETURN DISTINCT member, 
  bacenta {
    .id,
    .name,
    .location
  },
  council {
    .id,
    .name
  },
    pastor {
      .id,
      .firstName,
      .lastName,
      .phoneNumber,
      .whatsappNumber,
      .pictureUrl
    }
   ORDER BY toLower(member.lastName), toLower(member.firstName) LIMIT toInteger($limit)
`

export const indoorOutreachVenuesSearchByName = `
MATCH (outreachVenue:IndoorVenue)
WHERE toLower(outreachVenue.name) CONTAINS toLower($key) AND outreachVenue.location IS NOT NULL
RETURN DISTINCT outreachVenue LIMIT toInteger($limit)
`

export const outdoorOutreachVenuesSearchByName = `
MATCH (outreachVenue:OutdoorVenue)
WHERE toLower(outreachVenue.name) CONTAINS toLower($key) AND outreachVenue.location IS NOT NULL
RETURN DISTINCT outreachVenue LIMIT toInteger($limit)
`

export const memberBacentaSearchByLocation = `
  MATCH (this:Member {id: $id})-[:LEADS|HAS|IS_ADMIN_FOR*1..5]->(bacenta:Bacenta)<-[:LEADS]-(bacentaLeader:Member)
  MATCH (bacenta)<-[:HAS]-(:Bacenta)<-[:HAS]-(:Governorship)<-[:HAS]-(council:Council)<-[:LEADS]-(councilLeader:Member)
  WITH bacenta, bacentaLeader, council, councilLeader, point.distance(point({latitude: bacenta.location.latitude, longitude: bacenta.location.longitude}), point({latitude: $latitude, longitude: $longitude})) AS distance
  WHERE distance <= 5000
  RETURN DISTINCT bacenta,
  bacentaLeader {
    .id,
    .firstName,
    .lastName,
    .phoneNumber,
    .whatsappNumber,
    .pictureUrl
  },
  council {
    .id,
    .name
  },
  councilLeader {
    .id,
    .firstName,
    .lastName,
    .phoneNumber,
    .whatsappNumber,
    .pictureUrl
  }, distance ORDER BY distance, bacenta.name ASC LIMIT 30
`

export const memberMemberSearchByLocation = `
  MATCH (this:Member {id: $id})-[:LEADS|HAS|IS_ADMIN_FOR*1..5]->(:Bacenta)<-[:BELONGS_TO]-(member:Active:Member)
  WITH member, point.distance(point({latitude: member.location.latitude, longitude: member.location.longitude}), point({latitude: $latitude, longitude: $longitude})) AS distance
  WHERE distance <= 5000

WITH DISTINCT member, distance
MATCH (member)-[:BELONGS_TO]->(bacenta:Bacenta)<-[:HAS*2]-(council:Council)<-[:LEADS]-(pastor:Member)

RETURN DISTINCT member, 
  bacenta {
    .id,
    .name,
    .location
  },
  council {
    .id,
    .name
  },
  pastor {
    .id,
    .firstName,
    .lastName,
    .phoneNumber,
    .whatsappNumber,
    .pictureUrl
    },
   distance ORDER BY distance, toLower(member.lastName), toLower(member.firstName) LIMIT toInteger($limit)
`

export const indoorOutreachVenuesSearchByLocation = `
  MATCH (outreachVenue:IndoorVenue)
  WITH outreachVenue, point.distance(point({latitude: outreachVenue.location.latitude, longitude: outreachVenue.location.longitude}), point({latitude: $latitude, longitude: $longitude})) AS distance
  WHERE distance <= 5000
  RETURN DISTINCT outreachVenue, distance ORDER BY distance, outreachVenue.name ASC LIMIT 30
`

export const outdoorOutreachVenuesSearchByLocation = `
  MATCH (outreachVenue:OutdoorVenue)
  WITH outreachVenue, point.distance(point({latitude: outreachVenue.location.latitude, longitude: outreachVenue.location.longitude}), point({latitude: $latitude, longitude: $longitude})) AS distance
  WHERE distance <= 5000
  RETURN DISTINCT outreachVenue, distance ORDER BY distance, outreachVenue.name ASC LIMIT 30
`
