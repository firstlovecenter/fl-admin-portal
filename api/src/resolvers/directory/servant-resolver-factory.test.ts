/**
 * SM4 — Characterization tests for the servant-resolver factory
 *
 * SM4 (kb/04-state-machines.md / ADR-006): Every servant make/remove operation
 * goes through servant-config.ts + servant-resolver-factory.ts. Hand-rolled
 * MakeXLeader resolvers are banned. The factory generates all 22 resolvers
 * from a declarative config — adding a new servant type requires one line in
 * servant-config.ts and zero additional code.
 *
 * Tests pin:
 *   - Factory shape: every SERVANT_MUTATIONS entry produces a function resolver
 *   - Handler routing: 'make' entries call MakeServant; 'remove' calls RemoveServant
 *   - Permission routing: Bacenta Leader uses permitAdminArrivals; others use permitAdmin
 *   - Coverage: no extra resolver keys beyond what the config declares
 *
 * All test names begin with "SM4:" for grep-ability (SYN-69):
 *   npm test -- servant-resolver-factory --testNamePattern="SM4:"
 */

jest.mock('./make-remove-servants', () => ({
  MakeServant: jest.fn().mockResolvedValue({
    id: 'mock-member',
    firstName: 'Test',
    lastName: 'Member',
  }),
  RemoveServant: jest.fn().mockResolvedValue({
    id: 'mock-member',
    firstName: 'Test',
    lastName: 'Member',
  }),
}))

jest.mock('../utils/utils', () => ({
  ...jest.requireActual('../utils/utils'),
  isAuth: jest.fn(),
}))

import servantResolvers from './servant-resolver-factory'
import { SERVANT_MUTATIONS } from './servant-config'
import { MakeServant, RemoveServant } from './make-remove-servants'
import { isAuth } from '../utils/utils'
import type { Context } from '../utils/neo4j-types'
import type { Member } from '../utils/types'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockJwt = {
  userId: 'user_test',
  sub: 'user_test',
  roles: ['adminGovernorship'],
  iss: 'test',
  aud: ['test'],
  iat: 0,
  exp: 9999999999,
  scope: 'openid',
  azp: 'test',
  permissions: ['adminGovernorship'],
}

const mockContext = {
  jwt: mockJwt,
  executionContext: { session: jest.fn() },
} as unknown as Context

const mockArgs = {
  id: 'member_1',
  bacentaId: 'bacenta_1',
  leaderId: 'member_1',
} as unknown as Member

// ---------------------------------------------------------------------------
// Shape — every config entry produces a function resolver
// ---------------------------------------------------------------------------
describe('SM4 — factory shape: resolver map covers every SERVANT_MUTATIONS entry', () => {
  it('SM4: resolver map has exactly as many keys as SERVANT_MUTATIONS entries', () => {
    expect(Object.keys(servantResolvers)).toHaveLength(SERVANT_MUTATIONS.length)
  })

  it('SM4: every SERVANT_MUTATIONS entry name is a key in the resolver map', () => {
    SERVANT_MUTATIONS.forEach((config) => {
      expect(servantResolvers).toHaveProperty(config.name)
    })
  })

  it('SM4: every resolver in the map is a function (no undefined entries from bad config)', () => {
    SERVANT_MUTATIONS.forEach((config) => {
      expect(typeof servantResolvers[config.name]).toBe('function')
    })
  })

  it('SM4: resolver map has no extra keys beyond SERVANT_MUTATIONS names (factory does not invent resolvers)', () => {
    const configNames = new Set(SERVANT_MUTATIONS.map((c) => c.name))
    Object.keys(servantResolvers).forEach((key) => {
      expect(configNames.has(key)).toBe(true)
    })
  })
})

