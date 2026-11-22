/**
 * SYN-264 / SYN-269 — the service-form refusals (vacation church, form
 * already filled this week, same treasurer picked twice) are refusals the
 * leader is meant to see. They must reach Apollo
 * as BAD_USER_INPUT so error-reference.ts logs them at WARN instead of filing
 * an INTERNAL_SERVER_ERROR ticket per refusal (SYN-253).
 *
 * Unlike service-vacation.test.ts, `throwToSentry` is NOT mocked here:
 * RecordService and RecordSpecialService rethrow through it, and the real
 * wrapper is what has to keep the code.
 */

jest.mock('../utils/scope-utils', () => ({
  assertChurchScope: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
}))

jest.mock('../directory/utils', () => ({
  makeServantCypher: jest.fn().mockResolvedValue(undefined),
}))

import { GraphQLError } from 'graphql'
import serviceMutation from './service-resolvers'
import serviceNoIncomeMutations from '../no-income/service-resolvers'
import { logLevelForCode } from '../utils/error-reference'
import type { Context } from '../utils/neo4j-types'

const VACATION_ERROR =
  'You cannnot have service if you are on vacation. Please conntact your admin!'
const ALREADY_FILLED_ERROR =
  'You have already filled your service form this week!'

const makeMockQueryResult = (data: Record<string, unknown>) => ({
  records: [{ keys: Object.keys(data), _fields: Object.values(data) }],
})

const vacationCheck = makeMockQueryResult({
  alreadyFilled: false,
  labels: ['Vacation', 'Bacenta'],
})
const filledCheck = makeMockQueryResult({
  alreadyFilled: true,
  labels: ['Active', 'Bacenta'],
})
const historyExists = makeMockQueryResult({ exists: true })
// RecordService / RecordSpecialService read the history check through
// checkServantHasCurrentHistory, which calls `record.get('exists')`.
const servantHistoryExists = {
  records: [{ get: jest.fn().mockReturnValue(true) }],
}

const incomeArgs = {
  churchId: 'bacenta_1',
  serviceDate: '2024-01-07',
  attendance: 20,
  income: 100,
  foreignCurrency: '',
  numberOfTithers: 5,
  treasurers: ['member_1'],
  treasurerSelfie: 'https://img.jpg',
  familyPicture: 'https://img.jpg',
}
const cancelledArgs = {
  churchId: 'bacenta_1',
  serviceDate: '2024-01-07',
  noServiceReason: 'Public holiday',
}
const noIncomeArgs = {
  id: 'bacenta_1',
  churchId: 'bacenta_1',
  serviceDate: '2024-01-07',
}

let mockSession: {
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context

beforeAll(() => {
  jest.useFakeTimers().setSystemTime(new Date('2024-01-07T12:00:00Z'))
})

afterAll(() => {
  jest.useRealTimers()
})

beforeEach(() => {
  mockSession = {
    executeRead: jest.fn(),
    executeWrite: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }
  context = {
    jwt: { userId: 'user_test', roles: ['leaderBacenta'] },
    executionContext: { session: jest.fn().mockReturnValue(mockSession) },
  } as unknown as Context
})

const expectRefusal = async (promise: Promise<unknown>, message: string) => {
  const error = await promise.then(
    () => {
      throw new Error('expected the mutation to be refused')
    },
    (err: unknown) => err
  )
  expect(error).toBeInstanceOf(GraphQLError)
  expect((error as GraphQLError).message).toContain(message)
  expect((error as GraphQLError).extensions.code).toBe('BAD_USER_INPUT')
  expect(logLevelForCode((error as GraphQLError).extensions.code)).toBe('warn')
  expect(mockSession.executeWrite).not.toHaveBeenCalled()
}

describe('SYN-264 — RecordCancelledService refusals are BAD_USER_INPUT', () => {
  it('codes the vacation refusal BAD_USER_INPUT, so it logs at WARN', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(historyExists)
      .mockResolvedValueOnce(vacationCheck)

    await expectRefusal(
      serviceMutation.RecordCancelledService(null, cancelledArgs, context),
      VACATION_ERROR
    )
  })

  it('codes the already-filled refusal BAD_USER_INPUT', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(historyExists)
      .mockResolvedValueOnce(filledCheck)

    await expectRefusal(
      serviceMutation.RecordCancelledService(null, cancelledArgs, context),
      ALREADY_FILLED_ERROR
    )
  })
})

