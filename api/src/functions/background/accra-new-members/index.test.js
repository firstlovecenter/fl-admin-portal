/**
 * Tests for the accra-new-members background Lambda handler.
 *
 * SYN-286: the handler used to load getSecrets from
 * '../den-office-monthly-report/gsecrets.js'. Each background folder is
 * deployed as its own Lambda zip, so that path does not exist at runtime and
 * the function died at cold start with Runtime.ImportModuleError. These tests
 * pin the handler to its own './gsecrets.js' — the mock below only takes
 * effect if index.js requires that exact module.
 */

jest.mock('neo4j-driver', () => ({
  driver: jest.fn(() => ({
    verifyConnectivity: jest.fn(async () => {}),
    close: jest.fn(async () => {}),
  })),
  auth: { basic: jest.fn(() => ({})) },
}))

// index.js destructures `default` from the axios module.
jest.mock('axios', () => ({
  default: jest.fn(async () => ({ data: { message: 'ok' } })),
}))

jest.mock('./gsecrets.js', () => ({
  getSecrets: jest.fn(async () => ({
    NEO4J_URI: 'bolt://localhost:7687',
    NEO4J_USER: 'neo4j',
    NEO4J_PASSWORD: 'neo4j',
    FLC_NOTIFY_KEY: 'test-notify-key',
  })),
}))

jest.mock('./utils/writeToGSheet.js', () => ({
  clearGSheet: jest.fn(async () => {}),
  writeToGsheet: jest.fn(async () => {}),
}))

jest.mock('./query-exec/newMembersList.js', () => ({
  newMembersList: jest.fn(async () => [['Name', 'Bacenta']]),
}))

const { default: axios } = require('axios')
const { getSecrets } = require('./gsecrets.js')
const { clearGSheet, writeToGsheet } = require('./utils/writeToGSheet.js')
const { handler } = require('./index.js')

describe('accra-new-members handler', () => {
  it('loads secrets from its own gsecrets.js and completes the run', async () => {
    const result = await handler({})

    expect(result.statusCode).toBe(200)
    expect(getSecrets).toHaveBeenCalledTimes(1)
    expect(clearGSheet).toHaveBeenCalledWith('New Members')
    expect(writeToGsheet).toHaveBeenCalledWith(
      [['Name', 'Bacenta']],
      'New Members',
      'A1:L'
    )

    const smsCall = axios.mock.calls
      .map(([config]) => config)
      .find((config) => config.url === '/send-sms')
    expect(smsCall.headers['x-secret-key']).toBe('test-notify-key')
  })

  it('returns a 500 instead of crashing when secrets cannot be loaded', async () => {
    getSecrets.mockRejectedValueOnce(new Error('secrets unavailable'))
    jest.spyOn(console, 'error').mockImplementation(() => {})

    const result = await handler({})

    expect(result.statusCode).toBe(500)
    expect(JSON.parse(result.body).error).toBe('secrets unavailable')
    expect(writeToGsheet).not.toHaveBeenCalled()
  })
})
