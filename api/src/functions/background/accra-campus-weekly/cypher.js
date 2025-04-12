export const councilListQuery = `
MATCH (:Campus {name: $campusName})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(pastor:Member) WHERE council.name <> 'John'
MATCH (stream)<-[:LEADS]-(bishop:Member)
OPTIONAL MATCH (council)-[:HAS*2]->(active:Active:Green:Bacenta)
OPTIONAL MATCH (council)-[:HAS*2]->(vacation:Vacation:Green:Bacenta)
RETURN  DISTINCT  pastor.firstName, pastor.lastName, pastor.firstName + ' '+ pastor.lastName AS Pastor, stream.name AS Stream, bishop.firstName + " " + bishop.lastName AS Bishop, collect(DISTINCT council.name) AS Council, COUNT(DISTINCT active) as ActiveBacentas, COUNT(DISTINCT vacation) as VacationBacentas ORDER BY pastor.firstName, pastor.lastName
`

export const bacentasThatBussedQuery = `
MATCH (:Campus {name: $campusName})-[:HAS*2]->(council:Council)<-[:LEADS]-(pastor:Member) WHERE council.name <> 'John'
OPTIONAL MATCH (council)-[:HAS*2]->(bacentas:Green:Bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph)
         WHERE date.date.year = date($bussingDate).year AND date.date.week = date($bussingDate).week
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(record:VehicleRecord)
         WHERE record.arrivalTime IS NOT NULL AND record.attendance > 0
RETURN DISTINCT pastor.firstName, pastor.lastName, COUNT(DISTINCT bacentas) AS bacentasThatBussed ORDER BY pastor.firstName, pastor.lastName
`

export const bacentasThatDidntBusQuery = `
MATCH (:Campus {name: $campusName})-[:HAS*2]->(council:Council)<-[:LEADS]-(pastor:Member) WHERE council.name <> 'John'
OPTIONAL MATCH (council)-[:HAS*2]->(bacentas:Green:Bacenta)

// WHERE NOT EXISTS {
//     MATCH (bacenta)-[:HAS_HISTORY]->(log)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph)
//             WHERE date.date.year = date($bussingDate).year AND date.date.week = date($bussingDate).week AND EXISTS
//             {
//                 MATCH (bussing)-[:INCLUDES_RECORD]->(record:VehicleRecord)
//             WHERE record.arrivalTime IS NOT NULL AND record.attendance > 0
//         }
// }

RETURN DISTINCT pastor.firstName, pastor.lastName, COUNT(DISTINCT bacentas) AS bacentasThatDidntBus ORDER BY pastor.firstName, pastor.lastName
`

export const numberOfBussesQuery = `
MATCH (gs:Campus {name: $campusName})-[:HAS*2]->(council:Council)<-[:LEADS]-(pastor:Member) WHERE council.name <> '1 John'
OPTIONAL MATCH (council)-[:HAS*2]->(bacentas:Bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph)
         WHERE date.date.year = date($bussingDate).year AND date.date.week = date($bussingDate).week
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(record:VehicleRecord)
        WHERE record.arrivalTime IS NOT NULL AND record.attendance > 0 AND record.vehicle <> 'Car'
RETURN  DISTINCT  pastor.firstName, pastor.lastName,COUNT(DISTINCT record) AS numberOfBusses ORDER BY pastor.firstName, pastor.lastName
`

export const bussingAttendanceQuery = `
MATCH (gs:Campus {name: $campusName})-[:HAS*2]->(council:Council)<-[:LEADS]-(pastor:Member) WHERE council.name <> '1 John'
OPTIONAL MATCH (council)-[:HAS*2]->(bacentas:Bacenta)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_BUSSING]->(bussing:BussingRecord)-[:BUSSED_ON]->(date:TimeGraph)
        WHERE date.date.year = date($bussingDate).year AND date.date.week = date($bussingDate).week
OPTIONAL MATCH (bussing)-[:INCLUDES_RECORD]->(record:VehicleRecord)
        WHERE record.arrivalTime IS NOT NULL AND record.attendance > 0
RETURN  DISTINCT  pastor.firstName, pastor.lastName,  SUM(record.attendance) AS bussingAttendance ORDER BY pastor.firstName, pastor.lastName
`

export const activeVacationFellowshipsQuery = `
MATCH (gs:Campus {name:  $campusName})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(pastor:Member)
OPTIONAL MATCH (council)-[:HAS*3]->(active:Active:Fellowship)
OPTIONAL MATCH (council)-[:HAS*3]->(vacation:Vacation:Fellowship) 
RETURN  DISTINCT  stream.name, pastor.firstName, pastor.lastName,COUNT(DISTINCT active) AS Active, COUNT(DISTINCT vacation)  AS Vacation ORDER BY pastor.firstName, pastor.lastName
`

export const servicesThisWeekQuery = `
MATCH (gs:Campus {name:  $campusName})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(pastor:Member)
MATCH (council)-[:HAS*2]- >(bacentas) WHERE bacentas:Bacenta OR bacentas:ClosedBacenta
OPTIONAL MATCH (bacentas)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
         WHERE date.date.week = date($bussingDate).week AND date.date.year = date($bussingDate).year
         AND record.attendance IS NOT NULL
RETURN  DISTINCT  stream.name, pastor.firstName, pastor.lastName,COUNT(DISTINCT record) AS servicesThisWeek ORDER BY pastor.firstName, pastor.lastName
      `

