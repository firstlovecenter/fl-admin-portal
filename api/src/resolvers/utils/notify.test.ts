/**
 * SYN-242 — SMS recipient normalisation in sendBulkSMS.
 *
 * SendMobileVerificationNumber failed with "Notification sending failed:
 * status 502" because the momo number reached the notify service in local
 * `0XXXXXXXXX` form. sendBulkSMS now normalises every recipient to the
 * `233XXXXXXXXX` form the scheduled SMS jobs already send.
 *
 * The Lambda client and secrets are mocked; the test reads back the event
 * sendBulkSMS hands to InvokeCommand and asserts on its `recipient` list.
 * Numbers below are synthetic.
 */

const mockSend = jest.fn()

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn().mockImplementation(() => ({
    send: (...args: unknown[]) => mockSend(...args),
  })),
  InvokeCommand: jest.fn().mockImplementation((input) => ({ input })),
}))

const mockLoadSecrets = jest.fn()
jest.mock('../secrets', () => ({
  loadSecrets: () => mockLoadSecrets(),
}))

import { sendBulkSMS, toSmsRecipient } from './notify'

const okResponse = (statusCode = 200) => ({
  StatusCode: 200,
  Payload: new TextEncoder().encode(JSON.stringify({ statusCode })),
})

const sentSmsBody = () => {
  const command = mockSend.mock.calls[0][0]
  const event = JSON.parse(command.input.Payload)
  return { event, body: JSON.parse(event.body) }
}

beforeEach(() => {
  mockSend.mockReset()
  mockLoadSecrets.mockResolvedValue({
    ENVIRONMENT: 'production',
    FLC_NOTIFY_KEY: 'jest_notify_key',
  })
  jest.spyOn(console, 'log').mockImplementation(() => undefined)
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
  jest.spyOn(console, 'warn').mockImplementation(() => undefined)
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('SYN-242: toSmsRecipient', () => {
  it.each([
    ['local 10-digit momo number', '0241234567', '233241234567'],
    ['local number missing its leading 0', '241234567', '233241234567'],
    ['already international', '233241234567', '233241234567'],
    ['plus-prefixed international', '+233241234567', '233241234567'],
    ['spaced and dashed', '+233 24-123 4567', '233241234567'],
    ['foreign number keeps its country code', '+447700900123', '447700900123'],
  ])('%s', (_label, input, expected) => {
    expect(toSmsRecipient(input)).toBe(expected)
  })

  it('returns an empty string for blank input', () => {
    expect(toSmsRecipient('')).toBe('')
    expect(toSmsRecipient(null)).toBe('')
    expect(toSmsRecipient(undefined)).toBe('')
  })
})

describe('SYN-242: sendBulkSMS', () => {
  it('sends a local momo number to /send-sms in 233 form', async () => {
    mockSend.mockResolvedValue(okResponse())

    await expect(sendBulkSMS(['0241234567'], 'Your OTP is 1234')).resolves.toBe(
      'Message sent successfully'
    )

    const { event, body } = sentSmsBody()
    expect(event.path).toBe('/send-sms')
    expect(body.recipient).toEqual(['233241234567'])
    expect(body.sender).toBe('FLC Admin')
  })

  it('drops blank recipients and keeps the rest', async () => {
    mockSend.mockResolvedValue(okResponse())

    await sendBulkSMS(['', '0201234567'], 'hi')

    expect(sentSmsBody().body.recipient).toEqual(['233201234567'])
  })

  it('throws without calling the service when no recipient is usable', async () => {
    await expect(sendBulkSMS([''], 'hi')).rejects.toThrow(
      'No valid SMS recipient phone number'
    )
    expect(mockSend).not.toHaveBeenCalled()
  })

  it('normalises the dev TEST_PHONE_NUMBER override too', async () => {
    mockLoadSecrets.mockResolvedValue({
      ENVIRONMENT: 'development',
      FLC_NOTIFY_KEY: 'jest_notify_key',
      TEST_PHONE_NUMBER: '0551234567',
    })
    mockSend.mockResolvedValue(okResponse())

    await sendBulkSMS(['0241234567'], 'hi')

    expect(sentSmsBody().body.recipient).toEqual(['233551234567'])
  })

  it('still surfaces a service failure as an error', async () => {
    mockSend.mockResolvedValue(okResponse(502))

    await expect(sendBulkSMS(['0241234567'], 'hi')).rejects.toThrow(
      'Error sending notification via Lambda'
    )
  })
})
