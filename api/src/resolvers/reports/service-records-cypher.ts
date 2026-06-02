/**
 * Per-`ServiceRecord` detail report for a single Bacenta.
 *
 * Returns one row per ServiceRecord (including `:NoService` markers — those
 * rows carry `noServiceReason` and null financial columns). Each row carries
 * who recorded the service, treasurers, photo URLs, and banking-proof state
 * so the Bacenta leader can audit the full service log without losing
 * per-record context to weekly aggregation.
 *
 * Only exposed on Bacenta. At Governorship+ the row count would explode and
 * the audit context is provided by the existing weekly aggregate.
 *
 * `:NoService` rows arrive via the same `:ServiceRecord` match because
 * `RecordNoService` dual-labels the node `(:ServiceRecord:NoService)` at
 * create time (`api/src/resolvers/services/service-cypher.ts`). Tightening
 * the match to `WHERE NOT record:NoService` would silently drop the audit
 * rows this report exists to surface.
 */
// eslint-disable-next-line import/prefer-default-export
export const bacentaServiceRecordsReport = `
  MATCH (church:Bacenta {id: $id})-[:HAS_HISTORY]->(:ServiceLog)-[:HAS_SERVICE]->(record:ServiceRecord)-[:SERVICE_HELD_ON]->(t:TimeGraph)
  WHERE (t.date.year * 100 + t.date.week) >= $startWeekKey
    AND (t.date.year * 100 + t.date.week) <= $endWeekKey

  CALL {
    WITH record
    OPTIONAL MATCH (record)-[:LOGGED_BY]->(member:Member)
    RETURN head(collect(member)) AS creator
  }

  CALL {
    WITH record
    OPTIONAL MATCH (record)<-[:CONFIRMED_BANKING_FOR]-(member:Member)
    RETURN head(collect(member)) AS confirmedBy
  }
  CALL {
    WITH record
    OPTIONAL MATCH (record)<-[:OFFERING_BANKED_BY]-(member:Member)
    RETURN head(collect(member)) AS offeringBanker
  }
  CALL {
    WITH record
    OPTIONAL MATCH (record)<-[:UPLOADED_SLIP_FOR]-(member:Member)
    RETURN head(collect(member)) AS slipUploader
  }

  CALL {
    WITH record
    OPTIONAL MATCH (record)<-[:WAS_TREASURER_FOR]-(treasurer:Member)
    WITH treasurer
    WHERE treasurer IS NOT NULL
    RETURN collect({
      id: treasurer.id,
      name: trim(coalesce(treasurer.firstName, '') + ' ' + coalesce(treasurer.lastName, '')),
      phone: treasurer.phoneNumber,
      whatsapp: treasurer.whatsappNumber
    }) AS treasurers
  }

  WITH church, record, t, creator, treasurers,
       coalesce(confirmedBy, offeringBanker, slipUploader) AS banker
  ORDER BY t.date DESC, record.createdAt DESC

  WITH collect({
    id: record.id,
    churchId: church.id,
    churchName: church.name,
    serviceDate: toString(t.date),
    week: t.date.week,
    year: t.date.year,
    attendance: record.attendance,
    income: record.income,
    cash: record.cash,
    onlineGiving: record.onlineGiving,
    numberOfTithers: record.numberOfTithers,
    dollarIncome: record.dollarIncome,
    foreignCurrency: record.foreignCurrency,
    noServiceReason: record.noServiceReason,
    createdAt: toString(record.createdAt),
    recordedByName: CASE
      WHEN creator IS NULL THEN null
      ELSE trim(coalesce(creator.firstName, '') + ' ' + coalesce(creator.lastName, ''))
    END,
    recordedByPhone: creator.phoneNumber,
    treasurers: treasurers,
    familyPicture: record.familyPicture,
    treasurerSelfie: record.treasurerSelfie,
    bankingSlip: record.bankingSlip,
    transactionStatus: record.transactionStatus,
    bankingProof: CASE
      WHEN record.bankingSlip IS NOT NULL
        OR record.transactionStatus = 'success'
        OR record.tellerConfirmationTime IS NOT NULL
      THEN true
      ELSE false
    END,
    bankedByName: CASE
      WHEN banker IS NULL THEN null
      ELSE trim(coalesce(banker.firstName, '') + ' ' + coalesce(banker.lastName, ''))
    END,
    bankedByPhone: banker.phoneNumber
  }) AS entries
  RETURN entries
`
