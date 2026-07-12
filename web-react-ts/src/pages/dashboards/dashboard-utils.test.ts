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

import { describe, it, expect } from 'vitest'
import { resolveChurchFromUserJobs } from './dashboard-utils'
import type { UserJobs } from 'global-types'

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
