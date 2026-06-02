/* eslint-disable fl-cypher/no-interpolated-cypher --
   confirmBanking composes the markRecordTellerConfirmed STATIC helper
   fragment from banking-cypher.ts. The only interpolated expression
   takes hardcoded literal variable names ('record', 'teller') and
   returns a static Cypher string — no user input flows through. All
   runtime values bind via $jwt.userId, $governorshipId, $bh_method,
   $bh_fromStatus, $bh_toStatus, $bh_message. ADR-012 satisfied. */
import { markRecordTellerConfirmed } from '../banking/banking-cypher'

const treasury = {
  // SM2 atomic batch confirm. The WHERE clause filters to records that
  // (a) had a service held, (b) have not been banked by any of the three
  // proof paths, (c) have not yet been teller-confirmed. Two concurrent
  // tellers serialize via Neo4j's per-node write locks; the loser's run
  // sees tellerConfirmationTime already set on every record and the WHERE
  // clause excludes them all, so the loser writes nothing.
  //
  // The query returns DISTINCT affectedCount so the resolver can tell a
  // genuine zero-affect (already-confirmed-by-someone-else, OR no
  // governorship matched) from a successful batch. We no longer rely on
  // the racy bankingDefaulersCount read-then-write precheck.
  confirmCouncilBanking: `
      MATCH (council:Council {id:$councilId})
      WITH date() as today, council
      WITH  today.weekDay as theDay, today, council
      WITH date(today) - duration({days: (theDay - 1)}) AS startDate, council
      WITH [day in range(0, 6) | startDate + duration({days: day})] AS dates, council

      MATCH (date:TimeGraph)
      USING INDEX date:TimeGraph(date)
      WHERE date.date IN dates
      MATCH (date)<-[:SERVICE_HELD_ON]-(record:ServiceRecord)

       WITH DISTINCT record, council
        WHERE record.noServiceReason IS NULL
          AND record.bankingSlip IS NULL
          AND (record.transactionStatus IS NULL OR record.transactionStatus <> 'success')
          AND record.tellerConfirmationTime IS NULL

    // Scope check: only Council-direct records (1 hop) — Governorship and
    // Bacenta records are owned by ConfirmBanking, so excluding the deeper
    // walks here avoids double-banking the same offering through two
    // different mutations.
    WITH council, record
    WHERE EXISTS {
      MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(council)
    }
    MATCH (teller:Active:Member {id: $jwt.userId})
    WITH council, record, teller,
         record.transactionStatus AS bh_fromStatus,
         'Teller batch-confirmed banking for ' + coalesce(council.name, council.id) + ' Council' AS bh_msg
    ${markRecordTellerConfirmed('record', 'teller', 'bh_msg')}
    WITH council, count(DISTINCT record) AS affectedCount
    RETURN council, affectedCount
    `,

  confirmBanking: `
      MATCH (governorship:Governorship {id:$governorshipId})
      WITH date() as today, governorship
      WITH  today.weekDay as theDay, today, governorship
      WITH date(today) - duration({days: (theDay - 1)}) AS startDate, governorship
      WITH [day in range(0, 6) | startDate + duration({days: day})] AS dates, governorship

      MATCH (date:TimeGraph)
      USING INDEX date:TimeGraph(date)
      WHERE date.date IN dates
      MATCH (date)<-[:SERVICE_HELD_ON]-(record:ServiceRecord)

       WITH DISTINCT record, governorship
        WHERE record.noServiceReason IS NULL
          AND record.bankingSlip IS NULL
          AND (record.transactionStatus IS NULL OR record.transactionStatus <> 'success')
          AND record.tellerConfirmationTime IS NULL


    // Scope check via semi-join (EXISTS) — the previous MATCH variant
    // fanned the row stream out N times per record (once per :ServiceLog
    // ancestor), causing duplicate BankingHistoryLog audit rows to be
    // CREATEd per single banking action. EXISTS short-circuits at the
    // first match and keeps one row per (record, governorship).
    WITH governorship, record
    WHERE EXISTS {
      MATCH (record)<-[:HAS_SERVICE]-(:ServiceLog)<-[:HAS_HISTORY]-(church)<-[:HAS*0..1]-(governorship)
    }
    MATCH (teller:Active:Member {id: $jwt.userId})
    WITH governorship, record, teller,
         record.transactionStatus AS bh_fromStatus,
         'Teller batch-confirmed banking for ' + coalesce(governorship.name, governorship.id) + ' Governorship' AS bh_msg
    ${markRecordTellerConfirmed('record', 'teller', 'bh_msg')}
    WITH governorship, count(DISTINCT record) AS affectedCount
    RETURN governorship, affectedCount
    `,

  formDefaultersCount: `
      MATCH (this:Governorship {id: $governorshipId})
      WITH date() as today, this
      WITH  today.weekDay as theDay, today, this
      WITH date(today) - duration({days: (theDay - 1)}) AS startDate, this
      WITH [day in range(0, 6) | startDate + duration({days: day})] AS dates, this

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
      WITH date(today) - duration({days: (theDay - 1)}) AS startDate, this
      WITH [day in range(0, 6) | startDate + duration({days: day})] AS dates, this

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
}

export default treasury