export const servicesNotBankedQuery = `
MATCH (gs:Campus {name:  $campusName})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(pastor:Member)
OPTIONAL MATCH (council)-[:HAS_HISTORY|HAS_SERVICE|HAS*2..5]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
         WHERE date.date.week =date($bussingDate).week AND date.date.year = date($bussingDate).year
         AND record.attendance IS NOT NULL AND  record.bankingSlip IS NULL
          AND (record.transactionStatus IS NULL OR record.transactionStatus <> 'success')
          AND record.tellerConfirmationTime IS NULL
      RETURN  DISTINCT stream.name, pastor.firstName, pastor.lastName,COUNT(DISTINCT record) AS servicesNotBanked ORDER BY pastor.firstName, pastor.lastName
      `

export const weekdayIncomeAttendanceQuery = `
MATCH (gs:Campus {name: $campusName})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(pastor:Member)
OPTIONAL MATCH (council)-[:HAS_HISTORY|HAS_SERVICE|HAS*2..5]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
WHERE date.date.year = date($bussingDate).year AND date.date.week = date($bussingDate).week
RETURN stream.name, pastor.firstName, pastor.lastName,SUM(record.attendance) AS attendance, SUM(round(record.income,2)) AS income ORDER BY pastor.firstName, pastor.lastName
`

export const amountNotBankedQuery = `
MATCH (gs:Campus {name: $campusName})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(pastor:Member)
OPTIONAL MATCH (council)-[:HAS_HISTORY|HAS_SERVICE|HAS*2..5]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
WHERE date.date.year = date($bussingDate).year AND date.date.week = date($bussingDate).week
        AND record.noServiceReason IS NULL
          AND record.bankingSlip IS NULL
          AND (record.transactionStatus IS NULL OR record.transactionStatus <> 'success')
          AND record.tellerConfirmationTime IS NULL
RETURN stream.name, pastor.firstName, pastor.lastName,SUM(round(record.income,2)) AS notBanked ORDER BY pastor.firstName, pastor.lastName
`

export const amountBankedQuery = `
MATCH (gs:Campus {name: $campusName})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(pastor:Member)
OPTIONAL MATCH (council)-[:HAS_HISTORY|HAS_SERVICE|HAS*2..5]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
WHERE date.date.year = date($bussingDate).year AND date.date.week = date($bussingDate).week
        AND record.noServiceReason IS NULL
          AND (record.bankingSlip IS NOT NULL
          OR record.transactionStatus = 'success'
          OR record.tellerConfirmationTime IS  NOT NULL)
RETURN  stream.name, pastor.firstName, pastor.lastName,SUM(round(record.income,2)) AS Banked ORDER BY pastor.firstName, pastor.lastName`

export const anagkazoAttendanceIncomeQuery = `
MATCH (gs:Campus {name: $campusName})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(pastor:Member {lastName: "Amartey"}) 
MATCH (stream)-[:HAS_HISTORY|HAS_SERVICE|HAS*2..6]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
WHERE date.date.year = date($bussingDate).year AND date.date.week = date($bussingDate).week
WITH DISTINCT record, pastor
WITH  pastor AS amartey,SUM(record.attendance) AS totalAttendance,SUM(round(record.income,2)) AS totalIncome

RETURN amartey.firstName, amartey.lastName, totalAttendance as anagkazoAttendance, totalIncome AS anagkazoIncome
`

export const anagkazoAmountNotBankedQuery = `
MATCH (gs:Campus {name: $campusName})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(pastor:Member {lastName: "Amartey"}) 
MATCH (stream)-[:HAS_HISTORY|HAS_SERVICE|HAS*2..6]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
WHERE date.date.year = date($bussingDate).year AND date.date.week = date($bussingDate).week
        AND record.noServiceReason IS NULL
        AND record.bankingSlip IS NULL
        AND (record.transactionStatus IS NULL OR record.transactionStatus <> 'success')
        AND record.tellerConfirmationTime IS NULL
WITH DISTINCT record, pastor
WITH  pastor AS amartey,SUM(round(record.income,2)) AS totalIncome


WITH amartey, totalIncome

RETURN amartey.firstName, amartey.lastName, totalIncome AS notBanked ORDER BY amartey.firstName, amartey.lastName
`

export const anagkazoAmountBankedQuery = `
MATCH (gs:Campus {name: $campusName})-[:HAS]->(stream:Stream)-[:HAS]->(council:Council)<-[:LEADS]-(pastor:Member {lastName: "Amartey"}) 
MATCH (stream)-[:HAS_HISTORY|HAS_SERVICE|HAS*2..6]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
WHERE date.date.year = date($bussingDate).year AND date.date.week = date($bussingDate).week
        AND record.noServiceReason IS NULL
        AND (record.bankingSlip IS NOT NULL
        OR record.transactionStatus = 'success'
        OR record.tellerConfirmationTime IS  NOT NULL)
WITH DISTINCT record, pastor
WITH  pastor AS amartey, SUM(round(record.income,2)) AS totalIncome


RETURN amartey.firstName, amartey.lastName, totalIncome AS Banked ORDER BY amartey.firstName, amartey.lastName
`
