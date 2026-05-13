/**
 * Shared test scenarios for permission-utils.ts (FE) and permissions.ts (BE).
 *
 * Consumed by:
 *   web-react-ts/src/permission-utils.test.ts   — import from '../../lib/permission-test-scenarios'
 *   api/src/resolvers/permissions.test.ts        — import from '../../../lib/permission-test-scenarios'
 *
 * Types are local strings — no cross-package type coupling so this file can
 * be imported from both packages with their different module resolvers.
 *
 * ADR-001: FE and BE permission helpers must stay in sync.  Any new role or
 * level added to either source file MUST also update this file.
 */

export type ChurchLevel =
  | 'Bacenta'
  | 'Governorship'
  | 'Council'
  | 'Stream'
  | 'Campus'
  | 'Oversight'
  | 'Denomination'

/** Every title-cased ChurchLevel value the switch statements handle. */
export const ALL_CHURCH_LEVELS: ChurchLevel[] = [
  'Denomination',
  'Oversight',
  'Campus',
  'Stream',
  'Council',
  'Governorship',
  'Bacenta',
]

// ---------------------------------------------------------------------------
// permitLeader scenarios
// Both FE and BE use .toLowerCase() before the switch, so these use canonical
// title-cased inputs but the case-insensitivity guard is tested separately.
// ---------------------------------------------------------------------------

export const LEADER_SCENARIOS: Record<ChurchLevel, string[]> = {
  Denomination: ['leaderDenomination'],
  Oversight: ['leaderDenomination', 'leaderOversight'],
  Campus: ['leaderDenomination', 'leaderOversight', 'leaderCampus'],
  Stream: [
    'leaderDenomination',
    'leaderOversight',
    'leaderCampus',
    'leaderStream',
  ],
  Council: [
    'leaderDenomination',
    'leaderOversight',
    'leaderCampus',
    'leaderStream',
    'leaderCouncil',
  ],
  Governorship: [
    'leaderDenomination',
    'leaderOversight',
    'leaderCampus',
    'leaderStream',
    'leaderCouncil',
    'leaderGovernorship',
  ],
  Bacenta: [
    'leaderDenomination',
    'leaderOversight',
    'leaderCampus',
    'leaderStream',
    'leaderCouncil',
    'leaderGovernorship',
    'leaderBacenta',
  ],
}

// ---------------------------------------------------------------------------
// permitAdmin scenarios — identical between FE and BE (ADR-001 reconciled).
// ---------------------------------------------------------------------------

export const ADMIN_SCENARIOS: Record<ChurchLevel, string[]> = {
  Bacenta: [
    'adminGovernorship',
    'adminCouncil',
    'adminStream',
    'adminCampus',
    'adminDenomination',
    'adminOversight',
  ],
  Governorship: [
    'adminDenomination',
    'adminOversight',
    'adminCampus',
    'adminStream',
    'adminCouncil',
    'adminGovernorship',
  ],
  Council: [
    'adminDenomination',
    'adminOversight',
    'adminCampus',
    'adminStream',
    'adminCouncil',
  ],
  Stream: [
    'adminDenomination',
    'adminOversight',
    'adminCampus',
    'adminStream',
  ],
  Campus: ['adminDenomination', 'adminOversight', 'adminCampus'],
  Oversight: ['adminDenomination', 'adminOversight'],
  Denomination: ['adminDenomination'],
}

// ---------------------------------------------------------------------------
// permitArrivals scenarios
//
// The 'Stream' case is special — it prepends permitAdmin('Stream') roles.
// Both FE and BE have identical logic here.
// ---------------------------------------------------------------------------

export const ARRIVALS_SCENARIOS: Record<ChurchLevel, string[]> = {
  // Bacenta and Governorship return the same four roles
  Bacenta: [
    'arrivalsAdminCampus',
    'arrivalsAdminStream',
    'arrivalsAdminCouncil',
    'arrivalsAdminGovernorship',
  ],
  Governorship: [
    'arrivalsAdminCampus',
    'arrivalsAdminStream',
    'arrivalsAdminCouncil',
    'arrivalsAdminGovernorship',
  ],
  Council: [
    'arrivalsAdminCampus',
    'arrivalsAdminStream',
    'arrivalsAdminCouncil',
  ],
  // Stream prepends permitAdmin('Stream') = ['adminDenomination','adminOversight','adminCampus','adminStream']
  Stream: [
    'adminDenomination',
    'adminOversight',
    'adminCampus',
    'adminStream',
    'arrivalsAdminCampus',
    'arrivalsAdminStream',
  ],
  Campus: ['arrivalsAdminCampus'],
  // Levels above Campus have no arrivals roles
  Oversight: [],
  Denomination: [],
}

// ---------------------------------------------------------------------------
// permitArrivalsHelpers scenarios — only Stream returns non-empty
// ---------------------------------------------------------------------------

export const ARRIVALS_HELPERS_SCENARIOS: Record<ChurchLevel, string[]> = {
  Bacenta: [],
  Governorship: [],
  Council: [],
  Stream: ['arrivalsCounterStream', 'arrivalsPayerCouncil'],
  Campus: [],
  Oversight: [],
  Denomination: [],
}

// ---------------------------------------------------------------------------
// Roles that MUST be excluded from permitLeaderAdmin (membership-export gate).
// These specialist roles do arrivals / banking but must NOT be able to pull
// full member PII.
// ---------------------------------------------------------------------------

export const SENSITIVE_ROLES = [
  'arrivalsCounterStream',
  'arrivalsPayerCouncil',
  'tellerStream',
] as const

// ---------------------------------------------------------------------------
// permitShepherdingControl — fixed list, independent of church level.
// ---------------------------------------------------------------------------

export const SHEPHERDING_CONTROL_ROLES: string[] = [
  'leaderGovernorship',
  'leaderCouncil',
  'leaderStream',
  'leaderCampus',
  'leaderOversight',
  'leaderDenomination',
  'adminGovernorship',
  'adminCouncil',
  'adminStream',
  'adminCampus',
  'adminOversight',
  'adminDenomination',
]
