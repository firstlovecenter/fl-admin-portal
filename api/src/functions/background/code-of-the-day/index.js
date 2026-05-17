const neo4j = require('neo4j-driver')
const { default: axios } = require('axios')
const { loadSecrets } = require('./secrets')
const { CODE_WORDS } = require('./codeWords')

// Used by the date-pinned and heroku-fallback branches. Those picks are
// out-of-rotation and deliberately do NOT consume from the curated cycle
// pool, so this query touches `code` only.
const setCodeOfTheDay = `
 MATCH (arr:ArrivalsCodeOfTheDay)
  SET arr.code = $code
 RETURN arr.code
`

// Curated-list branch — atomic single-statement read-pick-append so a
// concurrent `SetCodeOfTheDay` mutation can't race with the Lambda's
// usedWords update (the previous read-then-write split could lose a
// manual mark-as-used). Filters $candidates by what's already in
// arr.usedWords, draws a random word from the remainder, resets to a
// single-element list when the cycle is exhausted, and atomically
// commits both arr.code and arr.usedWords.
const pickAndAppendUsed = `
 MATCH (arr:ArrivalsCodeOfTheDay)
 WITH arr, coalesce(arr.usedWords, []) AS used
 WITH arr, used,
      [w IN $candidates WHERE NOT w IN used] AS available
 WITH arr, used,
      CASE WHEN size(available) = 0 THEN $candidates ELSE available END AS pool,
      size(available) = 0 AS cycleReset
 WITH arr, used, cycleReset,
      pool[toInteger(rand() * size(pool))] AS chosen
 SET arr.code = chosen,
     arr.usedWords = CASE WHEN cycleReset THEN [chosen] ELSE used + chosen END
 RETURN chosen AS code, cycleReset AS cycleReset
`

const executeQuery = async (neoDriver) => {
  const session = neoDriver.session()

  const codeOfTheDay = [
    {
      date: '2024-09-01',
      code: 'Abundance',
    },
    {
      date: '2024-09-08',
      code: 'Increase',
    },
    {
      date: '2024-09-15',
      code: 'Growth',
    },
    {
      date: '2024-09-22',
      code: 'Enlarge',
    },
    {
      date: '2024-09-29',
      code: 'Flourish',
    },
  ]

  try {
    console.log('Setting code of the day for date ', new Date())

    const pad = (n) => (n < 10 ? `0${n}` : n)

    const today = new Date()
    const day = today.getDate()
    const month = today.getMonth() + 1
    const year = today.getFullYear()
    const date = `${year}-${pad(month)}-${pad(day)}`

    const dateMatch = codeOfTheDay.filter((item) => item.date === date).pop()

    // Three branches with different write paths:
    //   1. Date-pinned → use the pinned word, simple SET (no cycle update).
    //   2. Curated list → atomic Cypher does the filter + pick + append.
    //   3. Heroku fallback → external random-word API, simple SET. Picked
    //      OUTSIDE the write tx so a slow upstream can't hold the tx open.
    // Branches 1 and 3 deliberately bypass the curated cycle pool because
    // those words aren't part of the rotation.
    let chosenCode

    if (dateMatch?.code) {
      chosenCode = dateMatch.code
      await session.executeWrite((tx) =>
        tx.run(setCodeOfTheDay, { code: chosenCode })
      )
    } else if (CODE_WORDS.length > 0) {
      const writeRes = await session.executeWrite((tx) =>
        tx.run(pickAndAppendUsed, { candidates: CODE_WORDS })
      )
      const record = writeRes.records[0]
      chosenCode = record?.get('code')
      if (record?.get('cycleReset')) {
        console.log('Curated cycle exhausted — resetting usedWords')
      }
    } else {
      console.warn(
        'Curated word list is empty, falling back to random-word-api'
      )
      const res = await axios({
        method: 'get',
        url: 'https://random-word-api.herokuapp.com/word',
      })
      // Match the natural mixed case of the curated list so downstream
      // consumers see consistent shape regardless of which branch wins.
      ;[chosenCode] = res.data
      await session.executeWrite((tx) =>
        tx.run(setCodeOfTheDay, { code: chosenCode })
      )
    }

    console.log('code', chosenCode)
  } catch (error) {
    console.error('Error setting code of the day', error)
  } finally {
    await session.close()
  }
}

const initializeDatabase = (driver) => {
  return executeQuery(driver).catch((error) => {
    console.error('Database query failed to complete\n', error.message)
  })
}

/**
 * AWS Lambda handler for setting the code of the day
 * This function is designed to be triggered by CloudWatch Events/EventBridge
 * Schedule: Runs daily at 00:30 UTC
 */
exports.handler = async (event, context) => {
  console.log('Code of the day Lambda function invoked', { event })

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

    // Initialize database (set code of the day)
    await initializeDatabase(driver)

    // Close the driver when done
    await driver.close()

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Code of the day set successfully' }),
    }
  } catch (error) {
    console.error('Error in code-of-the-day Lambda function:', error)

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error setting code of the day',
        error: error.message,
      }),
    }
  }
}
