export const getMonthlyData = `
MATCH (oversight:Oversight) WHERE oversight.name IN ['Accra', 'Outside Accra']
MATCH (oversight)-[:HAS*2]->(stream:Stream)
 MATCH (stream)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
 WHERE date.date.month = $month AND date.date.year = date().year
 WITH oversight,date.date.week AS Week,SUM(record.attendance) AS streamAttendance


 WITH oversight, avg(streamAttendance) AS AverageAttendance
 MATCH (oversight)-[:HAS*5]->(bacenta:Bacenta)
RETURN oversight.name AS Oversight, COUNT(DISTINCT bacenta) AS Bacentas, AverageAttendance
`

export default getMonthlyData
