/**
 * Characterization tests for web-react-ts/src/permission-utils.ts
 *
 * Mirrors api/src/resolvers/permissions.test.ts (ADR-001).
 * Shared scenario data lives in lib/permission-test-scenarios.ts so
 * a role addition only requires one edit.
 *
 * Sections:
 *   1. permitLeader    — every level + case-insensitivity + unknown
 *   2. permitAdmin     — every level (Bacenta drift vs BE is pinned)
 *   3. permitLeaderAdmin — composition; membership-export gate
 *   4. permitArrivals  — every level; Stream prepend special case
 *   5. permitArrivalsHelpers — Stream-only non-empty
 *   6. permitArrivalsCounter / permitArrivalsPayer — fixed singletons
 *   7. permitTellerStream — fixed singleton
 *   8. permitMe        — composition; includes specialist roles at Stream
 *   9. permitLeaderAdminArrivals — composition
 *  10. permitAdminArrivals       — composition
 *  11. permitShepherdingControl  — fixed list, level-independent
 */
import { describe, it, expect } from 'vitest'
import type { ChurchLevel } from 'global-types'
import {
  permitLeader,
  permitAdmin,
  permitLeaderAdmin,
  permitMe,
  permitArrivals,
  permitArrivalsHelpers,
  permitArrivalsCounter,
  permitArrivalsPayer,
  permitTellerStream,
  permitLeaderAdminArrivals,
  permitAdminArrivals,
  permitShepherdingControl,
} from 'permission-utils'
import {
  ALL_CHURCH_LEVELS,
  LEADER_SCENARIOS,
  ADMIN_SCENARIOS,
  ARRIVALS_SCENARIOS,
  ARRIVALS_HELPERS_SCENARIOS,
  SENSITIVE_ROLES,
  SHEPHERDING_CONTROL_ROLES,
} from '../../lib/permission-test-scenarios'

// ---------------------------------------------------------------------------
// 1. permitLeader
// ---------------------------------------------------------------------------
describe('permitLeader (FE)', () => {
  it.each(ALL_CHURCH_LEVELS)(
    'returns the correct leader role list at %s',
    (level) => {
      expect(permitLeader(level)).toEqual(LEADER_SCENARIOS[level])
    }
  )

  // The implementation uses .toLowerCase() before the switch — a refactor that
  // removes that call would silently break any caller passing a lower-cased string
  // (e.g. values read from Neo4j labels or URL params).
  it('matches case-insensitively for "denomination" (lowercase input)', () => {
    expect(permitLeader('denomination' as ChurchLevel)).toEqual(
      LEADER_SCENARIOS.Denomination
    )
  })

  it('matches case-insensitively for "bacenta" (lowercase input)', () => {
    expect(permitLeader('bacenta' as ChurchLevel)).toEqual(
      LEADER_SCENARIOS.Bacenta
    )
  })

  it('returns [] for an unrecognised level (default branch, no throw)', () => {
    expect(permitLeader('Fellowship' as ChurchLevel)).toEqual([])
    expect(permitLeader('' as ChurchLevel)).toEqual([])
  })

  // Hierarchical invariant: every level includes leaderDenomination.
  it.each(ALL_CHURCH_LEVELS)(
    'always includes leaderDenomination at %s (top-down hierarchy)',
    (level) => {
      expect(permitLeader(level)).toContain('leaderDenomination')
    }
  )

  // Containment invariant: Bacenta is the widest set; every higher level's
  // set is a subset.
  it('Bacenta result is a superset of Denomination result', () => {
    const bacentaRoles = permitLeader('Bacenta')
    for (const role of permitLeader('Denomination')) {
      expect(bacentaRoles).toContain(role)
    }
  })

  // leaderBacenta must NOT appear above Bacenta
  it.each(['Governorship', 'Council', 'Stream', 'Campus', 'Oversight', 'Denomination'] as ChurchLevel[])(
    'does NOT include leaderBacenta at %s',
    (level) => {
      expect(permitLeader(level)).not.toContain('leaderBacenta')
    }
  )
})

