const neo4j = require('neo4j-driver')
const { db } = require('./firebase')
const { loadSecrets } = require('./secrets')

const SECRETS = loadSecrets()

const whitelistIPs = (event) => {
  const validIps = ['52.31.139.75', '52.49.173.169', '52.214.14.220']

  if (validIps.includes(event.headers['x-nf-client-connection-ip'])) {
    console.log('IP OK')
    return true
  }
  console.error(`Bad IP: ${event.headers['x-nf-client-connection-ip']}`)
  return false
}

const setTransactionStatusSuccess = `
      MATCH (record {transactionReference: $reference}) 
      WHERE record:ServiceRecord OR record:Transaction OR record:RehearsalRecord
        SET record.transactionStatus = 'success'
      
      RETURN record
    `
const setTransactionStatusFailed = `
      MATCH (record {transactionReference: $reference}) 
      WHERE record:ServiceRecord OR record:Transaction OR record:RehearsalRecord
        SET record.transactionStatus = 'failed'
      
      RETURN record
    `
const setTransactionStatusPending = `
    MATCH (record {transactionReference: $reference})
    WHERE record:ServiceRecord OR record:Transaction OR record:RehearsalRecord
      SET record.transactionStatus = 'pending'
    
    RETURN record
  `

const executeQuery = async (neoDriver, paymentResponse) => {
  const session = neoDriver.session()
  let response = ''

  try {
    const neoRes = await session.executeWrite(async (tx) => {
      const { reference, status } = paymentResponse
      let query = ''

      if (status === 'success') {
        query = setTransactionStatusSuccess
        response = `Successfully updated transaction status to success ${reference}`
      } else if (status === 'failed') {
        query = setTransactionStatusFailed
        response = `Successfully updated transaction status to failed ${reference}`
      } else if (status === 'pending') {
        query = setTransactionStatusPending
        response = `Successfully updated transaction status to pending ${reference}`
      }

      return tx.run(query, { reference })
    })
    console.log('🚀 ~ file: payment.js:40 ~ response:', response)

    return neoRes
  } catch (error) {
    console.error('There was an error writing to db', error)
  } finally {
    session.close()
  }

  return null
}

const executeCreditChurchesQuery = async (neoDriver, paymentResponse) => {
  const session = neoDriver.session()
  let response = ''

  try {
    const neoRes = await session.executeWrite(async (tx) => {
      const { reference } = paymentResponse
      const query = `
        MATCH (record:Transaction {transactionReference: $reference})
        MATCH (record)<-[r:MADE_TRANSACTION]-(church)
          SET church.downloadCredits = church.downloadCredits + record.amount
          SET record.credited = true

        RETURN church
      `
      response = `Successfully updated transaction status to success ${reference}`

      return tx.run(query, { reference })
    })
    console.log('🚀 ~ file: payment.js:40 ~ response:', response)

    return neoRes
  } catch (error) {
    console.error('There was an error writing to db', error)
  } finally {
    session.close()
  }

  return null
}

const handlePaystackReq = async (event, neoDriver) => {
  if (!whitelistIPs(event)) {
    throw new Error('IP not whitelisted ')
  }
  const parsedBody = JSON.parse(event.body)
  const { reference, status } = parsedBody.data

  const neoRes = await executeQuery(neoDriver, { reference, status })

  const categories = neoRes.records[0]?.get('record').labels
  if (!categories) console.log('🚀 ~ file: payment.js:78 ~ neoRes:', neoRes)

  console.log('🚀 ~ file: payment.js:80 ~ categories:', categories)

  if (categories.includes('CreditTransaction')) {
    await executeCreditChurchesQuery(neoDriver, { reference })
  }
  if (categories.includes('Offering')) {
    await db
      .collection('offerings')
      .doc(reference)
      .update({ transactionStatus: status })
  }
  if (categories.includes('Tithe')) {
    await db
      .collection('tithes')
      .doc(reference)
      .update({ transactionStatus: status })
  }
  if (categories.includes('BENMP')) {
    await db
      .collection('benmp')
      .doc(reference)
      .update({ transactionStatus: status })
  }

  return neoRes.records[0]?.get('record').properties
}

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
  const driver = neo4j.driver(
    SECRETS.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    )
  )

  const init = async (initVar) =>
    handlePaystackReq(initVar.event, initVar.driver)

  await init({ event, driver }).catch((error) => {
    console.error(`\n${error.message}\n${error.stack}`)
    return { statusCode: 500, body: JSON.stringify(error) }
  })

  return {
    statusCode: 200,
  }
}
