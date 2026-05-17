const crypto = require('crypto')
const neo4j = require('neo4j-driver')
const { db } = require('./firebase')
const { loadSecrets } = require('./secrets')

class UnauthorizedWebhookError extends Error {
  constructor(message) {
    super(message)
    this.name = 'UnauthorizedWebhookError'
  }
}

const SHA512_HEX_LENGTH = 128

const lowercaseHeaders = (event) =>
  Object.fromEntries(
    Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  )

// Paystack signs the exact bytes they sent. If API Gateway is ever
// reconfigured to parse the body or forward it base64-encoded, the bytes
// Paystack signed against will no longer match — handle base64, but reject
// non-string bodies rather than try to reconstruct them via JSON.stringify.
const getRawBody = (event) => {
  if (event.isBase64Encoded && typeof event.body === 'string') {
    return Buffer.from(event.body, 'base64').toString('utf8')
  }
  if (typeof event.body !== 'string') return null
  return event.body
}

/**
 * Verifies the Paystack HMAC-SHA512 signature on the raw request body.
 * Paystack signs every webhook with our secret key; this is their primary
 * authentication mechanism (IP whitelisting is documented as defence-in-depth).
 */
const verifyPaystackSignature = (event, secret) => {
  if (!secret) return false

  const signature = lowercaseHeaders(event)['x-paystack-signature']
  if (
    typeof signature !== 'string' ||
    signature.length !== SHA512_HEX_LENGTH ||
    !/^[a-f0-9]+$/i.test(signature)
  ) {
    return false
  }

  const rawBody = getRawBody(event)
  if (rawBody === null) return false

  // The merchant API key is stored as 'Bearer sk_*' for axios; HMAC needs the raw key.
  const hmacKey = secret.replace(/^Bearer\s+/i, '')
  const expected = crypto
    .createHmac('sha512', hmacKey)
    .update(rawBody)
    .digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expected, 'hex')
  )
}

// Paystack's published webhook source IPs.
// Source: https://paystack.com/docs/payments/webhooks#ip-whitelisting
// Last verified: 2026-05-11. Re-verify quarterly or when a webhook delivery
// failure is reported with a `Bad IP:` log line for an unfamiliar source.
const PAYSTACK_WEBHOOK_IPS = ['52.31.139.75', '52.49.173.169', '52.214.14.220']

const whitelistIPs = (event) => {
  const validIps = PAYSTACK_WEBHOOK_IPS
  const sourceIp = event.requestContext?.identity?.sourceIp

  if (!sourceIp) {
    console.error('Bad IP: source IP missing from requestContext')
    return false
  }
  if (validIps.includes(sourceIp)) {
    console.log('IP OK:', sourceIp)
    return true
  }
  console.error(`Bad IP: ${sourceIp}`)
  return false
}

// SM1 guard: 'success' is terminal; only flip rows still mid-flow. We accept
// 'send OTP' as a source as well as 'pending' so a webhook that lands before
// the OTP-submission write hits Neo4j is not lost. UNION subqueries let each
// label leg use its own unique index on transactionReference.
//
// ServiceRecord transitions also append a BankingHistoryLog audit row for
// the webhook-driven settlement. Transaction and RehearsalRecord legs skip
// the audit (no banking-history semantics on those types) via the FOREACH-
// on-label trick. The pre-SET WITH captures the record's transactionStatus
// into bh_fromStatus so the audit row records the actual prior state
// ('pending' vs 'send OTP') rather than always-null.
const updateTransactionStatusCypher = `
  CALL {
    MATCH (r:ServiceRecord {transactionReference: $reference})
    WHERE r.transactionStatus IN ['pending', 'send OTP']
    RETURN r
    UNION
    MATCH (r:Transaction {transactionReference: $reference})
    WHERE r.transactionStatus IN ['pending', 'send OTP']
    RETURN r
    UNION
    MATCH (r:RehearsalRecord {transactionReference: $reference})
    WHERE r.transactionStatus IN ['pending', 'send OTP']
    RETURN r
  }
  WITH r, r.transactionStatus AS bh_fromStatus
  SET r.transactionStatus = $status

  WITH r, bh_fromStatus
  FOREACH (_ IN CASE WHEN r:ServiceRecord THEN [1] ELSE [] END |
    CREATE (r)-[:HAS_BANKING_HISTORY]->(:BankingHistoryLog {
      id: randomUUID(),
      method: 'webhook',
      fromStatus: bh_fromStatus,
      toStatus: $status,
      message: 'Paystack webhook settled ' + $status,
      ts: datetime()
    })
  )
  RETURN r AS record
`

const executeQuery = async (neoDriver, paymentResponse) => {
  const { reference, status } = paymentResponse

  if (!['success', 'failed'].includes(status)) {
    console.log(`Ignoring non-terminal Paystack status: ${status}`)
    return null
  }

  const session = neoDriver.session()
  try {
    const neoRes = await session.executeWrite((tx) =>
      tx.run(updateTransactionStatusCypher, { reference, status })
    )
    if (neoRes.records.length === 0) {
      console.warn(
        `No row updated for ${reference} → ${status} (duplicate event or wrong state)`
      )
    } else {
      console.log(`Updated transaction ${reference} to ${status}`)
    }
    return neoRes
  } finally {
    await session.close()
  }
}

const handlePaystackReq = async (event, neoDriver, secrets) => {
  // Paystack signs webhooks with the merchant secret key (sk_*); there is no
  // separate webhook secret in Paystack's model. We read PAYSTACK_WEBHOOK_SECRET
  // first so a future Paystack feature, or a manual independent rotation, can
  // diverge from the API auth key without a code change. Falls back to
  // PAYSTACK_PRIVATE_KEY_WEEKDAY today so the two names resolve to the same value.
  const usingDedicatedWebhookSecret = Boolean(secrets.PAYSTACK_WEBHOOK_SECRET)
  const webhookSecret =
    secrets.PAYSTACK_WEBHOOK_SECRET || secrets.PAYSTACK_PRIVATE_KEY_WEEKDAY

  // Log which secret name resolved (never the value) so that during a
  // rotation an operator can tell at a glance whether the override took.
  console.log(
    `[webhook] signing secret source: ${
      usingDedicatedWebhookSecret
        ? 'PAYSTACK_WEBHOOK_SECRET'
        : 'PAYSTACK_PRIVATE_KEY_WEEKDAY (fallback)'
    }`
  )

  if (!verifyPaystackSignature(event, webhookSecret)) {
    throw new UnauthorizedWebhookError('Invalid or missing Paystack signature')
  }
  if (!whitelistIPs(event)) {
    throw new UnauthorizedWebhookError('IP not whitelisted')
  }

  const parsedBody =
    typeof event.body === 'string' ? JSON.parse(event.body) : event.body
  const { reference, status } = parsedBody.data

  const neoRes = await executeQuery(neoDriver, { reference, status })

  // Mirror only when Neo4j actually transitioned a row — otherwise this is a
  // duplicate/late event and writing to Firebase would re-open a settled doc.
  if (!neoRes?.records?.length) {
    return null
  }

  const categories = neoRes.records[0].get('record').labels
  console.log('Categories:', categories)

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

  return neoRes.records[0].get('record').properties
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

    let result
    try {
      result = await handlePaystackReq(event, driver, SECRETS)
    } finally {
      await driver.close()
    }

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

    if (error instanceof UnauthorizedWebhookError) {
      return {
        statusCode: 401,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Unauthorized' }),
      }
    }

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Error processing payment webhook',
        error: 'Internal error',
      }),
    }
  }
}