// ---------------------------------------------------------------------------
// 2. permitAdmin
// ---------------------------------------------------------------------------
describe('permitAdmin (FE)', () => {
  it.each(
    Object.entries(ADMIN_SCENARIOS) as [ChurchLevel, string[]][]
  )('returns the correct admin role list at %s', (level, expected) => {
    expect(permitAdmin(level)).toEqual(expected)
  })

  it('returns [] for an unrecognised level (default branch, no throw)', () => {
    expect(permitAdmin('Fellowship' as ChurchLevel)).toEqual([])
  })

  // Case sensitivity: permitAdmin does NOT use .toLowerCase() — 'bacenta' (lowercase)
  // will hit the default branch.
  it('is case-sensitive — lowercase "bacenta" returns [] (no .toLowerCase())', () => {
    expect(permitAdmin('bacenta' as ChurchLevel)).toEqual([])
  })

  // adminDenomination must appear at every level.
  it.each(ALL_CHURCH_LEVELS)(
    'always includes adminDenomination at %s',
    (level) => {
      expect(permitAdmin(level)).toContain('adminDenomination')
    }
  )

  // No admin role for Bacenta itself — admin roles start at Governorship.
  it.each(ALL_CHURCH_LEVELS)(
    'never includes adminBacenta or adminFellowship at %s (those roles do not exist)',
    (level) => {
      const roles = permitAdmin(level)
      expect(roles).not.toContain('adminBacenta')
      expect(roles).not.toContain('adminFellowship')
    }
  )
})

// ---------------------------------------------------------------------------
// 3. permitLeaderAdmin — composition + membership-export gate
// ---------------------------------------------------------------------------
describe('permitLeaderAdmin (FE)', () => {
  // Should contain everything from permitLeader AND permitAdmin at each level.
  it.each(ALL_CHURCH_LEVELS)(
    'contains all permitLeader roles at %s',
    (level) => {
      const result = permitLeaderAdmin(level)
      for (const role of permitLeader(level)) {
        expect(result).toContain(role)
      }
    }
  )

  it.each(ALL_CHURCH_LEVELS)(
    'contains all permitAdmin roles at %s',
    (level) => {
      const result = permitLeaderAdmin(level)
      for (const role of permitAdmin(level)) {
        expect(result).toContain(role)
      }
    }
  )

  // Membership-export gate: arrivals-specialist and teller roles must NOT
  // appear here.  They can look up individuals but must not export member PII
  // for a whole branch.
  it.each(['Bacenta', 'Governorship', 'Council', 'Stream'] as ChurchLevel[])(
    'excludes specialist (arrivals/teller) roles at %s — membership-export gate',
    (level) => {
      const allowed = permitLeaderAdmin(level)
      for (const role of SENSITIVE_ROLES) {
        expect(allowed).not.toContain(role)
      }
    }
  )
})