describe('SYN-264 — RecordService refusals keep BAD_USER_INPUT through throwToSentry', () => {
  it('codes the vacation refusal BAD_USER_INPUT', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(servantHistoryExists)
      .mockResolvedValueOnce(vacationCheck)
      .mockResolvedValueOnce(makeMockQueryResult({ conversionRateToDollar: 1 }))
      .mockResolvedValueOnce(makeMockQueryResult({}))

    await expectRefusal(
      serviceMutation.RecordService(null, incomeArgs, context),
      VACATION_ERROR
    )
  })

  it('codes the already-filled refusal BAD_USER_INPUT', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(servantHistoryExists)
      .mockResolvedValueOnce(filledCheck)
      .mockResolvedValueOnce(makeMockQueryResult({ conversionRateToDollar: 1 }))
      .mockResolvedValueOnce(makeMockQueryResult({}))

    await expectRefusal(
      serviceMutation.RecordService(null, incomeArgs, context),
      ALREADY_FILLED_ERROR
    )
  })
})

describe('SYN-264 — RecordSpecialService vacation refusal', () => {
  it('codes the vacation refusal BAD_USER_INPUT', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(servantHistoryExists)
      .mockResolvedValueOnce(
        makeMockQueryResult({
          conversionRateToDollar: 1,
          labels: ['Vacation', 'Bacenta'],
        })
      )
      .mockResolvedValueOnce(makeMockQueryResult({}))

    await expectRefusal(
      serviceMutation.RecordSpecialService(null, incomeArgs, context),
      VACATION_ERROR
    )
  })
})

describe('SYN-264 — RecordServiceNoIncome refusals', () => {
  it('codes the vacation refusal BAD_USER_INPUT', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(historyExists)
      .mockResolvedValueOnce(vacationCheck)

    await expectRefusal(
      serviceNoIncomeMutations.RecordServiceNoIncome(
        null,
        noIncomeArgs,
        context
      ),
      VACATION_ERROR
    )
  })

  it('codes the already-filled refusal BAD_USER_INPUT', async () => {
    mockSession.executeRead
      .mockResolvedValueOnce(historyExists)
      .mockResolvedValueOnce(filledCheck)

    await expectRefusal(
      serviceNoIncomeMutations.RecordServiceNoIncome(
        null,
        noIncomeArgs,
        context
      ),
      ALREADY_FILLED_ERROR
    )
  })
})

describe('SYN-269 — duplicate-treasurer refusals are BAD_USER_INPUT', () => {
  const REPEATING_TREASURERS_ERROR =
    'You cannot choose the same treasurer twice!'
  const duplicateTreasurerArgs = {
    ...incomeArgs,
    treasurers: ['member_1', 'member_1'],
  }

  it('RecordService codes it BAD_USER_INPUT through throwToSentry', async () => {
    await expectRefusal(
      serviceMutation.RecordService(null, duplicateTreasurerArgs, context),
      REPEATING_TREASURERS_ERROR
    )
    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.close).toHaveBeenCalled()
  })

  it('RecordSpecialService codes it BAD_USER_INPUT through throwToSentry', async () => {
    await expectRefusal(
      serviceMutation.RecordSpecialService(
        null,
        duplicateTreasurerArgs,
        context
      ),
      REPEATING_TREASURERS_ERROR
    )
    expect(mockSession.executeRead).not.toHaveBeenCalled()
    expect(mockSession.close).toHaveBeenCalled()
  })
})
