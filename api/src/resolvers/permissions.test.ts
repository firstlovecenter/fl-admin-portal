import { permitLeader } from './permissions'
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
