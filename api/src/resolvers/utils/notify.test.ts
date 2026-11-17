/* eslint-disable import/first -- jest.mock() must precede the imports it
   targets so babel-jest hoists mocks before module resolution. */
const mockSend = jest.fn()

jest.mock('@aws-sdk/client-lambda', () => ({
  LambdaClient: jest.fn().mockImplementation(() => ({
    send: (...args: unknown[]) => mockSend(...args),
  })),
  InvokeCommand: jest.fn().mockImplementation((input) => input),
}))

jest.mock('../secrets', () => ({
  loadSecrets: jest.fn().mockResolvedValue({
    ENVIRONMENT: 'production',
    FLC_NOTIFY_KEY: 'notify-secret-key-value',
  }),
}))

import { sendBulkSMS } from './notify'

const lambdaResponse = (statusCode: number) => ({
  StatusCode: 200,
  Payload: new TextEncoder().encode(JSON.stringify({ statusCode })),
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
