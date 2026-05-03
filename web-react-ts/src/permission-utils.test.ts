import { describe, it, expect } from 'vitest'
import { ChurchLevel } from 'global-types'
import { permitLeader } from 'permission-utils'

describe('permitLeader', () => {
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
})
