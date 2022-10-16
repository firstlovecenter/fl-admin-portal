const neo4j = require('neo4j-driver')

const whitelistIPs = (event) => {
  const validIps = ['52.31.139.75', '52.49.173.169', '52.214.14.220'] // Put your IP whitelist in this array

  if (validIps.includes(event.headers['x-nf-client-connection-ip'])) {
    console.log('IP OK')
    return true
  }
  console.error(`Bad IP: ${event.headers['x-nf-client-connection-ip']}`)
  return false
}

const setTransactionStatusSuccess = `
      MATCH (record:ServiceRecord {transactionReference: $reference})
      SET record.transactionStatus = 'success'
      
      RETURN record
    `
const setTransactionStatusFailed = `
      MATCH (record:ServiceRecord {transactionReference: $reference})
      SET record.transactionStatus = 'failed'
      
      RETURN record
    `
const setTransactionStatusPending = `
    MATCH (record:ServiceRecord {transactionReference: $reference})
    SET record.transactionStatus = 'pending'
    
    RETURN record
  `

const executeQuery = (neoDriver, paymentResponse) => {
  const session = neoDriver.session()

  return session
    .writeTransaction((tx) => {
      const { reference, status } = paymentResponse

      let query = setTransactionStatusPending

      if (status === 'success') {
        console.log('Setting transaction status to success', reference)
        query = setTransactionStatusSuccess
      } else if (status === 'failed') {
        console.log('Setting transaction status to failed', reference)
        query = setTransactionStatusFailed
      } else if (status === 'pending') {
        console.log('Setting transaction status to pending', reference)
        query = setTransactionStatusPending
      }

      return tx.run(query, { reference })
    })
    .finally(() => session.close())
}

const handlePaystackReq = async (event, neoDriver) => {
  // if (!whitelistIPs(event)) {
  //   throw new Error('IP not whitelisted')
  // }

  const body = JSON.parse(event.body)
  const { reference, status } = body.data

  return executeQuery(neoDriver, { reference, status })
    .then((res) =>
      // eslint-disable-next-line no-underscore-dangle
      console.log(res.records[0]._fields[0].properties)
    )
    .catch((error) => console.error(new Error('Error running cypher', error)))
}

// eslint-disable-next-line import/prefer-default-export
export const handler = async (event) => {
  const driver = neo4j.driver(
    process.env.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      process.env.NEO4J_USER || 'neo4j',
      process.env.NEO4J_PASSWORD || 'neo4j'
    )
  )

  const init = async (initVar) => {
    return handlePaystackReq(initVar.event, initVar.driver)
  }

  init({ event, driver }).catch((error) => {
    console.error(`\n${error.message}\n${error.stack}`)
    return { statusCode: 500, body: JSON.stringify(error) }
  })

  return {
    statusCode: 200,
  }
}
