const anagkazo = {
  confirmBanking: `
      MATCH (governorship:Governorship {id:$governorshipId})
      WITH date() as today, governorship
      WITH  today.weekDay as theDay, today, governorship
      WITH date(today) - duration({days: (theDay - 2)}) AS startDate, governorship
      WITH [day in range(0, 5) | startDate + duration({days: day})] AS dates, governorship

      MATCH (date:TimeGraph)
      USING INDEX date:TimeGraph(date)
      WHERE date.date IN dates
      MATCH (date)<-[:SERVICE_HELD_ON]-(record:ServiceRecord)

       WITH DISTINCT record, governorship
        WHERE record.noServiceReason IS NULL
          AND record.bankingSlip IS NULL
          AND (record.transactionStatus IS NULL OR record.transactionStatus <> 'success')
          AND record.tellerConfirmationTime IS NULL


    WITH governorship, record
    MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)<-[:HAS*0..1]-(governorship)
    SET record.tellerConfirmationTime = datetime()

    WITH governorship, record
    
    MATCH  (teller:Active:Member {id: $jwt.userId})
    MERGE (teller)-[:CONFIRMED_BANKING_FOR]->(record)
    RETURN governorship
    `,

  formDefaultersCount: `
      MATCH (this:Governorship {id: $governorshipId})
      WITH date() as today, this
      WITH  today.weekDay as theDay, today, this
      WITH date(today) - duration({days: (theDay - 2)}) AS startDate, this
      WITH [day in range(0, 5) | startDate + duration({days: day})] AS dates, this

      MATCH (date:TimeGraph)
      USING INDEX date:TimeGraph(date)
      WHERE date.date IN dates
      MATCH (date)<-[:SERVICE_HELD_ON]-(record:ServiceRecord)

       WITH DISTINCT record, this
       MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(bacentas:Active:Bacenta)
       MATCH (bacentas)-[:MEETS_ON]->(day:ServiceDay)

       WITH collect(DISTINCT bacentas) as services, this
       MATCH (defaulters:Active:Bacenta)<-[:HAS]-(this)
       WHERE NOT defaulters IN services

       RETURN COUNT(DISTINCT defaulters) as defaulters, collect(defaulters.name) AS defaultersNames
      `,
  membershipAttendanceDefaultersCount: `
      MATCH (this:Governorship {id: $governorshipId})
      WITH date() as today, this
      WITH  today.weekDay as theDay, today, this
      WITH date(today) - duration({days: (theDay - 2)}) AS startDate, this
      WITH [day in range(0, 5) | startDate + duration({days: day})] AS dates, this

      MATCH (date:TimeGraph)
      USING INDEX date:TimeGraph(date)
      WHERE date.date IN dates
      MATCH (date)<-[:SERVICE_HELD_ON]-(record:ServiceRecord)

       WITH DISTINCT record, this
       MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(bacentas:Active:Bacenta)
       WHERE record.markedAttendance = false

       WITH collect(DISTINCT bacentas) as services, this
       MATCH (defaulters:Active:Bacenta)<-[:HAS]-(this)

       RETURN COUNT(DISTINCT defaulters) as defaulters, collect(defaulters.name) AS defaultersNames
      `,
  imclDefaultersCount: `
    MATCH (this:Governorship {id: $governorshipId})-[:HAS]->(defaulters:Bacenta)
    MATCH (defaulters)-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(date:TimeGraph)
    WHERE date.date.week = date().week
    AND record.markedAttendance = false
    
    WITH defaulters, this, COUNT(defaulters) > 0 AS imclNotFilled
    RETURN COUNT(DISTINCT defaulters) as defaulters, imclNotFilled, collect(defaulters.name) AS defaultersNames
       `,
  bankingDefaulersCount: `
    MATCH (this:Governorship {id: $governorshipId})
    WITH date() as today, this
    WITH  today.weekDay as theDay, today, this
    WITH date(today) - duration({days: (theDay - 2)}) AS startDate, this
    WITH [day in range(0, 5) | startDate + duration({days: day})] AS dates, this

    MATCH (date:TimeGraph)
    USING INDEX date:TimeGraph(date)
    WHERE date.date IN dates
    MATCH (date)<-[:SERVICE_HELD_ON]-(record:ServiceRecord)

    WITH DISTINCT record, this
      WHERE record.noServiceReason IS NULL
        AND record.bankingSlip IS NULL
        AND (record.transactionStatus IS NULL OR record.transactionStatus <> 'success')
        AND record.tellerConfirmationTime IS NULL
    MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(bacentas)<-[:HAS]-(this)

    RETURN COUNT(DISTINCT this) as bankingDefaulters
  `,
}

export default anagkazo
