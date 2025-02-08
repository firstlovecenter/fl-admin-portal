MATCH (council:Council) WHERE council.id = "9ec1a897-7c84-4581-b93f-d4d882075108"
MATCH (council)<-[:LEADS]-(leader:Member)
RETURN council, leader

MATCH (member:Member) WHERE member.imclChecked = false
SET member.imclChecked = true
RETURN COUNT(member)