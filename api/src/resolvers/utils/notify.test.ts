/* eslint-disable import/first -- jest.mock() must precede the imports it
   targets so babel-jest hoists mocks before module resolution. */
const mockSend = jest.fn()

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn().mockImplementation(() => ({
    send: (...args: unknown[]) => mockSend(...args),
  })),
  InvokeCommand: jest.fn().mockImplementation((input) => input),
}))

// Read through mockLoadSecrets so SYN-242's TEST_PHONE_NUMBER test can switch
// to the development secrets; the beforeEach below puts production back, so
// no test inherits another's environment.
const mockLoadSecrets = jest.fn()
jest.mock('../secrets', () => ({
  loadSecrets: () => mockLoadSecrets(),
}))

import { sendBulkSMS, toSmsRecipient } from './notify'

const lambdaResponse = (statusCode: number) => ({
  StatusCode: 200,
  Payload: new TextEncoder().encode(JSON.stringify({ statusCode })),
})

beforeEach(() => {
  mockLoadSecrets.mockResolvedValue({
    ENVIRONMENT: 'production',
    FLC_NOTIFY_KEY: 'notify-secret-key-value',
  })
})

/**
 * SYN-253 — one SMS failure used to be logged at every layer it passed
 * through (notify twice, throwToSentry twice, then the GraphQL logger).
 * notify now only rethrows; the single ERROR line is written where the
 * failure is handled. The user-facing message is unchanged.
 */
describe('sendBulkSMS failure logging (SYN-253)', () => {
  let errorSpy: jest.SpyInstance
  let logSpy: jest.SpyInstance

  beforeEach(() => {
    mockSend.mockReset()
    errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    logSpy = jest.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    errorSpy.mockRestore()
    logSpy.mockRestore()
  })

  it('SYN-253: rethrows a provider rejection with the same message and logs no error', async () => {
    mockSend.mockResolvedValue(lambdaResponse(402))

    const error = await sendBulkSMS(['0200000000'], 'hi').catch(
      (e: unknown) => e
    )

    expect((error as Error).message).toBe(
      'Error sending notification via Lambda: Notification sending failed: status 402'
    )
    expect((error as Error & { cause?: Error }).cause?.message).toBe(
      'Notification sending failed: status 402'
    )
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('SYN-253: rethrows an invoke failure without logging it', async () => {
    mockSend.mockRejectedValue(new Error('Rate exceeded'))

    await expect(sendBulkSMS(['0200000000'], 'hi')).rejects.toThrow(
      'Error sending notification via Lambda: Rate exceeded'
    )
    expect(errorSpy).not.toHaveBeenCalled()
  })

  it('does not log any part of the notification secret key', async () => {
    mockSend.mockResolvedValue(lambdaResponse(200))

    await expect(sendBulkSMS(['0200000000'], 'hi')).resolves.toBe(
      'Message sent successfully'
    )
    const logged = JSON.stringify(logSpy.mock.calls)
    expect(logged).not.toContain('notify-secr')
  })
})

/**
 * SYN-242 — SMS recipient normalisation in sendBulkSMS.
 *
 * SendMobileVerificationNumber failed with "Notification sending failed:
 * status 502" because the momo number reached the notify service in local
 * `0XXXXXXXXX` form. sendBulkSMS now normalises every recipient to the
 * `233XXXXXXXXX` form the scheduled SMS jobs already send.
 *
 * The tests read back the event sendBulkSMS hands to InvokeCommand and assert
 * on its `recipient` list. Numbers below are synthetic.
 */
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
  const sentSmsBody = () => {
    const event = JSON.parse(mockSend.mock.calls[0][0].Payload)
    return { event, body: JSON.parse(event.body) }
  }

  beforeEach(() => {
    mockSend.mockReset()
    jest.spyOn(console, 'log').mockImplementation(() => undefined)
    jest.spyOn(console, 'error').mockImplementation(() => undefined)
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends a local momo number to /send-sms in 233 form', async () => {
    mockSend.mockResolvedValue(lambdaResponse(200))

    await expect(sendBulkSMS(['0241234567'], 'Your OTP is 1234')).resolves.toBe(
      'Message sent successfully'
    )

    const { event, body } = sentSmsBody()
    expect(event.path).toBe('/send-sms')
    expect(body.recipient).toEqual(['233241234567'])
    expect(body.sender).toBe('FLC Admin')
  })

  it('drops blank recipients and keeps the rest', async () => {
    mockSend.mockResolvedValue(lambdaResponse(200))

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
      FLC_NOTIFY_KEY: 'notify-secret-key-value',
      TEST_PHONE_NUMBER: '0551234567',
    })
    mockSend.mockResolvedValue(lambdaResponse(200))

    await sendBulkSMS(['0241234567'], 'hi')

    expect(sentSmsBody().body.recipient).toEqual(['233551234567'])
  })

  it('still surfaces a service failure as an error', async () => {
    mockSend.mockResolvedValue(lambdaResponse(502))

    await expect(sendBulkSMS(['0241234567'], 'hi')).rejects.toThrow(
      'Error sending notification via Lambda'
    )
  })
})
