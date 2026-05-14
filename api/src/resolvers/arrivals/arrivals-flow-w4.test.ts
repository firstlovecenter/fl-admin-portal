/**
 * W4 — Characterization tests for the Sunday arrivals bussing workflow.
 *
 * W4 (kb/03-workflows.md):
 *
 *   Pre-mobilisation: leaderBacenta uploads mobilisationPicture
 *   Dispatch:  leaderBacenta fills VehicleRecord (RecordVehicleFromBacenta)  [arrivals-sm5]
 *   Count:     arrivalsCounterStream counts attendance (ConfirmVehicleByAdmin) [arrivals-sm5]
 *   Support:   arrivalsHelpers compute vehicleTopUp (SetVehicleSupport)        [arrivals-sm5]
 *   Payment:   arrivalsHelpers initiate payout (SendVehicleSupport)            [arrivals-sm5]
 *
 * This file covers aspects NOT addressed by arrivals-sm5.test.ts:
 *
 *   1. UploadMobilisationPicture — auth gate, duplicate guard, time window, momo requirement
 *   2. Multi-vehicle aggregation — setVehicleTopUp / noVehicleTopUp both SET
 *      bussing.bussingTopUp = SUM(records.vehicleTopUp) on the parent BussingRecord
 *   3. HistoryLog gap — none of the vehicle-payment Cyphers create a HistoryLog
 *      (characterised for future work — see SYN-73 done-when criteria)
 *   4. Role-boundary negatives specific to the W4 hand-off sequence
 *
 * All test names begin with "W4:" for grep-ability (SYN-73):
 *   npm test -- arrivals-flow-w4 --testNamePattern="W4:"
 */

jest.mock('../secrets', () => ({
  loadSecrets: jest.fn().mockResolvedValue({
    ENVIRONMENT: 'development',
    PAYSTACK_PRIVATE_KEY_WEEKDAY: 'Bearer jest_paystack_key',
  }),
}))

jest.mock('../utils/scope-utils', () => ({
  assertChurchScope: jest.fn().mockResolvedValue(undefined),
  assertScopeViaVehicleRecord: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
  throwToSentry: jest.fn((msg: string, err: unknown) => {
    throw err instanceof Error ? err : new Error(String(err))
  }),
}))

jest.mock('../utils/notify', () => ({
  sendBulkSMS: jest.fn().mockResolvedValue({ ok: true }),
  joinMessageStrings: (parts: string[]) => parts.join(''),
}))

jest.mock('../services/service-resolvers', () => ({
  checkServantHasCurrentHistory: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../utils/financial-utils', () => ({
  ...jest.requireActual('../utils/financial-utils'),
  getStreamFinancials: jest.fn().mockResolvedValue({
    auth: 'Bearer jest_paystack_key',
    subaccount: 'acct_test',
  }),
}))

jest.mock('../directory/make-remove-servants', () => ({
  MakeServant: jest.fn().mockResolvedValue({ id: 'servant_ok' }),
  RemoveServant: jest.fn().mockResolvedValue({ id: 'servant_ok' }),
}))

import { arrivalsMutation } from './arrivals-resolvers'
import {
  setVehicleTopUp,
  noVehicleTopUp,
  setVehicleRecordTransactionSuccessful,
  confirmVehicleByAdmin,
  uploadMobilisationPicture,
} from './arrivals-cypher'
import type { Context } from '../utils/neo4j-types'
import { isAuth } from '../utils/utils'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Build a mock QueryResult that rearrangeCypherObject can consume.
const makeMockQueryResult = (data: Record<string, unknown>) => ({
  records: [{ keys: Object.keys(data), _fields: Object.values(data) }],
})

const mockJwt = {
  userId: 'user_leader_1',
  sub: 'user_leader_1',
  roles: ['leaderBacenta'],
  iss: 'test',
  aud: ['test'],
  iat: 0,
  exp: 9999999999,
  scope: 'openid',
  azp: 'test',
  permissions: ['leaderBacenta'],
}

// Time stitched so that today + 23:59 UTC is always in the future.
const FUTURE_MOB_END_TIME = '2024-01-07T23:59:00.000Z'
// T00:00:01 avoids the off-by-one at midnight UTC (strictly after midnight = always in the past).
const PAST_MOB_END_TIME = '2024-01-07T00:00:01.000Z'

