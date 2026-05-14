/**
 * SM5 — Characterization tests for the vehicle / bussing-record arrivals
 * state machine in arrivals-resolvers.ts and arrivals-cypher.ts.
 *
 * SM5 (kb/04-state-machines.md):
 *
 *    submitted (RecordVehicleFromBacenta — leaderBacenta)
 *        │  no arrivalTime, leaderDeclaration only
 *        ▼
 *    counted   (ConfirmVehicleByAdmin — arrivalsCounterStream)
 *        │  attendance, vehicle, arrivalTime set
 *        ▼
 *    approved  (SetVehicleSupport — arrivalsHelpers — counter OR payer)
 *        │  vehicleTopUp computed and written
 *        ▼
 *    paid      (SendVehicleSupport — arrivalsHelpers — counter OR payer)
 *               transactionStatus set from Paystack response
 *
 * The ticket (SYN-70) names the payer/teller for the approved/paid edges.
 * The code today uses permitArrivalsHelpers('Stream'), which expands to
 * BOTH 'arrivalsCounterStream' AND 'arrivalsPayerCouncil' for those edges,
 * and uses ONLY 'arrivalsCounterStream' for the counted edge. tellerStream
 * has no role in the vehicle/bussing flow at all (it is the banking-side
 * confirmer per SM2). Tests below pin the actual behaviour per ADR-013 §4.
 *
 * Mocks: neo4j-driver is replaced by per-test mock sessions; axios is
 * mocked end-to-end so SendVehicleSupport never hits the network; secrets
 * are stubbed; sendBulkSMS is stubbed because SetVehicleSupport pairs
 * every DB write with a notification call inside Promise.all.
 *
 * All test names begin with "SM5:" for grep-ability (SYN-70):
 *   npm test -- arrivals-sm5 --testNamePattern="SM5:"
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
    // Match the non-mocked behaviour: throw a new Error so the resolver
    // promise rejects (instead of falling through to `return null`).
    throw err instanceof Error ? err : new Error(String(err))
  }),
}))

jest.mock('../utils/financial-utils', () => ({
  ...jest.requireActual('../utils/financial-utils'),
  getStreamFinancials: jest.fn().mockResolvedValue({
    auth: 'Bearer jest_paystack_key',
    subaccount: 'acct_test',
  }),
}))

jest.mock('../utils/notify', () => ({
  sendBulkSMS: jest.fn().mockResolvedValue({ ok: true }),
  joinMessageStrings: (parts: string[]) => parts.join(''),
}))

jest.mock('../services/service-resolvers', () => ({
  checkServantHasCurrentHistory: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('../directory/make-remove-servants', () => ({
  MakeServant: jest.fn().mockResolvedValue({ id: 'servant_ok' }),
  RemoveServant: jest.fn().mockResolvedValue({ id: 'servant_ok' }),
}))

jest.mock('axios', () => jest.fn())

import axios from 'axios'
import { arrivalsMutation } from './arrivals-resolvers'
import {
  recordVehicleFromBacenta,
  confirmVehicleByAdmin,
  setVehicleTopUp,
  noVehicleTopUp,
  setVehicleRecordTransactionSuccessful,
} from './arrivals-cypher'
import type { Context } from '../utils/neo4j-types'
import { isAuth } from '../utils/utils'
import { permitArrivalsCounter, permitArrivalsHelpers } from '../permissions'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const makeMockQueryResult = (data: Record<string, unknown>) => ({
  records: [{ keys: Object.keys(data), _fields: Object.values(data) }],
})

const mockJwt = {
  userId: 'user_test',
  sub: 'user_test',
  roles: ['leaderBacenta'],
  iss: 'test',
  aud: ['test'],
  iat: 0,
  exp: 9999999999,
  scope: 'openid',
  azp: 'test',
  permissions: ['leaderBacenta'],
}

// Far-future date so arrivalEndTime checks always pass in the resolvers.
// arrivalEndTimeCalculator stitches today's date onto the time-of-day part
// of the supplied ISO string, so we need an hour-of-day late enough that
// `today > endTime` cannot fire during a normal jest run.
const FUTURE_ARRIVAL_END_TIME = '2024-01-07T23:59:00.000Z'

let mockSession: {
  run: jest.Mock
  executeRead: jest.Mock
  executeWrite: jest.Mock
  close: jest.Mock
}
let context: Context

beforeEach(() => {
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

// ===========================================================================
// EDGE 1 — submitted → counted (ConfirmVehicleByAdmin)
// arrivalsCounterStream role.
// ===========================================================================
describe('SM5 — submitted → counted: ConfirmVehicleByAdmin (arrivalsCounter)', () => {
  const counterContext = (): Context =>
    ({
      ...context,
      jwt: { ...mockJwt, roles: ['arrivalsCounterStream'] },
    } as unknown as Context)

  const confirmArgs = {
    bacentaId: 'bacenta_1',
    bussingRecordId: 'br_1',
    vehicleRecordId: 'vr_1',
    leaderDeclaration: 20,
    attendance: 25,
    vehicle: 'Sprinter' as const,
    picture: 'https://img.jpg',
  }

  it('SM5: isAuth is called with permitArrivalsCounter() === [arrivalsCounterStream]', async () => {
    mockSession.run
      // checkArrivalTimeFromVehicle
      .mockResolvedValueOnce(
        makeMockQueryResult({
          arrivalEndTime: FUTURE_ARRIVAL_END_TIME,
          numberOfVehicles: 0,
          totalAttendance: 0,
          leaderPhoneNumber: '0240000000',
          leaderFirstName: 'Kofi',
          bacentaName: 'Bacenta 1',
        })
      )
      // confirmVehicleByAdmin
      .mockResolvedValueOnce(
        makeMockQueryResult({
          vehicleRecord: {
            properties: {
              id: 'vr_1',
              attendance: 25,
              vehicle: 'Sprinter',
              picture: 'https://img.jpg',
              leaderDeclaration: 20,
              outbound: false,
              arrivalTime: '2024-01-07T08:00:00Z',
            },
          },
          stream_name: 'Stream A',
          week: 1,
        })
      )
      // aggregateVehicleBussingRecordData (called with .catch on errors)
      .mockResolvedValueOnce(makeMockQueryResult({ vehicleRecord: { id: 'vr_1' } }))

    await arrivalsMutation.ConfirmVehicleByAdmin(
      null as never,
      confirmArgs,
      counterContext()
    )

    expect(isAuth).toHaveBeenCalledWith(
      permitArrivalsCounter(),
      counterContext().jwt.roles
    )
    expect(isAuth).toHaveBeenCalledWith(
      ['arrivalsCounterStream'],
      counterContext().jwt.roles
    )
  })

  it('SM5: counted edge sets attendance, vehicle, arrivalTime — Cypher proves the counted_by relationship', () => {
    expect(confirmVehicleByAdmin).toMatch(/SET vehicleRecord\.attendance = \$attendance/)
    expect(confirmVehicleByAdmin).toMatch(/SET vehicleRecord\.attendance/)
    expect(confirmVehicleByAdmin).toMatch(/vehicleRecord\.arrivalTime = datetime\(\)/)
    expect(confirmVehicleByAdmin).toMatch(/MERGE \(vehicleRecord\)-\[:COUNTED_BY\]->\(admin\)/)
    expect(confirmVehicleByAdmin).toMatch(/\$jwt\.userId/)
  })

  it('SM5: ConfirmVehicleByAdmin returns the vehicle record with new arrivalTime', async () => {
    mockSession.run
      .mockResolvedValueOnce(
        makeMockQueryResult({
          arrivalEndTime: FUTURE_ARRIVAL_END_TIME,
          numberOfVehicles: 0,
          totalAttendance: 0,
          leaderPhoneNumber: '0240000000',
          leaderFirstName: 'Kofi',
          bacentaName: 'Bacenta 1',
        })
      )
      .mockResolvedValueOnce(
        makeMockQueryResult({
          vehicleRecord: {
            properties: {
              id: 'vr_1',
              attendance: 25,
              vehicle: 'Sprinter',
              picture: 'https://img.jpg',
              leaderDeclaration: 20,
              outbound: false,
              arrivalTime: '2024-01-07T08:00:00Z',
            },
          },
          stream_name: 'Stream A',
          week: 1,
        })
      )
      .mockResolvedValueOnce(makeMockQueryResult({ vehicleRecord: { id: 'vr_1' } }))

    const result = await arrivalsMutation.ConfirmVehicleByAdmin(
      null as never,
      confirmArgs,
      counterContext()
    )

    expect(result).toMatchObject({
      id: 'vr_1',
      attendance: 25,
      vehicle: 'Sprinter',
      arrivalTime: '2024-01-07T08:00:00Z',
    })
  })

  it('SM5: attendance below 8 is coerced to vehicle=Car (small-bus rule)', async () => {
    mockSession.run
      .mockResolvedValueOnce(
        makeMockQueryResult({
          arrivalEndTime: FUTURE_ARRIVAL_END_TIME,
          numberOfVehicles: 0,
          totalAttendance: 0,
          leaderPhoneNumber: '0240000000',
          leaderFirstName: 'Kofi',
          bacentaName: 'Bacenta 1',
        })
      )
      .mockResolvedValueOnce(
        makeMockQueryResult({
          vehicleRecord: {
            properties: {
              id: 'vr_small',
              attendance: 0,
              vehicle: 'Car',
              picture: 'https://img.jpg',
              leaderDeclaration: 5,
              outbound: false,
              arrivalTime: '2024-01-07T08:00:00Z',
            },
          },
          stream_name: 'Stream A',
          week: 1,
        })
      )
      .mockResolvedValueOnce(makeMockQueryResult({ vehicleRecord: { id: 'vr_small' } }))

    await arrivalsMutation.ConfirmVehicleByAdmin(
      null as never,
      { ...confirmArgs, vehicle: 'Sprinter', attendance: 5 },
      counterContext()
    )

    // The confirmVehicleByAdmin Cypher was called with vehicle='Car' (coerced)
    // and attendance=0 (because numberOfVehicles<1 AND attendance<8 → 0).
    const confirmCall = mockSession.run.mock.calls.find(
      ([cypher]) => cypher === confirmVehicleByAdmin
    )
    expect(confirmCall).toBeDefined()
    expect(confirmCall?.[1]).toMatchObject({
      vehicle: 'Car',
      attendance: 0,
    })
  })

  it('SM5: throws past arrival window (today > arrivalEndTime)', async () => {
    // Past time-of-day forces today > endTime irrespective of run date.
    const PAST_TIME = '2024-01-07T00:00:00.000Z'
    mockSession.run.mockResolvedValueOnce(
      makeMockQueryResult({
        arrivalEndTime: PAST_TIME,
        numberOfVehicles: 0,
        totalAttendance: 0,
        leaderPhoneNumber: '0240000000',
        leaderFirstName: 'Kofi',
        bacentaName: 'Bacenta 1',
      })
    )

    await expect(
      arrivalsMutation.ConfirmVehicleByAdmin(
        null as never,
        confirmArgs,
        counterContext()
      )
    ).rejects.toThrow('It is now past the time for arrivals. Thank you!')
  })
})

// ===========================================================================
// EDGE 1.a — submitted edge: RecordVehicleFromBacenta
// leaderBacenta only.
// ===========================================================================
describe('SM5 — submitted: RecordVehicleFromBacenta (leaderBacenta)', () => {
  const submitArgs = {
    bacentaId: 'bacenta_1',
    bussingRecordId: 'br_1',
    leaderDeclaration: 20,
    vehicle: 'Sprinter',
    picture: 'https://img.jpg',
  }

  it('SM5: isAuth is called with [leaderBacenta]', async () => {
    mockSession.run
      // checkArrivalTimes
      .mockResolvedValueOnce(
        makeMockQueryResult({
          stream: { properties: { arrivalEndTime: FUTURE_ARRIVAL_END_TIME } },
          bacenta: {
            properties: {
              recipientCode: null,
              momoNumber: '0240000000',
              mobileNetwork: 'MTN',
              outbound: false,
            },
          },
        })
      )
      // recordVehicleFromBacenta
      .mockResolvedValueOnce(
        makeMockQueryResult({
          vehicleRecord: {
            properties: {
              id: 'vr_new',
              leaderDeclaration: 20,
              vehicle: 'Sprinter',
              picture: 'https://img.jpg',
              outbound: false,
            },
          },
          stream_name: 'Stream A',
          week: 1,
        })
      )

    await arrivalsMutation.RecordVehicleFromBacenta(
      null as never,
      submitArgs,
      context
    )

    expect(isAuth).toHaveBeenCalledWith(['leaderBacenta'], context.jwt.roles)
  })

  it('SM5: RecordVehicleFromBacenta IS idempotent — Cypher uses MERGE on (vehicle, outbound) composite key (ADR-005, SYN-117)', () => {
    // CREATE with a random UUID is gone; MERGE scoped under the parent
    // BussingRecord deduplicates on (vehicle, outbound) — one node per vehicle
    // type per bussing day. id and createdAt are frozen on first creation.
    expect(recordVehicleFromBacenta).not.toMatch(
      /CREATE \(vehicleRecord:VehicleRecord/
    )
    expect(recordVehicleFromBacenta).toMatch(
      /MERGE \(bussingRecord\)-\[:INCLUDES_RECORD\]->\(vehicleRecord:VehicleRecord \{vehicle: \$vehicle, outbound: \$outbound\}\)/
    )
    expect(recordVehicleFromBacenta).toMatch(
      /ON CREATE SET vehicleRecord\.id = apoc\.create\.uuid\(\)/
    )
  })
})

// ===========================================================================
// EDGE 2 — counted → approved/declined: SetVehicleSupport
// permitArrivalsHelpers('Stream') = [arrivalsCounterStream, arrivalsPayerCouncil]
// ===========================================================================
describe('SM5 — counted → approved: SetVehicleSupport (arrivalsHelpers)', () => {
  const setSupportArgs = { vehicleRecordId: 'vr_1' }

  const payerContext = (): Context =>
    ({
      ...context,
      jwt: { ...mockJwt, roles: ['arrivalsPayerCouncil'] },
    } as unknown as Context)

  it('SM5: isAuth is called with permitArrivalsHelpers(Stream) === [arrivalsCounterStream, arrivalsPayerCouncil]', async () => {
    mockSession.run.mockResolvedValueOnce(
      makeMockQueryResult({
        vehicleRecordId: 'vr_1',
        attendance: 50,
        vehicle: 'Sprinter',
        vehicleCost: 100,
        outbound: false,
        arrivalTime: '2024-01-07T08:00:00Z',
        leaderPhoneNumber: '0240000000',
        leaderFirstName: 'Kofi',
        bacentaSprinterTopUp: 30,
        bacentaUrvanTopUp: 50,
        dateLabels: [],
      })
    )
    // setVehicleTopUp (inside Promise.all with SMS)
    mockSession.run.mockResolvedValueOnce(
      makeMockQueryResult({
        record: { properties: { id: 'vr_1', vehicleTopUp: 30 } },
      })
    )

    await arrivalsMutation.SetVehicleSupport(
      null as never,
      setSupportArgs,
      payerContext()
    )

    expect(isAuth).toHaveBeenCalledWith(
      permitArrivalsHelpers('Stream'),
      payerContext().jwt.roles
    )
    expect(isAuth).toHaveBeenCalledWith(
      ['arrivalsCounterStream', 'arrivalsPayerCouncil'],
      payerContext().jwt.roles
    )
  })

  // -------------------------------------------------------------------------
  // Payment math — pinned scenarios for SetVehicleSupport.calculateVehicleTopUp
  // -------------------------------------------------------------------------
  describe('SM5 — payment math: calculateVehicleTopUp', () => {
    type ScenarioResp = {
      attendance: number
      vehicle: 'Sprinter' | 'Urvan' | 'Car'
      vehicleCost: number
      outbound: boolean
      bacentaSprinterTopUp: number
      bacentaUrvanTopUp: number
      arrivalTime: string
      leaderPhoneNumber: string
      leaderFirstName: string
      dateLabels: string[]
    }

    const baseResp: ScenarioResp = {
      attendance: 50,
      vehicle: 'Sprinter',
      vehicleCost: 100,
      outbound: false,
      bacentaSprinterTopUp: 30,
      bacentaUrvanTopUp: 50,
      arrivalTime: '2024-01-07T08:00:00Z',
      leaderPhoneNumber: '0240000000',
      leaderFirstName: 'Kofi',
      dateLabels: [],
    }

    const mockGetVehicleRecord = (resp: Partial<ScenarioResp>) => {
      mockSession.run.mockResolvedValueOnce(
        makeMockQueryResult({ ...baseResp, ...resp })
      )
    }

    it('SM5: Sprinter, sprinterTopUp 30, vehicleCost 100, inbound only → topUp = 30 (bacenta sprinter rate, single direction)', async () => {
      mockGetVehicleRecord({})
      mockSession.run.mockResolvedValueOnce(
        makeMockQueryResult({
          record: { properties: { id: 'vr_1', vehicleTopUp: 30 } },
        })
      )

      await arrivalsMutation.SetVehicleSupport(null as never, setSupportArgs, context)

      const setCall = mockSession.run.mock.calls.find(
        ([cypher]) => cypher === setVehicleTopUp
      )
      expect(setCall).toBeDefined()
      expect(setCall?.[1]).toMatchObject({ vehicleTopUp: 30 })
    })

    it('SM5: Sprinter, sprinterTopUp 30, outbound true → topUp = 60 (rate × 2 for in-and-out)', async () => {
      mockGetVehicleRecord({ outbound: true, vehicleCost: 200 })
      mockSession.run.mockResolvedValueOnce(
        makeMockQueryResult({
          record: { properties: { id: 'vr_1', vehicleTopUp: 60 } },
        })
      )

      await arrivalsMutation.SetVehicleSupport(null as never, setSupportArgs, context)

      const setCall = mockSession.run.mock.calls.find(
        ([cypher]) => cypher === setVehicleTopUp
      )
      expect(setCall?.[1]).toMatchObject({ vehicleTopUp: 60 })
    })

    it('SM5: Urvan, urvanTopUp 50, inbound only → topUp = 50', async () => {
      mockGetVehicleRecord({ vehicle: 'Urvan', vehicleCost: 100 })
      mockSession.run.mockResolvedValueOnce(
        makeMockQueryResult({
          record: { properties: { id: 'vr_1', vehicleTopUp: 50 } },
        })
      )

      await arrivalsMutation.SetVehicleSupport(null as never, setSupportArgs, context)

      const setCall = mockSession.run.mock.calls.find(
        ([cypher]) => cypher === setVehicleTopUp
      )
      expect(setCall?.[1]).toMatchObject({ vehicleTopUp: 50 })
    })

    it('SM5: Sprinter, vehicleCost (20) < sprinterTopUp (30) → topUp clamps DOWN to vehicleCost (20)', async () => {
      // amountToPay (=vehicleCost) clamp branch
      mockGetVehicleRecord({ vehicleCost: 20 })
      mockSession.run.mockResolvedValueOnce(
        makeMockQueryResult({
          record: { properties: { id: 'vr_1', vehicleTopUp: 20 } },
        })
      )

      await arrivalsMutation.SetVehicleSupport(null as never, setSupportArgs, context)

      const setCall = mockSession.run.mock.calls.find(
        ([cypher]) => cypher === setVehicleTopUp
      )
      expect(setCall?.[1]).toMatchObject({ vehicleTopUp: 20 })
    })

    it('SM5: Sprinter, sprinterTopUp = 0 → topUp = 0; routed to noVehicleTopUp branch (not setVehicleTopUp)', async () => {
      mockGetVehicleRecord({ bacentaSprinterTopUp: 0, vehicleCost: 100 })
      mockSession.run.mockResolvedValueOnce(
        makeMockQueryResult({
          record: { properties: { id: 'vr_1', vehicleTopUp: 0 } },
        })
      )

      const result = await arrivalsMutation.SetVehicleSupport(
        null as never,
        setSupportArgs,
        context
      )

      // vehicleTopUp == 0 routes through noVehicleTopUp path (no SMS top-up promised)
      const noTopUpCall = mockSession.run.mock.calls.find(
        ([cypher]) => cypher === noVehicleTopUp
      )
      expect(noTopUpCall).toBeDefined()
      expect(result).toMatchObject({ id: 'vr_1', vehicleTopUp: 0 })
    })

    it('SM5: Car vehicle → topUp = 0 always; routed to noVehicleTopUp', async () => {
      mockGetVehicleRecord({
        vehicle: 'Car',
        attendance: 5,
        vehicleCost: 0,
      })
      mockSession.run.mockResolvedValueOnce(
        makeMockQueryResult({
          record: { properties: { id: 'vr_1', vehicleTopUp: 0, vehicle: 'Car' } },
        })
      )

      await arrivalsMutation.SetVehicleSupport(null as never, setSupportArgs, context)

      const noTopUpCall = mockSession.run.mock.calls.find(
        ([cypher]) => cypher === noVehicleTopUp
      )
      expect(noTopUpCall).toBeDefined()
    })

    it('SM5: attendance < 8 on a non-Car vehicle → throws "doesn\'t require a top up" and writes noVehicleTopUp', async () => {
      mockGetVehicleRecord({ attendance: 5, vehicleCost: 100 })
      mockSession.run.mockResolvedValueOnce(
        makeMockQueryResult({ record: { properties: { id: 'vr_1' } } })
      )

      await expect(
        arrivalsMutation.SetVehicleSupport(null as never, setSupportArgs, context)
      ).rejects.toThrow("Today's Bussing doesn't require a top up")

      const noTopUpCall = mockSession.run.mock.calls.find(
        ([cypher]) => cypher === noVehicleTopUp
      )
      expect(noTopUpCall).toBeDefined()
    })
  })

  // TODO(refactor): The SYN-70 outline asks tests to cover "foreign-currency
  // overrides honored". The VehicleRecord flow has NO foreign-currency support
  // in the resolver, the cypher, or the response shape — all math is GHS
  // (multiplied by 100 to kobo/pesewas at the Paystack call site). Foreign
  // currency is a ServiceRecord concept (kb/05-data-entities.md), not a
  // VehicleRecord one. Pinned here so anyone re-reading SYN-70 sees the
  // requirement does not match the current data model.
  it.todo(
    'SM5 TODO: VehicleRecord has no foreign-currency override surface — SYN-70 outline does not match the model'
  )
})

// ===========================================================================
// EDGE 3 — approved → paid: SendVehicleSupport (Paystack)
// ===========================================================================
describe('SM5 — approved → paid: SendVehicleSupport (Paystack)', () => {
  const sendArgs = {
    vehicleRecordId: 'vr_1',
    momoName: 'Kofi M',
    momoNumber: '0240000000',
    vehicleTopUp: 30,
    outbound: false,
  }

  const counterContext = (): Context =>
    ({
      ...context,
      jwt: { ...mockJwt, roles: ['arrivalsCounterStream'] },
    } as unknown as Context)

  it('SM5: isAuth is called with permitArrivalsHelpers(Stream) — counter OR payer can pay', async () => {
    // Configure axios for the transfer call only (no recipientCode path).
    mockSession.executeRead.mockResolvedValueOnce(
      makeMockQueryResult({
        record: {
          properties: {
            id: 'vr_1',
            transactionStatus: null,
            arrivalTime: '2024-01-07T08:00:00Z',
            attendance: 50,
            vehicleTopUp: 30,
            momoNumber: '0240000000',
            momoName: 'Kofi M',
            mobileNetwork: 'mtn',
            recipientCode: 'RCP_existing',
          },
        },
        stream: { properties: { bankAccount: 'fle_account' } },
        bacenta: { properties: { id: 'b_1', name: 'Bacenta 1' } },
        leader: {
          properties: {
            id: 'm_1',
            firstName: 'Kofi',
            lastName: 'Mensah',
            email: 'k@example.com',
          },
        },
      })
    )
    ;(axios as unknown as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          reference: 'ref_123',
          transfer_code: 'TRF_x',
          status: 'success',
        },
      },
    })
    mockSession.executeWrite.mockResolvedValueOnce({ records: [] })

    await arrivalsMutation.SendVehicleSupport(
      null as never,
      sendArgs,
      counterContext()
    )

    expect(isAuth).toHaveBeenCalledWith(
      permitArrivalsHelpers('Stream'),
      counterContext().jwt.roles
    )
  })

  it('SM5: paid edge calls Paystack /transfer with amount = vehicleTopUp * 100 (pesewas) and currency GHS', async () => {
    mockSession.executeRead.mockResolvedValueOnce(
      makeMockQueryResult({
        record: {
          properties: {
            id: 'vr_1',
            transactionStatus: null,
            arrivalTime: '2024-01-07T08:00:00Z',
            attendance: 50,
            vehicleTopUp: 30,
            momoNumber: '0240000000',
            momoName: 'Kofi M',
            mobileNetwork: 'mtn',
            recipientCode: 'RCP_existing',
          },
        },
        stream: { properties: { bankAccount: 'fle_account' } },
        bacenta: { properties: { id: 'b_1', name: 'Bacenta 1' } },
        leader: {
          properties: {
            id: 'm_1',
            firstName: 'Kofi',
            lastName: 'Mensah',
            email: 'k@example.com',
          },
        },
      })
    )
    ;(axios as unknown as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          reference: 'ref_123',
          transfer_code: 'TRF_x',
          status: 'success',
        },
      },
    })
    mockSession.executeWrite.mockResolvedValueOnce({ records: [] })

    await arrivalsMutation.SendVehicleSupport(null as never, sendArgs, context)

    const transferCall = (axios as unknown as jest.Mock).mock.calls.find(
      ([cfg]) => cfg?.url === '/transfer'
    )
    expect(transferCall).toBeDefined()
    expect(transferCall?.[0]).toMatchObject({
      method: 'post',
      url: '/transfer',
      data: {
        source: 'balance',
        // 30 GHS × 100 pesewas-per-GHS = 3000
        amount: 3000,
        currency: 'GHS',
        recipient: 'RCP_existing',
      },
    })
  })

  it('SM5: paid edge writes setVehicleRecordTransactionSuccessful with the Paystack reference', async () => {
    mockSession.executeRead.mockResolvedValueOnce(
      makeMockQueryResult({
        record: {
          properties: {
            id: 'vr_1',
            transactionStatus: null,
            arrivalTime: '2024-01-07T08:00:00Z',
            attendance: 50,
            vehicleTopUp: 30,
            momoNumber: '0240000000',
            momoName: 'Kofi M',
            mobileNetwork: 'mtn',
            recipientCode: 'RCP_existing',
          },
        },
        stream: { properties: { bankAccount: 'fle_account' } },
        bacenta: { properties: { id: 'b_1', name: 'Bacenta 1' } },
        leader: {
          properties: {
            id: 'm_1',
            firstName: 'Kofi',
            lastName: 'Mensah',
            email: 'k@example.com',
          },
        },
      })
    )
    ;(axios as unknown as jest.Mock).mockResolvedValueOnce({
      data: {
        data: {
          reference: 'ref_abc',
          transfer_code: 'TRF_zzz',
          status: 'success',
        },
      },
    })
    mockSession.executeWrite.mockResolvedValueOnce({ records: [] })

    await arrivalsMutation.SendVehicleSupport(null as never, sendArgs, context)

    // The transaction-successful write happens via executeWrite, with the
    // setVehicleRecordTransactionSuccessful cypher constant.
    expect(mockSession.executeWrite).toHaveBeenCalledTimes(1)
    const writeArg = mockSession.executeWrite.mock.calls[0][0]
    // executeWrite receives a callback (tx) => tx.run(cypher, params).
    // We invoke it with a fake tx to capture the cypher/params actually sent.
    const fakeTx = { run: jest.fn().mockResolvedValue({ records: [] }) }
    await writeArg(fakeTx)
    expect(fakeTx.run).toHaveBeenCalledWith(
      setVehicleRecordTransactionSuccessful,
      expect.objectContaining({
        transactionReference: 'ref_abc',
        transferCode: 'TRF_zzz',
        responseStatus: 'success',
      })
    )
  })

  describe('SM5 — paid-edge idempotency (ADR-005)', () => {
    it('SM5: re-paying a VehicleRecord with transactionStatus === "success" rejects — Paystack and executeWrite never called (ADR-005)', async () => {
      mockSession.executeRead.mockResolvedValueOnce(
        makeMockQueryResult({
          record: {
            properties: {
              id: 'vr_already_paid',
              transactionStatus: 'success',
              arrivalTime: '2024-01-07T08:00:00Z',
              attendance: 50,
              vehicleTopUp: 30,
            },
          },
          stream: { properties: { bankAccount: 'fle_account' } },
          bacenta: { properties: { id: 'b_1', name: 'Bacenta 1' } },
          leader: {
            properties: {
              id: 'm_1',
              firstName: 'Kofi',
              lastName: 'Mensah',
              email: 'k@example.com',
            },
          },
        })
      )

      await expect(
        arrivalsMutation.SendVehicleSupport(null as never, sendArgs, context)
      ).rejects.toThrow()

      expect(axios as unknown as jest.Mock).not.toHaveBeenCalled()
      expect(mockSession.executeWrite).not.toHaveBeenCalled()
    })

    it('SM5: unconfirmed VehicleRecord (no arrivalTime) is not eligible — Paystack and executeWrite never fire', async () => {
      mockSession.executeRead.mockResolvedValueOnce(
        makeMockQueryResult({
          record: {
            properties: {
              id: 'vr_uncounted',
              transactionStatus: null,
              arrivalTime: null,
              attendance: 0,
              vehicleTopUp: 0,
            },
          },
          stream: { properties: { bankAccount: 'fle_account' } },
          bacenta: { properties: { id: 'b_1', name: 'Bacenta 1' } },
          leader: {
            properties: {
              id: 'm_1',
              firstName: 'Kofi',
              lastName: 'Mensah',
              email: 'k@example.com',
            },
          },
        })
      )

      await expect(
        arrivalsMutation.SendVehicleSupport(null as never, sendArgs, context)
      ).rejects.toThrow()

      expect(axios as unknown as jest.Mock).not.toHaveBeenCalled()
      expect(mockSession.executeWrite).not.toHaveBeenCalled()
    })

    it('SM5: attendance < 8 → not eligible; Paystack and executeWrite never called', async () => {
      mockSession.executeRead.mockResolvedValueOnce(
        makeMockQueryResult({
          record: {
            properties: {
              id: 'vr_small',
              transactionStatus: null,
              arrivalTime: '2024-01-07T08:00:00Z',
              attendance: 5,
              vehicleTopUp: 30,
            },
          },
          stream: { properties: { bankAccount: 'fle_account' } },
          bacenta: { properties: { id: 'b_1', name: 'Bacenta 1' } },
          leader: {
            properties: {
              id: 'm_1',
              firstName: 'Kofi',
              lastName: 'Mensah',
              email: 'k@example.com',
            },
          },
        })
      )

      await expect(
        arrivalsMutation.SendVehicleSupport(null as never, sendArgs, context)
      ).rejects.toThrow()

      expect(axios as unknown as jest.Mock).not.toHaveBeenCalled()
      expect(mockSession.executeWrite).not.toHaveBeenCalled()
    })

    it('SM5: re-paying surfaces the correct error message — "Money has already been sent to this bacenta" (SYN-118)', async () => {
      mockSession.executeRead.mockResolvedValueOnce(
        makeMockQueryResult({
          record: {
            properties: {
              id: 'vr_already_paid',
              transactionStatus: 'success',
              arrivalTime: '2024-01-07T08:00:00Z',
              attendance: 50,
              vehicleTopUp: 30,
            },
          },
          stream: { properties: { bankAccount: 'fle_account' } },
          bacenta: { properties: { id: 'b_1', name: 'Bacenta 1' } },
          leader: {
            properties: {
              id: 'm_1',
              firstName: 'Kofi',
              lastName: 'Mensah',
              email: 'k@example.com',
            },
          },
        })
      )

      await expect(
        arrivalsMutation.SendVehicleSupport(null as never, sendArgs, context)
      ).rejects.toThrow('Money has already been sent to this bacenta')
    })
  })

  it('SM5: setVehicleRecordTransactionSuccessful Cypher writes transactionStatus + transactionReference + paystackTransferCode in one SET', () => {
    expect(setVehicleRecordTransactionSuccessful).toMatch(
      /SET record\.transactionStatus = \$responseStatus,\s*record\.transactionReference = \$transactionReference,\s*record\.paystackTransferCode = \$transferCode/
    )
  })
})

// ===========================================================================
// NEGATIVE AUTH — roles outside the matrix
// ===========================================================================
describe('SM5 — negative auth: roles outside the SM5 matrix cannot transition', () => {
  it('SM5: ConfirmVehicleByAdmin — isAuth throws FORBIDDEN for a non-counter role (leaderBacenta)', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('You are not permitted to run this mutation')
    })

    await expect(
      arrivalsMutation.ConfirmVehicleByAdmin(
        null as never,
        {
          bacentaId: 'b_1',
          bussingRecordId: 'br_1',
          vehicleRecordId: 'vr_1',
          leaderDeclaration: 20,
          attendance: 25,
          vehicle: 'Sprinter',
          picture: 'p',
        } as never,
        context
      )
    ).rejects.toThrow('not permitted')
  })

  it('SM5: SetVehicleSupport — isAuth throws FORBIDDEN for tellerStream (not in the helpers list)', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('You are not permitted to run this mutation')
    })

    const tellerContext = {
      ...context,
      jwt: { ...mockJwt, roles: ['tellerStream'] },
    } as unknown as Context

    await expect(
      arrivalsMutation.SetVehicleSupport(
        null as never,
        { vehicleRecordId: 'vr_1' },
        tellerContext
      )
    ).rejects.toThrow('not permitted')
  })

  it('SM5: SendVehicleSupport — isAuth throws FORBIDDEN for a plain leaderBacenta', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('You are not permitted to run this mutation')
    })

    await expect(
      arrivalsMutation.SendVehicleSupport(
        null as never,
        {
          vehicleRecordId: 'vr_1',
          momoName: 'x',
          momoNumber: '0240000000',
          vehicleTopUp: 30,
          outbound: false,
        },
        context
      )
    ).rejects.toThrow('not permitted')
  })

  it('SM5: RecordVehicleFromBacenta — isAuth throws FORBIDDEN for arrivalsCounterStream (counters cannot submit)', async () => {
    ;(isAuth as jest.Mock).mockImplementationOnce(() => {
      throw new Error('You are not permitted to run this mutation')
    })

    const counterContext = {
      ...context,
      jwt: { ...mockJwt, roles: ['arrivalsCounterStream'] },
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
        counterContext
      )
    ).rejects.toThrow('not permitted')
  })

  // NOTE: tellerStream has no edge in SM5 at all. The ticket asks "Approved
  // → Paid only via tellerStream" — characterised here as NOT the case: the
  // paid edge runs under permitArrivalsHelpers('Stream') = arrivalsCounterStream
  // + arrivalsPayerCouncil. tellerStream is the SM2 (banking) confirmer, not
  // an SM5 actor.
})
