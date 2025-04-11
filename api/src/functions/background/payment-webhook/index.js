const neo4j = require('neo4j-driver')
const { db } = require('./firebase')
const { loadSecrets } = require('./secrets')

/**
 * Validates that the request is coming from a whitelisted IP address
 * @param {Object} event - The Lambda event object
 * @returns {boolean} - Whether the IP is whitelisted
 */
const whitelistIPs = (event) => {
  // Paystack IP addresses
  const validIps = ['52.31.139.75', '52.49.173.169', '52.214.14.220']

  // AWS Lambda uses different header format than Netlify
  const sourceIp =
    event.requestContext?.identity?.sourceIp ||
    event.headers['X-Forwarded-For'] ||
    event.headers['x-forwarded-for']?.split(',')[0]

  if (validIps.includes(sourceIp)) {
    console.log('IP OK:', sourceIp)
    return true
  }
  console.error(`Bad IP: ${sourceIp}`)
  return false
}

// Cypher queries for updating transaction status
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

/**
 * Executes the appropriate Cypher query based on the payment status
 * @param {Object} neoDriver - Neo4j driver
 * @param {Object} paymentResponse - Payment response data
 * @returns {Object} - Neo4j result
 */
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
    console.log('Response:', response)

    return neoRes
  } catch (error) {
    console.error('There was an error writing to db', error)
  } finally {
    await session.close()
  }

  return null
}

/**
 * Executes the query to credit churches with download credits
 * @param {Object} neoDriver - Neo4j driver
 * @param {Object} paymentResponse - Payment response data
 * @returns {Object} - Neo4j result
 */
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
    console.log('Credit churches response:', response)

    return neoRes
  } catch (error) {
    console.error('There was an error crediting churches', error)
  } finally {
    await session.close()
  }

  return null
}

/**
 * Handles the Paystack webhook request
 * @param {Object} event - Lambda event
 * @param {Object} neoDriver - Neo4j driver
 * @returns {Object} - Transaction result
 */
const handlePaystackReq = async (event, neoDriver) => {
  if (!whitelistIPs(event)) {
    throw new Error('IP not whitelisted')
  }

  const parsedBody =
    typeof event.body === 'string' ? JSON.parse(event.body) : event.body
  const { reference, status } = parsedBody.data

  const neoRes = await executeQuery(neoDriver, { reference, status })

  const categories = neoRes?.records[0]?.get('record')?.labels
  if (!categories) console.log('No categories found in response:', neoRes)

  console.log('Categories:', categories)

  if (categories?.includes('CreditTransaction')) {
    await executeCreditChurchesQuery(neoDriver, { reference })
  }
  if (categories?.includes('Offering')) {
    await db
      .collection('offerings')
      .doc(reference)
      .update({ transactionStatus: status })
  }
  if (categories?.includes('Tithe')) {
    await db
      .collection('tithes')
      .doc(reference)
      .update({ transactionStatus: status })
  }
  if (categories?.includes('BENMP')) {
    await db
      .collection('benmp')
      .doc(reference)
      .update({ transactionStatus: status })
  }

  return neoRes?.records[0]?.get('record')?.properties
}

/**
 * AWS Lambda handler function
 * This function is the entry point for AWS Lambda
 */
exports.handler = async (event, context) => {
  console.log('Payment webhook Lambda function invoked', {
    path: event.path,
    httpMethod: event.httpMethod,
  })

  try {
    // Load secrets
    const SECRETS = await loadSecrets()

    // Configure encrypted connection if required
    const uri =
      SECRETS.NEO4J_ENCRYPTED === 'true'
        ? SECRETS.NEO4J_URI.replace('bolt://', 'neo4j+s://')
        : SECRETS.NEO4J_URI

    console.log(
      `[Neo4j] Connecting to ${uri.replace(/:\/\/.*@/, '://[REDACTED]@')}`
    )

    // Create Neo4j driver
    const driver = neo4j.driver(
      uri,
      neo4j.auth.basic(SECRETS.NEO4J_USER, SECRETS.NEO4J_PASSWORD),
      {
        maxConnectionPoolSize: 10,
        connectionTimeout: 30000,
      }
    )

    // Verify connection
    await driver.verifyConnectivity()
    console.log('[Neo4j] Connection established successfully')

    // Process payment webhook
    const result = await handlePaystackReq(event, driver)

    // Close the driver when done
    await driver.close()

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Webhook processed successfully',
        result,
      }),
    }
  } catch (error) {
    console.error('Error in payment-webhook Lambda function:', error)

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Error processing payment webhook',
        error: error.message,
      }),
    }
  }
}