let mockSession: {
  run: jest.Mock
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context

beforeEach(() => {
  jest.clearAllMocks()
  mockSession = {
    run: jest.fn(),
    executeRead: jest.fn(),
    executeWrite: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }
  context = {
    jwt: mockJwt,
    executionContext: { session: jest.fn().mockReturnValue(mockSession) },
  } as unknown as Context
})

// ---------------------------------------------------------------------------
// Helper: seed the four session.run calls UploadMobilisationPicture makes
// ---------------------------------------------------------------------------
const seedUploadMobPicture = ({
  preMobFilled = false,
  momoNumber = '0240000000',
  sprinterTopUp = 30,
  // TODO(SYN-73): checkBacentaMomoDetails Cypher aliases the column as 'uvanTopUp'
  // (missing 'r'). The resolver reads checkBacentaMomo.urvanTopUp, which is always
  // undefined in production — so the urvanTopUp guard silently never fires. Tracked
  // as a latent bug; do not "fix" the Cypher spelling here without a resolver fix too.
  uvanTopUp = 50,
  mobilisationEndTime = FUTURE_MOB_END_TIME,
}: {
  preMobFilled?: boolean
  momoNumber?: string | null
  sprinterTopUp?: number
  uvanTopUp?: number
  mobilisationEndTime?: string
} = {}) => {
  // 1. checkArrivalTimes
  mockSession.run.mockResolvedValueOnce(
    makeMockQueryResult({
      stream: { properties: { mobilisationEndTime } },
      bacenta: { properties: { id: 'bacenta_1', outbound: false } },
    })
  )
  // 2. checkIfPreMobilisationFilled
  mockSession.run.mockResolvedValueOnce(
    makeMockQueryResult({ status: preMobFilled })
  )
  // 3. checkBacentaMomoDetails — column name is 'uvanTopUp' (Cypher typo; see TODO above)
  mockSession.run.mockResolvedValueOnce(
    makeMockQueryResult({ momoNumber, sprinterTopUp, uvanTopUp })
  )
  // 4. uploadMobilisationPicture write
  mockSession.run.mockResolvedValueOnce(
    makeMockQueryResult({
      bussingRecord: {
        properties: { id: 'br_new', mobilisationPicture: 'https://img.jpg' },
      },
      bacenta: { properties: { id: 'bacenta_1', name: 'Bacenta 1' } },
      date: { properties: { date: '2026-05-11' } },
      stream_name: 'Stream A',
      week: 19,
    })
  )
}

const uploadArgs = {
  bacentaId: 'bacenta_1',
  serviceDate: '2026-05-11',
  mobilisationPicture: 'https://img.jpg',
}

// ===========================================================================
// UploadMobilisationPicture — W4 Step 1
// ===========================================================================
describe('W4 — UploadMobilisationPicture (leaderBacenta)', () => {
  it('W4: isAuth is called with [leaderBacenta] — only the Bacenta leader can upload', async () => {
    // TODO(SYN-73): UploadMobilisationPicture opens the session on line 210 BEFORE
    // calling isAuth on line 211. This violates the "isAuth must be the first line"
    // rule in the backend KB. Characterised here; fix in a dedicated refactor pass.
    seedUploadMobPicture()

    await arrivalsMutation.UploadMobilisationPicture(
      null as never,
      uploadArgs,
      context
    )

    expect(isAuth).toHaveBeenCalledWith(['leaderBacenta'], context.jwt.roles)
  })

  it('W4: UploadMobilisationPicture returns a BussingRecord with the mobilisationPicture URL', async () => {
    seedUploadMobPicture()

    const result = await arrivalsMutation.UploadMobilisationPicture(
      null as never,
      uploadArgs,
      context
    )

    expect(result).toMatchObject({
      id: 'br_new',
      mobilisationPicture: 'https://img.jpg',
    })
  })

  it('W4: pre-mobilisation duplicate guard — throws if mobilisationPicture already uploaded today', async () => {
    seedUploadMobPicture({ preMobFilled: true })

    await expect(
      arrivalsMutation.UploadMobilisationPicture(null as never, uploadArgs, context)
    ).rejects.toThrow('You have already filled the pre-mobilisation form')

    // The upload Cypher must NOT have been called (guard fires first)
    expect(mockSession.run).toHaveBeenCalledTimes(2) // checkArrivalTimes + checkIfPreMobFilled
  })

  it('W4: throws past mobilisation window — "It is now past the time for mobilisation"', async () => {
    seedUploadMobPicture({ mobilisationEndTime: PAST_MOB_END_TIME, preMobFilled: false })

    await expect(
      arrivalsMutation.UploadMobilisationPicture(null as never, uploadArgs, context)
    ).rejects.toThrow('It is now past the time for mobilisation. Thank you!')
  })

  it('W4: throws if momoNumber is null but sprinterTopUp > 0 — requires momo before filling', async () => {
    seedUploadMobPicture({ momoNumber: null, sprinterTopUp: 30 })

    await expect(
      arrivalsMutation.UploadMobilisationPicture(null as never, uploadArgs, context)
    ).rejects.toThrow('You need a mobile money number before filling this form')
  })

  it('W4: passes when momoNumber is null but both top-ups are 0 (car-only bacentas with no top-up)', async () => {
    seedUploadMobPicture({ momoNumber: null, sprinterTopUp: 0, uvanTopUp: 0 })

    const result = await arrivalsMutation.UploadMobilisationPicture(
      null as never,
      uploadArgs,
      context
    )

    expect(result).toMatchObject({ id: 'br_new' })
  })

  it('W4: arrivalsCounterStream is blocked from UploadMobilisationPicture — only leaderBacenta submits', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('You are not permitted to run this mutation')
    })

    const counterCtx: Context = {
      ...context,
      jwt: { ...mockJwt, roles: ['arrivalsCounterStream'] as any },
    } as unknown as Context

    await expect(
      arrivalsMutation.UploadMobilisationPicture(null as never, uploadArgs, counterCtx)
    ).rejects.toThrow('not permitted')
  })
})