// ---------------------------------------------------------------------------
// 4. permitArrivals
// ---------------------------------------------------------------------------
describe('permitArrivals (FE)', () => {
  it.each(ALL_CHURCH_LEVELS)(
    'returns the correct arrivals role list at %s',
    (level) => {
      expect(permitArrivals(level)).toEqual(ARRIVALS_SCENARIOS[level])
    }
  )

  // The Stream case prepends permitAdmin('Stream') roles before the two
  // arrivals-admin roles.  This is explicit in the source: the switch sets
  // permittedFor, then the if block returns [...permitAdmin(level), ...permittedFor].
  it('Stream result starts with permitAdmin("Stream") roles', () => {
    const streamResult = permitArrivals('Stream')
    const adminStreamRoles = permitAdmin('Stream')
    expect(streamResult.slice(0, adminStreamRoles.length)).toEqual(
      adminStreamRoles
    )
  })

  it('Stream result ends with arrivalsAdminCampus and arrivalsAdminStream', () => {
    const streamResult = permitArrivals('Stream')
    expect(streamResult).toContain('arrivalsAdminCampus')
    expect(streamResult).toContain('arrivalsAdminStream')
    // but NOT the Council/Governorship arrivals roles
    expect(streamResult).not.toContain('arrivalsAdminCouncil')
    expect(streamResult).not.toContain('arrivalsAdminGovernorship')
  })

  it('Bacenta and Governorship return the same four arrivals-admin roles', () => {
    expect(permitArrivals('Bacenta')).toEqual(permitArrivals('Governorship'))
  })

  it('returns [] for Oversight (no arrivals concept above Campus)', () => {
    expect(permitArrivals('Oversight')).toEqual([])
  })

  it('returns [] for Denomination', () => {
    expect(permitArrivals('Denomination')).toEqual([])
  })

  it('returns [] for an unrecognised level (default branch)', () => {
    expect(permitArrivals('Fellowship' as ChurchLevel)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// 5. permitArrivalsHelpers
// ---------------------------------------------------------------------------
describe('permitArrivalsHelpers (FE)', () => {
  it.each(ALL_CHURCH_LEVELS)(
    'returns the correct helpers list at %s',
    (level) => {
      expect(permitArrivalsHelpers(level)).toEqual(
        ARRIVALS_HELPERS_SCENARIOS[level]
      )
    }
  )

  it('returns counter and payer at Stream only', () => {
    expect(permitArrivalsHelpers('Stream')).toEqual([
      'arrivalsCounterStream',
      'arrivalsPayerCouncil',
    ])
  })

  it('returns [] for every level other than Stream', () => {
    const nonStream: ChurchLevel[] = [
      'Bacenta',
      'Governorship',
      'Council',
      'Campus',
      'Oversight',
      'Denomination',
    ]
    for (const level of nonStream) {
      expect(permitArrivalsHelpers(level)).toEqual([])
    }
  })
})

// ---------------------------------------------------------------------------
// 6. permitArrivalsCounter / permitArrivalsPayer — fixed singletons
// ---------------------------------------------------------------------------
describe('permitArrivalsCounter (FE)', () => {
  it('returns exactly ["arrivalsCounterStream"]', () => {
    expect(permitArrivalsCounter()).toEqual(['arrivalsCounterStream'])
  })

  it('returns a new array on each call (not a shared reference)', () => {
    expect(permitArrivalsCounter()).not.toBe(permitArrivalsCounter())
  })
})

describe('permitArrivalsPayer (FE)', () => {
  it('returns exactly ["arrivalsPayerCouncil"]', () => {
    expect(permitArrivalsPayer()).toEqual(['arrivalsPayerCouncil'])
  })
})

// ---------------------------------------------------------------------------
// 7. permitTellerStream — fixed singleton
// ---------------------------------------------------------------------------
describe('permitTellerStream (FE)', () => {
  it('returns exactly ["tellerStream"]', () => {
    expect(permitTellerStream()).toEqual(['tellerStream'])
  })
})

// ---------------------------------------------------------------------------
// 8. permitMe — composition
// ---------------------------------------------------------------------------
describe('permitMe (FE)', () => {
  // permitMe = permitLeaderAdmin + permitArrivals + permitArrivalsHelpers + permitTellerStream
  it.each(ALL_CHURCH_LEVELS)(
    'contains all permitLeaderAdmin roles at %s',
    (level) => {
      const result = permitMe(level)
      for (const role of permitLeaderAdmin(level)) {
        expect(result).toContain(role)
      }
    }
  )

  it.each(ALL_CHURCH_LEVELS)(
    'contains all permitArrivals roles at %s',
    (level) => {
      const result = permitMe(level)
      for (const role of permitArrivals(level)) {
        expect(result).toContain(role)
      }
    }
  )

  it('includes arrivalsCounterStream and arrivalsPayerCouncil at Stream level', () => {
    const result = permitMe('Stream')
    expect(result).toContain('arrivalsCounterStream')
    expect(result).toContain('arrivalsPayerCouncil')
  })

  it('does NOT include arrivalsCounterStream at non-Stream levels', () => {
    for (const level of ['Bacenta', 'Governorship', 'Council', 'Campus', 'Oversight', 'Denomination'] as ChurchLevel[]) {
      expect(permitMe(level)).not.toContain('arrivalsCounterStream')
    }
  })

  // tellerStream is always included (added via permitTellerStream())
  it.each(ALL_CHURCH_LEVELS)(
    'always includes tellerStream at %s',
    (level) => {
      expect(permitMe(level)).toContain('tellerStream')
    }
  )

  // Contrast with permitLeaderAdmin: specialised roles are present in permitMe
  // but absent from permitLeaderAdmin — used for the member-lookup vs export gate.
  it('includes sensitive roles that permitLeaderAdmin excludes at Stream', () => {
    const meRoles = permitMe('Stream')
    const leaderAdminRoles = permitLeaderAdmin('Stream')
    for (const role of SENSITIVE_ROLES) {
      expect(meRoles).toContain(role)
      expect(leaderAdminRoles).not.toContain(role)
    }
  })
})

// ---------------------------------------------------------------------------
// 9. permitLeaderAdminArrivals — composition
// ---------------------------------------------------------------------------
describe('permitLeaderAdminArrivals (FE)', () => {
  it.each(ALL_CHURCH_LEVELS)(
    'contains all permitLeaderAdmin and permitArrivals roles at %s',
    (level) => {
      const result = permitLeaderAdminArrivals(level)
      for (const role of permitLeaderAdmin(level)) {
        expect(result).toContain(role)
      }
      for (const role of permitArrivals(level)) {
        expect(result).toContain(role)
      }
    }
  )

  // Does NOT include counter/payer/teller — those come from permitArrivalsHelpers
  // and permitTellerStream which are NOT part of this helper.
  it('does NOT include arrivalsCounterStream or tellerStream', () => {
    for (const level of ALL_CHURCH_LEVELS) {
      expect(permitLeaderAdminArrivals(level)).not.toContain(
        'arrivalsCounterStream'
      )
      expect(permitLeaderAdminArrivals(level)).not.toContain('tellerStream')
    }
  })
})

// ---------------------------------------------------------------------------
// 10. permitAdminArrivals — composition
// ---------------------------------------------------------------------------
describe('permitAdminArrivals (FE)', () => {
  it.each(ALL_CHURCH_LEVELS)(
    'contains all permitAdmin and permitArrivals roles at %s',
    (level) => {
      const result = permitAdminArrivals(level)
      for (const role of permitAdmin(level)) {
        expect(result).toContain(role)
      }
      for (const role of permitArrivals(level)) {
        expect(result).toContain(role)
      }
    }
  )

  // Does NOT include any leader roles
  it.each(ALL_CHURCH_LEVELS)(
    'does NOT include leaderBacenta or leaderGovernorship at %s',
    (level) => {
      const result = permitAdminArrivals(level)
      expect(result).not.toContain('leaderBacenta')
      expect(result).not.toContain('leaderGovernorship')
    }
  )
})

// ---------------------------------------------------------------------------
// 11. permitShepherdingControl — fixed list, level-independent
// ---------------------------------------------------------------------------
describe('permitShepherdingControl (FE)', () => {
  it('returns the full shepherding-control role set', () => {
    expect(permitShepherdingControl()).toEqual(SHEPHERDING_CONTROL_ROLES)
  })

  it('includes all leader roles from Governorship up (not leaderBacenta)', () => {
    const result = permitShepherdingControl()
    expect(result).toContain('leaderGovernorship')
    expect(result).toContain('leaderCouncil')
    expect(result).toContain('leaderStream')
    expect(result).toContain('leaderCampus')
    expect(result).toContain('leaderOversight')
    expect(result).toContain('leaderDenomination')
    // leaderBacenta is deliberately excluded — Bacenta leaders do not control
    // shepherding (they are the pastoral front-line, not administrators)
    expect(result).not.toContain('leaderBacenta')
  })

  it('includes all admin roles from Governorship up', () => {
    const result = permitShepherdingControl()
    expect(result).toContain('adminGovernorship')
    expect(result).toContain('adminCouncil')
    expect(result).toContain('adminStream')
    expect(result).toContain('adminCampus')
    expect(result).toContain('adminOversight')
    expect(result).toContain('adminDenomination')
  })

  it('does NOT include any arrivals or teller specialist roles', () => {
    const result = permitShepherdingControl()
    expect(result).not.toContain('arrivalsCounterStream')
    expect(result).not.toContain('arrivalsPayerCouncil')
    expect(result).not.toContain('tellerStream')
    expect(result).not.toContain('arrivalsAdminCampus')
  })
})
