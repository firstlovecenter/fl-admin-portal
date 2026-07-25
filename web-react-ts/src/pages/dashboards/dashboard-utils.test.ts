/**
 * Unit tests for `resolveChurchFromUserJobs` (SYN-203).
 *
 * A user can hold several roles on the same church, each queried with a
 * different field set. The arrivals-counter job's church carries only
 * {id, name}; the teller job's church additionally carries isManualBanking.
 * The fixed role ordering lists arrivals-counter before teller, so the old
 * first-match-wins resolution returned the field-poor church and read
 * isManualBanking as undefined. This helper merges every matching job so a
 * field present on ANY role wins regardless of order.
 */

import { describe, it, expect, afterEach } from 'vitest'
import i18n from 'lib/i18n'
import { getServantRoles, resolveChurchFromUserJobs } from './dashboard-utils'
import type { MemberWithChurches, UserJobs } from 'global-types'

const STREAM_ID = 'stream-passion-weekday'

// Minimal job factory — only `church` is read by the helper.
const job = (church: Partial<UserJobs['church'][number]>[]): UserJobs =>
  ({ church } as unknown as UserJobs)

const arrivalsCounterJob = job([
  { __typename: 'Stream', id: STREAM_ID, name: 'Passion Weekday' } as never,
])

const tellerJob = job([
  {
    __typename: 'Stream',
    id: STREAM_ID,
    name: 'Passion Weekday',
    isManualBanking: true,
    vacationStatus: 'No',
  } as never,
])

describe('resolveChurchFromUserJobs', () => {
  it('surfaces isManualBanking from the teller job when arrivals-counter is listed first (SYN-203)', () => {
    const result = resolveChurchFromUserJobs(
      [arrivalsCounterJob, tellerJob],
      STREAM_ID
    )
    expect(result?.isManualBanking).toBe(true)
    expect(result?.id).toBe(STREAM_ID)
  })

  it('is order-independent — teller job first still resolves isManualBanking', () => {
    const result = resolveChurchFromUserJobs(
      [tellerJob, arrivalsCounterJob],
      STREAM_ID
    )
    expect(result?.isManualBanking).toBe(true)
  })

  it('preserves a genuine false — non-manual stream stays non-manual', () => {
    const nonManual = job([
      { __typename: 'Stream', id: STREAM_ID, name: 'X', isManualBanking: false } as never,
    ])
    const result = resolveChurchFromUserJobs([nonManual], STREAM_ID)
    expect(result?.isManualBanking).toBe(false)
  })

  it('merges fields across matching jobs without dropping the field-rich one', () => {
    const result = resolveChurchFromUserJobs(
      [arrivalsCounterJob, tellerJob],
      STREAM_ID
    )
    expect(result?.name).toBe('Passion Weekday')
    expect(result?.vacationStatus).toBe('No')
  })

  it('returns null when no job matches the churchId', () => {
    expect(
      resolveChurchFromUserJobs([arrivalsCounterJob, tellerJob], 'other-id')
    ).toBeNull()
  })

  it('returns null for empty / missing inputs so callers keep their fallback', () => {
    expect(resolveChurchFromUserJobs([], STREAM_ID)).toBeNull()
    expect(resolveChurchFromUserJobs(undefined, STREAM_ID)).toBeNull()
    expect(resolveChurchFromUserJobs([tellerJob], null)).toBeNull()
  })
})

// `getServantRoles`'s role `name` field is rendered as-is on the
// ServantsDashboard role cards. Covers the `roleDisplayName` helper's three
// shapes (bare level, "<level> Admin", "<level> Arrivals Admin") both
// without `t` (the pre-i18n behavior every existing caller still gets) and
// with `t` (the new, opt-in translated path).
describe('getServantRoles', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  const servantFixture = {
    leadsBacenta: [{ id: 'b1' }],
    isAdminForGovernorship: [{ id: 'g1' }],
    isArrivalsAdminForCouncil: [{ id: 'c1' }],
  } as unknown as MemberWithChurches

  it('without t: returns the original untranslated English names (backward compatible)', () => {
    const { userroles } = getServantRoles(servantFixture)
    const names = userroles.map((r) => r.name)

    expect(names).toContain('Bacenta')
    expect(names).toContain('Governorship Admin')
    expect(names).toContain('Council Arrivals Admin')
  })

  it('with an English t: matches the untranslated names', () => {
    const { userroles } = getServantRoles(servantFixture, i18n.t.bind(i18n))
    const names = userroles.map((r) => r.name)

    expect(names).toContain('Bacenta')
    expect(names).toContain('Governorship Admin')
    expect(names).toContain('Council Arrivals Admin')
  })

  it('with a French t: translates both the church level and the role suffix', async () => {
    await i18n.changeLanguage('fr')
    const { userroles } = getServantRoles(servantFixture, i18n.t.bind(i18n))
    const names = userroles.map((r) => r.name)

    // Bacenta is a do-not-translate loanword (kb/01-glossary.md) — stays as-is.
    expect(names).toContain('Bacenta')
    expect(names).toContain('Gouvernorat Administrateur')
    expect(names).toContain('Conseil Administrateur des arrivées')
  })

  it('produces no roles for a servant with none of the role arrays populated', () => {
    const { userroles, roleTitles } = getServantRoles(
      {} as MemberWithChurches,
      i18n.t.bind(i18n)
    )
    expect(userroles).toHaveLength(0)
    expect(roleTitles).toHaveLength(0)
  })
})