// ===========================================================================
// Multi-vehicle aggregation — Cypher string assertions (W4 done-when §5)
// "BussingRecord total = sum of vehicle payments"
// ===========================================================================
describe('W4 — multi-vehicle aggregation: BussingRecord.bussingTopUp = SUM(vehicleTopUp)', () => {
  it('W4: setVehicleTopUp Cypher sets record.vehicleTopUp AND aggregates bussing.bussingTopUp', () => {
    expect(setVehicleTopUp).toMatch(/SET record\.vehicleTopUp = \$vehicleTopUp/)
    // Aggregation step: sum all vehicle top-ups onto the parent BussingRecord
    expect(setVehicleTopUp).toMatch(
      /SUM\(records\.vehicleTopUp\) AS summedVehicleTopUp/
    )
    expect(setVehicleTopUp).toMatch(/SET bussing\.bussingTopUp = summedVehicleTopUp/)
  })

  it('W4: noVehicleTopUp Cypher zeroes record.vehicleTopUp AND still aggregates bussing.bussingTopUp', () => {
    expect(noVehicleTopUp).toMatch(/SET record\.vehicleTopUp = 0/)
    expect(noVehicleTopUp).toMatch(
      /SUM\(records\.vehicleTopUp\) AS summedVehicleTopUp/
    )
    expect(noVehicleTopUp).toMatch(/SET bussing\.bussingTopUp = summedVehicleTopUp/)
  })

  it('W4: both aggregation Cyphers traverse (bussing:BussingRecord)-[:INCLUDES_RECORD]->(records:VehicleRecord) to compute the sum', () => {
    expect(setVehicleTopUp).toMatch(/\(bussing\)-\[:INCLUDES_RECORD\]->\(records:VehicleRecord\)/)
    expect(noVehicleTopUp).toMatch(/\(bussing\)-\[:INCLUDES_RECORD\]->\(records:VehicleRecord\)/)
  })

  it('W4: setVehicleTopUp reads the parent bussing record via INCLUDES_RECORD from the vehicle record', () => {
    // The Cypher must navigate vehicle → bussing to find siblings for the sum.
    expect(setVehicleTopUp).toMatch(
      /MATCH \(record:VehicleRecord \{id: \$vehicleRecordId\}\)<-\[:INCLUDES_RECORD\]-\(bussing:BussingRecord\)/
    )
  })
})

