const newMembersListQuery = `
MATCH (oversight:Oversight {name: $campusName })-[:HAS]->(campus:Campus)-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(bishop:Member)
MATCH (council)-[:HAS]->(governorship:Governorship)-[:HAS]->(bacenta:Bacenta)
MATCH (governorship)<-[:LEADS]-(governor)
MATCH (bacenta)<-[:LEADS]-(bacentaLeader)
MATCH (bacenta)<-[:BELONGS_TO]-(member:Member) WHERE member.registrationDate >= datetime() - duration({days: 7})
RETURN  DISTINCT  stream.name AS Stream, council.name AS Council, bishop.firstName + ' '+ bishop.lastName AS Bishop, governor.firstName + " " + governor.lastName AS Governor,
governorship.name AS Governorship,
bacentaLeader.firstName + " " + bacentaLeader.lastName AS BacentaLeader,
member.firstName AS MemberFirstName, member.lastName AS MemberLastName, member.phoneNumber AS MemberPhoneNumber, member.whatsappNumber AS MemberWhatsappNumber, toString(date(member.registrationDate)) AS RegistrationDate
`

const membersDidntComeToChurchQuery = ``

module.exports = {
  newMembersListQuery,
  membersDidntComeToChurchQuery,
}
