const neo4j = require('neo4j-driver')
const { schedule } = require('@netlify/functions')
const { default: axios } = require('axios')
const fs = require('fs')
const path = require('path')
const { loadSecrets } = require('./secrets.js')

const SECRETS = loadSecrets()

const setCodeOfTheDay = `
 MATCH (arr:ArrivalsCodeOfTheDay)
  SET arr.code = $code
 RETURN arr.code
`

const executeQuery = async (neoDriver) => {
  const session = neoDriver.session()

  try {
    // Load codes data from JSON file
    const codesDataPath = path.join(__dirname, 'codes-data.json')
    const codesData = JSON.parse(fs.readFileSync(codesDataPath, 'utf8'))

    await session.executeWrite(async (tx) => {
      console.log('Setting code of the day')

      const pad = (n) => (n < 10 ? `0${n}` : n)

      const today = new Date()
      const day = today.getDate()
      const month = today.getMonth() + 1
      const year = today.getFullYear()
      const date = `${year}-${pad(month)}-${pad(day)}`

      // Try to find a predefined code for today's date
      const codeForToday = codesData.dailyCodes.find(
        (item) => item.date === date
      )
      let finalCode

      if (codeForToday) {
        // We have a predefined code for this date
        finalCode = codeForToday.code
      } else {
        // Check if today is Saturday or Sunday
        const dayOfWeek = today.getDay()
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          // For weekends without predefined code, use a random one from weekDayCodes array
          const randomIndex = Math.floor(
            Math.random() * codesData.weekDayCodes.length
          )
          finalCode = codesData.weekDayCodes[randomIndex]
        } else {
          // For weekdays or if no specific code is found, fetch from random word API
          try {
            const res = await axios({
              method: 'get',
              url: 'https://random-word-api.herokuapp.com/word',
            })
            finalCode = res.data[0].toUpperCase()
          } catch (error) {
            console.error('Error fetching random word, using fallback', error)
            // Fallback to a random word from our list if API fails
            const randomIndex = Math.floor(
              Math.random() * codesData.weekDayCodes.length
            )
            finalCode = codesData.weekDayCodes[randomIndex]
          }
        }
      }

      console.log('Setting code of the day to:', finalCode)

      return tx.run(setCodeOfTheDay, {
        code: finalCode,
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
