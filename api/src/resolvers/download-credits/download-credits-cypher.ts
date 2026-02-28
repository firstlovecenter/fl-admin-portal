export const initiateDownloadCreditsTransaction = `
  MATCH (user:Member {id: $jwt.userId})

  CREATE (transaction:Transaction:CreditTransaction {id: randomUUID()})
    SET transaction.amount = $amount,
    transaction.transactionStatus = $transactionStatus,
    transaction.transactionReference = $transactionReference,
    transaction.createdAt = datetime(),
    transaction.method = 'mobileMoney',
    transaction.mobileNetwork = $mobileNetwork,
    transaction.mobileNumber = $mobileNumber,
    transaction.credited = false

  WITH user, transaction
  MATCH (church {id: $churchId})
  WHERE church:Bacenta OR church:Governorship OR church:Council OR church:Stream OR church:Campus OR church:Oversight OR church:Hub OR church:HubCouncil OR church:Ministry OR church:CreativeArts

  MERGE (church)-[:PURCHASED_CREDITS]->(transaction)

  RETURN transaction
`

export const getMember = `
    MATCH (member:Member {id: $jwt.userId})
    RETURN member
`

export const updateTransactionStatus = `
  MATCH (transaction:CreditTransaction {transactionReference: $transactionReference})
    SET transaction.transactionStatus = $status
  RETURN transaction
  `

export const creditSuccessfulTransaction = `
  MATCH (record:CreditTransaction {transactionReference: $transactionReference})
  MATCH (record)<-[r:PURCHASED_CREDITS]-(church)
  WITH church, record, SUM(church.downloadCredits) as totalCredits  
           SET church.downloadCredits = totalCredits + record.amount
           SET record.credited = true

RETURN church, record
`
