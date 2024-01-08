MATCH (record:ServiceRecord {id: "f6fc9113-f079-400f-b90c-c66f83cc8925"})
SET record.cash = 122
SET record.income = 122 + record.onlineGiving
RETURN record.cash, record.income;

MATCH (record:ServiceRecord {id: "f6fc9113-f079-400f-b90c-c66f83cc8925"})<-[:HAS_SERVICE]-(log:ServiceLog)<-[:HAS_HISTORY]-(church)
MERGE (aggregate:AggregateServiceRecord {id: date().week + '-' + date().year + '-' + log.id, week: date().week, year: date().year})
SET  aggregate.cash = record.cash,
   aggregate.onlineGiving = record.onlineGiving,
   aggregate.dollarIncome  = record.dollarIncome

RETURN aggregate;

MATCH (record:ServiceRecord {id: "6f3f3d07-dee3-4253-82b2-2ba9bcc21007"})
DETACH DELETE record;

MATCH (record:ServiceRecord  {id: "f6fc9113-f079-400f-b90c-c66f83cc8925"})
SET record.cash = toFloat(record.cash)
RETURN record.income, record.cash;

MATCH (record:ServiceRecord {id: "3441dee2-9e46-4bf3-bbf1-bb0a41687fc9"})
REMOVE record.bankingSlip
RETURN record;

MATCH (record:RehearsalRecord)
RETURN record LIMIT 1;
