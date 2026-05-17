const neo4j = require('neo4j-driver')
const { default: axios } = require('axios')
const { loadSecrets } = require('./secrets')
const { CODE_WORDS } = require('./codeWords')

const setCodeOfTheDay = `
 MATCH (arr:ArrivalsCodeOfTheDay)
  SET arr.code = $code
 RETURN arr.code
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

    // Pick the code BEFORE opening the write transaction so a slow
    // axios fallback can't hold a Neo4j write tx open. Date-pinned
    // codes win; otherwise pick from the curated list; otherwise fall
    // back to the random-word API.
    let chosenCode
    if (dateMatch?.code) {
      chosenCode = dateMatch.code
    } else if (CODE_WORDS.length > 0) {
      chosenCode = CODE_WORDS[Math.floor(Math.random() * CODE_WORDS.length)]
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
    }

    console.log('code', chosenCode)

    await session.executeWrite((tx) =>
      tx.run(setCodeOfTheDay, { code: chosenCode })
    )
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
