/**
 * SYN-242 — SendMobileVerificationNumber validates the momo number before
 * sending the OTP SMS, so a malformed number is a clear user error rather
 * than a 502 from the notification service. Numbers below are synthetic.
 */

jest.mock('../secrets', () => ({
  loadSecrets: jest.fn().mockResolvedValue({ ENVIRONMENT: 'development' }),
}))

jest.mock('../utils/notify', () => ({
  sendBulkSMS: jest.fn().mockResolvedValue('Message sent successfully'),
  joinMessageStrings: (parts: string[]) => parts.join(''),
}))

jest.mock('../services/service-resolvers', () => ({
  checkServantHasCurrentHistory: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../directory/make-remove-servants', () => ({
  MakeServant: jest.fn(),
  RemoveServant: jest.fn(),
}))

jest.mock('axios', () => jest.fn())

import { arrivalsMutation } from './arrivals-resolvers'
import { sendBulkSMS } from '../utils/notify'
import type { Context } from '../utils/neo4j-types'

const context = { jwt: { roles: ['leaderBacenta'] } } as unknown as Context

const send = (phoneNumber: string, ctx: Context = context) =>
  arrivalsMutation.SendMobileVerificationNumber(
    {},
    { firstName: 'Ama', phoneNumber, otp: '1234' },
    ctx
  )

beforeEach(() => {
  ;(sendBulkSMS as jest.Mock).mockClear()
})

describe('SYN-242: SendMobileVerificationNumber', () => {
  it('sends the OTP for a valid local momo number', async () => {
    await expect(send('0241234567')).resolves.toBe('Message sent successfully')

    expect(sendBulkSMS).toHaveBeenCalledTimes(1)
    const [recipients, message] = (sendBulkSMS as jest.Mock).mock.calls[0]
    expect(recipients).toEqual(['0241234567'])
    expect(message).toContain('Your OTP is 1234')
  })

  it.each([
    ['too short', '024123'],
    ['letters', '02412345ab'],
    ['international form the form never produces', '+233241234567'],
    ['10-digit number with no leading 0', '2412345678'],
    ['number starting 00', '0012345678'],
    ['empty', ''],
  ])('rejects a %s number without sending', async (_label, phoneNumber) => {
    await expect(send(phoneNumber)).rejects.toMatchObject({
      message: expect.stringContaining('Enter a valid mobile money number'),
      extensions: { code: 'BAD_USER_INPUT' },
    })
    expect(sendBulkSMS).not.toHaveBeenCalled()
  })

  it('checks the role before validating the number', async () => {
    const noRole = { jwt: { roles: [] } } as unknown as Context

    await expect(send('024', noRole)).rejects.toThrow(
      'You are not permitted to run this mutation'
    )
    expect(sendBulkSMS).not.toHaveBeenCalled()
  })
})