// ---------------------------------------------------------------------------
// Handler routing — make → MakeServant, remove → RemoveServant
// ---------------------------------------------------------------------------
describe('SM4 — factory routing: make entries call MakeServant, remove entries call RemoveServant', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('SM4: a make resolver calls MakeServant with the correct churchType and servantType', async () => {
    const makeConfig = SERVANT_MUTATIONS.find((c) => c.action === 'make')!

    await servantResolvers[makeConfig.name](null, mockArgs, mockContext)

    expect(MakeServant).toHaveBeenCalledWith(
      mockContext,
      mockArgs,
      expect.any(Array),
      makeConfig.churchType,
      makeConfig.servantType
    )
    expect(RemoveServant).not.toHaveBeenCalled()
  })

  it('SM4: a remove resolver calls RemoveServant with the correct churchType and servantType', async () => {
    const removeConfig = SERVANT_MUTATIONS.find((c) => c.action === 'remove')!

    await servantResolvers[removeConfig.name](null, mockArgs, mockContext)

    expect(RemoveServant).toHaveBeenCalledWith(
      mockContext,
      mockArgs,
      expect.any(Array),
      removeConfig.churchType,
      removeConfig.servantType
    )
    expect(MakeServant).not.toHaveBeenCalled()
  })

  it('SM4: MakeBacentaLeader routes to MakeServant (not RemoveServant)', async () => {
    await servantResolvers['MakeBacentaLeader'](null, mockArgs, mockContext)
    expect(MakeServant).toHaveBeenCalledTimes(1)
    expect(RemoveServant).not.toHaveBeenCalled()
  })

  it('SM4: RemoveBacentaLeader routes to RemoveServant (not MakeServant)', async () => {
    await servantResolvers['RemoveBacentaLeader'](null, mockArgs, mockContext)
    expect(RemoveServant).toHaveBeenCalledTimes(1)
    expect(MakeServant).not.toHaveBeenCalled()
  })

  it('SM4: each resolver is called once per invocation — MakeServant not double-called', async () => {
    await servantResolvers['MakeCampusAdmin'](null, mockArgs, mockContext)
    expect(MakeServant).toHaveBeenCalledTimes(1)
  })
})

// ---------------------------------------------------------------------------
// Permission routing — Bacenta Leader uses permitAdminArrivals; others use permitAdmin
// ---------------------------------------------------------------------------
describe('SM4 — factory permission routing: correct role arrays per config entry', () => {
  const { permitAdmin, permitAdminArrivals } =
    jest.requireActual('../permissions') as typeof import('../permissions')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('SM4: MakeBacentaLeader passes permitAdminArrivals(Governorship) to MakeServant', async () => {
    await servantResolvers['MakeBacentaLeader'](null, mockArgs, mockContext)

    expect(MakeServant).toHaveBeenCalledWith(
      mockContext,
      mockArgs,
      permitAdminArrivals('Governorship'),
      'Bacenta',
      'Leader'
    )
  })

  it('SM4: MakeCampusAdmin passes permitAdmin(Oversight) to MakeServant (standard admin hierarchy)', async () => {
    await servantResolvers['MakeCampusAdmin'](null, mockArgs, mockContext)

    expect(MakeServant).toHaveBeenCalledWith(
      mockContext,
      mockArgs,
      permitAdmin('Oversight'),
      'Campus',
      'Admin'
    )
  })

  it('SM4: MakeOversightLeader passes permitAdmin(Denomination) to MakeServant', async () => {
    await servantResolvers['MakeOversightLeader'](null, mockArgs, mockContext)

    expect(MakeServant).toHaveBeenCalledWith(
      mockContext,
      mockArgs,
      permitAdmin('Denomination'),
      'Oversight',
      'Leader'
    )
  })

  it('SM4: RemoveCouncilLeader passes permitAdmin(Stream) to RemoveServant', async () => {
    await servantResolvers['RemoveCouncilLeader'](null, mockArgs, mockContext)

    expect(RemoveServant).toHaveBeenCalledWith(
      mockContext,
      mockArgs,
      permitAdmin('Stream'),
      'Council',
      'Leader'
    )
  })

  it('SM4: MakeDenominationLeader passes permitAdmin(Denomination) to MakeServant and gates on fishers separately', async () => {
    await servantResolvers['MakeDenominationLeader'](null, mockArgs, mockContext)

    // Denomination Leader is a two-part gate: the role array forwarded to the
    // handler is permitAdmin('Denomination'); the coarse `fishers` marker is
    // enforced as a separate JWT-only isAuth guard (it maps to no servant edge,
    // so it is never passed through to MakeServant).
    expect(MakeServant).toHaveBeenCalledWith(
      mockContext,
      mockArgs,
      permitAdmin('Denomination'),
      'Denomination',
      'Leader'
    )
    expect(isAuth).toHaveBeenCalledWith(['fishers'], mockJwt.roles)
  })
})

// ---------------------------------------------------------------------------
// Context and args forwarding — resolvers pass through unchanged
// ---------------------------------------------------------------------------
describe('SM4 — factory contract: context and args forwarded to handler unchanged', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('SM4: the make resolver forwards context as-is to MakeServant', async () => {
    await servantResolvers['MakeGovernorshipLeader'](null, mockArgs, mockContext)

    const [[calledContext]] = (MakeServant as jest.Mock).mock.calls
    expect(calledContext).toBe(mockContext)
  })

  it('SM4: the make resolver forwards args as-is to MakeServant', async () => {
    await servantResolvers['MakeGovernorshipLeader'](null, mockArgs, mockContext)

    const [[, calledArgs]] = (MakeServant as jest.Mock).mock.calls
    expect(calledArgs).toBe(mockArgs)
  })
})
