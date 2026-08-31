/**
 * Tests for the outside-accra-weekly background Lambda handler.
 *
 * Focus: the notification recipients wired into the handler.
 * - SMS goes to ['233248846233', '233263995059']
 *   (233592219407 was removed).
 * - Email goes only to ['charajoy64@gmail.com']
 *   (flcexpense22@gmail.com was removed).
 *
 * All heavy dependencies (neo4j-driver, Google Sheets writer, secrets
 * loader, query-exec modules) are mocked so the real handler code path
 * runs end-to-end and we can assert on the axios POST payloads sent to
 * the notify service.
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
  clearGSheetRange: jest.fn(async () => {}),
  writeToGsheet: jest.fn(async () => {}),
}))

jest.mock('./query-exec/campusList.js', () => ({
  campusList: jest.fn(async () => [
    ['Campus', 'Leader', 'Admin', 'Contact'],
    ['Kumasi', 'Leader A', 'Admin A', '0240000000'],
  ]),
}))
jest.mock('./query-exec/campusAttendanceIncome.js', () =>
  jest.fn(async () => [['Attendance', 'Income']])
)
jest.mock('./query-exec/campusBankedIncome.js', () =>
  jest.fn(async () => [['Banked']])
)
jest.mock('./query-exec/campusNotBankedIncome.js', () =>
  jest.fn(async () => [['Not Banked']])
)
jest.mock('./query-exec/fellowshipAttendanceIncome.js', () =>
  jest.fn(async () => [['Fellowship Attendance', 'Fellowship Income']])
)
jest.mock('./query-exec/weekdayBankedIncome.js', () =>
  jest.fn(async () => [['Weekday Banked']])
)
jest.mock('./query-exec/weekdayNotBankedIncome.js', () =>
  jest.fn(async () => [['Weekday Not Banked']])
)

const { default: axios } = require('axios')
const { handler, fellowshipHandler } = require('./index.js')

// Wednesday — auto-detects to 'combined' mode. Fixed date so the test
// never depends on wall-clock time.
const WEDNESDAY_EVENT = { date: '2026-07-15' }

const findAxiosCall = (url) =>
  axios.mock.calls.map(([config]) => config).find((config) => config.url === url)

describe('outside-accra-weekly handler notifications', () => {
  it('sends the SMS notification to the current recipient list only', async () => {
    const result = await handler(WEDNESDAY_EVENT)

    expect(result.statusCode).toBe(200)

    const smsCall = findAxiosCall('/send-sms')
    expect(smsCall).toBeDefined()
    expect(smsCall.method).toBe('post')
    expect(smsCall.baseURL).toBe('https://api-notify.firstlovecenter.com')
    expect(smsCall.headers['x-secret-key']).toBe('test-notify-key')

    // Exact recipient list — order-sensitive on purpose so any drift shows up.
    expect(smsCall.data.recipient).toEqual(['233248846233', '233263995059'])
    // The removed number must not sneak back in.
    expect(smsCall.data.recipient).not.toContain('233592219407')
  })

  it('sends the email notification only to charajoy64@gmail.com', async () => {
    const result = await handler(WEDNESDAY_EVENT)

    expect(result.statusCode).toBe(200)

    const emailCall = findAxiosCall('/send-email')
    expect(emailCall).toBeDefined()
    expect(emailCall.method).toBe('post')
    expect(emailCall.baseURL).toBe('https://api-notify.firstlovecenter.com')
    expect(emailCall.headers['x-secret-key']).toBe('test-notify-key')

    expect(emailCall.data.to).toEqual(['charajoy64@gmail.com'])
    // The removed address must not sneak back in.
    expect(emailCall.data.to).not.toContain('flcexpense22@gmail.com')
  })

  it('uses the same recipients for the fellowship-mode handler', async () => {
    // The recipient lists are shared by every mode; this guards the
    // mode-specific Lambda entry point against a divergent copy appearing.
    const result = await fellowshipHandler(WEDNESDAY_EVENT)

    expect(result.statusCode).toBe(200)
    expect(findAxiosCall('/send-sms').data.recipient).toEqual([
      '233248846233',
      '233263995059',
    ])
    expect(findAxiosCall('/send-email').data.to).toEqual([
      'charajoy64@gmail.com',
    ])
  })
})
