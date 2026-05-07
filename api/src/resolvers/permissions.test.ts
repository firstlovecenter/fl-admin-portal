import { permitLeader, permitLeaderAdmin, permitMe } from './permissions'
import type { ChurchLevel } from './utils/types'

describe('permitLeader (api)', () => {
  it('grants only leaderDenomination at the denomination level', () => {
    expect(permitLeader('Denomination')).toEqual(['leaderDenomination'])
  })

  it('grants leaderDenomination and leaderOversight at the oversight level', () => {
    expect(permitLeader('Oversight')).toEqual([
      'leaderDenomination',
      'leaderOversight',
    ])
  })

  // Characterises the load-bearing `.toLowerCase()` inside permitLeader.
  // The ChurchLevel type is title-cased, but the implementation lowercases
  // before matching — a refactor that drops the call would silently break
  // any non-canonical caller.
  it('matches case-insensitively at runtime', () => {
    expect(permitLeader('denomination' as ChurchLevel)).toEqual([
      'leaderDenomination',
    ])
  })

  // Pins the default branch: an unknown level returns the initial empty
  // array. A refactor that throws or returns undefined here would change
  // the resolver-side authorisation behaviour silently.
  it('returns an empty list for an unrecognised church level', () => {
    expect(permitLeader('NotAChurchLevel' as ChurchLevel)).toEqual([])
  })
})

// Regression cover: membership exports gate on `permitLeaderAdmin`, not
// `permitMe`. The arrivals-counter / arrivals-payer / teller roles do bus
// arrivals + banking — they have no business pulling full member PII (phone,
// WhatsApp, email, DOB) for an entire branch of the hierarchy.
describe('permitLeaderAdmin scope (membership-export gate)', () => {
  const SENSITIVE_ROLES = [
    'arrivalsCounterStream',
    'arrivalsPayerCouncil',
    'tellerStream',
  ] as const

  it.each(['Bacenta', 'Governorship', 'Council', 'Stream'] as const)(
    'excludes arrivals/teller roles at %s level',
    (level) => {
      const allowed = permitLeaderAdmin(level)
      for (const role of SENSITIVE_ROLES) {
        expect(allowed).not.toContain(role)
      }
    }
  )

  it('still includes arrivals/teller roles in permitMe (lookup gate)', () => {
    // permitMe is correct for member-lookup resolvers (e.g. directory search)
    // — those roles legitimately need to resolve a member by id during their
    // workflow. Pin so a future "tighten everything" refactor doesn't widen
    // the export gate by accident.
    const allowed = permitMe('Stream')
    expect(allowed).toContain('arrivalsCounterStream')
    expect(allowed).toContain('arrivalsPayerCouncil')
    expect(allowed).toContain('tellerStream')
  })
})
