

MATCH (member:Member) WHERE member.imclChecked = false
SET member.imclChecked = true
RETURN COUNT(member)