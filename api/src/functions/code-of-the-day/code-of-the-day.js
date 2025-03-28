const neo4j = require('neo4j-driver')
const { schedule } = require('@netlify/functions')
const { default: axios } = require('axios')
const { loadSecrets } = require('./secrets.js')

const SECRETS = loadSecrets()

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
    await session.executeWrite(async (tx) => {
      console.log('Setting code of the day')

      const pad = (n) => (n < 10 ? `0${n}` : n)

      const today = new Date()
      const day = today.getDate()
      const month = today.getMonth() + 1
      const year = today.getFullYear()
      const date = `${year}-${pad(month)}-${pad(day)}`

      const code = codeOfTheDay.filter((item) => item.date === date).pop()

      const res = await axios({
        method: 'get',
        url: 'https://random-word-api.herokuapp.com/word',
      })

      const dictionaryCode = res.data[0].toUpperCase()

      console.log('code', code?.code ?? dictionaryCode)

      return tx.run(setCodeOfTheDay, {
        code: code?.code ?? dictionaryCode,
      })
    })
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
// This module can be used to serve the GraphQL endpoint
// as a lambda function

// This module is copied during the build step
// Be sure to run `npm run build`

const handler = async () => {
  const driver = neo4j.driver(
    SECRETS.NEO4J_URI || 'bolt://localhost:7687',
    neo4j.auth.basic(
      SECRETS.NEO4J_USER || 'neo4j',
      SECRETS.NEO4J_PASSWORD || 'neo4j'
    )
  )

  const init = async (neoDriver) => initializeDatabase(neoDriver)

  /*
   * We catch any errors that occur during initialization
   * to handle cases where we still want the API to start
   * regardless, such as running with a read only user.
   * In this case, ensure that any desired initialization steps
   * have occurred
   */

  await init(driver).catch((error) => {
    throw new Error(
      `Database initialization failed\n${error.message}\n${error.stack}`
    )
  })

  return {
    statusCode: 200,
  }
}

module.exports.handler = schedule('30 00 * * *', handler)