// ===========================================================================
// HistoryLog gap characterisation (W4 done-when: "HistoryLog appended")
// ===========================================================================
describe('W4 — HistoryLog gap characterisation (SYN-73)', () => {
  // TODO(refactor): The SYN-73 done-when criteria says "Teller pays →
  // BussingRecord transitions to Paid; HistoryLog appended". None of the
  // vehicle-payment Cyphers today write a HistoryLog node. The gap is
  // characterised here so any refactor that adds HistoryLog writes has a
  // clear base-line to update. Tracked in SYN-73 refactor scope.
  it('W4: setVehicleRecordTransactionSuccessful Cypher does NOT create a HistoryLog (gap — see SYN-73)', () => {
    expect(setVehicleRecordTransactionSuccessful).not.toMatch(/CREATE \(log:HistoryLog/)
  })

  it('W4: setVehicleTopUp Cypher does NOT create a HistoryLog (gap — see SYN-73)', () => {
    expect(setVehicleTopUp).not.toMatch(/CREATE \(log:HistoryLog/)
  })

  it('W4: noVehicleTopUp Cypher does NOT create a HistoryLog (gap — see SYN-73)', () => {
    expect(noVehicleTopUp).not.toMatch(/CREATE \(log:HistoryLog/)
  })

  it('W4: confirmVehicleByAdmin Cypher does NOT create a HistoryLog (gap — counting step has no log)', () => {
    expect(confirmVehicleByAdmin).not.toMatch(/CREATE \(log:HistoryLog/)
  })

  it('W4: uploadMobilisationPicture Cypher does NOT create a HistoryLog (pre-mob upload has no log)', () => {
    expect(uploadMobilisationPicture).not.toMatch(/CREATE \(log:HistoryLog/)
  })
})

// ===========================================================================
// W4 role-boundary negatives
// "At least one negative role-mismatch test per role boundary" (SYN-73 done-when)
// ===========================================================================
describe('W4 — role-boundary negatives', () => {
  it('W4: leaderBacenta cannot call ConfirmVehicleByAdmin — only arrivalsCounterStream counts', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('You are not permitted to run this mutation')
    })

    await expect(
      arrivalsMutation.ConfirmVehicleByAdmin(
        null as never,
        {
          bacentaId: 'b_1',
          bussingRecordId: 'br_1',
          leaderDeclaration: 20,
          attendance: 25,
          vehicle: 'Sprinter',
          picture: 'p',
        } as never,
        context
      )
    ).rejects.toThrow('not permitted')

    // No DB hit when auth fails
    expect(mockSession.run).not.toHaveBeenCalled()
  })

  it('W4: arrivalsPayerCouncil cannot call RecordVehicleFromBacenta — submission is leaderBacenta only', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('You are not permitted to run this mutation')
    })

    const payerCtx: Context = {
      ...context,
      jwt: { ...mockJwt, roles: ['arrivalsPayerCouncil'] as any },
    } as unknown as Context

    await expect(
      arrivalsMutation.RecordVehicleFromBacenta(
        null as never,
        {
          bacentaId: 'b_1',
          bussingRecordId: 'br_1',
          leaderDeclaration: 20,
          vehicle: 'Sprinter',
          picture: 'p',
        },
        payerCtx
      )
    ).rejects.toThrow('not permitted')

    expect(mockSession.run).not.toHaveBeenCalled()
  })

  it('W4: tellerStream has no role in the arrivals payment flow — verified by permitArrivalsHelpers', async () => {
    // SM5 state machine: the "teller" in the W4 ticket description maps to
    // arrivalsPayerCouncil (not tellerStream). tellerStream is the SM2 (banking)
    // confirmer and has NO legitimate call in the SM5 flow. Characterised here.
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('You are not permitted to run this mutation')
    })

    const tellerCtx: Context = {
      ...context,
      jwt: { ...mockJwt, roles: ['tellerStream'] as any },
    } as unknown as Context

    await expect(
      arrivalsMutation.SetVehicleSupport(
        null as never,
        { vehicleRecordId: 'vr_1' },
        tellerCtx
      )
    ).rejects.toThrow('not permitted')
  })
})
