/**
 * Unit tests for the banking-reminder body builder (banking-message.js),
 * extracted from index.js so the assembled notification text is covered:
 * money label, relative service date, and the "+N more" pluralisation.
 *
 * Anchor: NOW = Thursday 2026-07-09 (UTC / Accra). `date` values are the
 * `toString(serviceDate.date)` shape produced by BANKING_REMINDER_RECIPIENTS.
 */

const {
  toNumber,
  formatMoney,
  buildBankingBody,
  pickVerse,
  BANKING_VERSES,
} = require('./banking-message')

const NOW = new Date('2026-07-09T15:00:00.000Z')

// Rotation is keyed on the UTC calendar day, so NOW deterministically resolves
// to a single verse. 2026-07-09 is day 20643 since epoch; 20643 % 4 === 3.
const VERSE_ON_NOW = BANKING_VERSES[3]

const row = (overrides = {}) => ({
  churchId: 'bacenta-1',
  churchName: 'Accra Central',
  unbanked: [{ income: 500, foreignCurrency: null, date: '2026-07-08' }],
  ...overrides,
})

describe('toNumber', () => {
  it('passes through plain numbers and null/undefined', () => {
    expect(toNumber(42)).toBe(42)
    expect(toNumber(null)).toBeNull()
    expect(toNumber(undefined)).toBeNull()
  })

  it('unwraps a neo4j integer via its toNumber method', () => {
    expect(toNumber({ toNumber: () => 1500 })).toBe(1500)
  })
})

describe('formatMoney', () => {
  it('defaults to GHS and groups thousands', () => {
    expect(formatMoney(1500)).toBe('GHS 1,500')
  })

  it('uses the record foreign currency when present', () => {
    expect(formatMoney(200, 'USD')).toBe('USD 200')
  })

  it('returns empty string for a null amount', () => {
    expect(formatMoney(null, 'GHS')).toBe('')
  })
})

describe('buildBankingBody', () => {
  it('names the church, the money, and the relative service date', () => {
    expect(buildBankingBody(row(), NOW)).toBe(
      "Accra Central: GHS 500 from your service yesterday hasn't been banked yet. Please bank it today." +
        `\n\n${VERSE_ON_NOW}`
    )
  })

  it("appends the day's stewardship verse after the call to action", () => {
    const body = buildBankingBody(row(), NOW)
    expect(body).toContain('Please bank it today.')
    expect(body.endsWith(`\n\n${VERSE_ON_NOW}`)).toBe(true)
    expect(BANKING_VERSES).toContain(VERSE_ON_NOW)
  })

  it('uses the weekday name for a 3–6 day old service', () => {
    // 2026-07-06 is a Monday, 3 days before the anchor
    const body = buildBankingBody(
      row({ unbanked: [{ income: 500, date: '2026-07-06' }] }),
      NOW
    )
    expect(body).toContain('from your service last Monday')
  })

  it('labels a foreign-currency service with its own currency', () => {
    const body = buildBankingBody(
      row({
        unbanked: [{ income: 200, foreignCurrency: 'USD', date: '2026-07-08' }],
      }),
      NOW
    )
    expect(body).toContain('USD 200 from your service yesterday')
  })

  it('appends a singular "+1 more" when a second service is unbanked', () => {
    const body = buildBankingBody(
      row({
        unbanked: [
          { income: 500, date: '2026-07-08' },
          { income: 300, date: '2026-07-06' },
        ],
      }),
      NOW
    )
    expect(body).toContain('(+1 more unbanked service)')
    expect(body).not.toContain('services)')
  })

  it('pluralises "+N more" when three or more services are unbanked', () => {
    const body = buildBankingBody(
      row({
        unbanked: [
          { income: 500, date: '2026-07-08' },
          { income: 300, date: '2026-07-06' },
          { income: 100, date: '2026-07-05' },
        ],
      }),
      NOW
    )
    expect(body).toContain('(+2 more unbanked services)')
  })

  it('leads with the most-recent (first) unbanked service', () => {
    // unbanked is pre-ordered DESC by the Cypher; the builder trusts that order.
    const body = buildBankingBody(
      row({
        unbanked: [
          { income: 999, date: '2026-07-08' },
          { income: 111, date: '2026-07-05' },
        ],
      }),
      NOW
    )
    expect(body).toContain('GHS 999 from your service yesterday')
  })
})

describe('pickVerse', () => {
  it('returns a verse from the BANKING_VERSES set', () => {
    expect(BANKING_VERSES).toContain(pickVerse(NOW))
  })

  it('is deterministic for a given UTC calendar day', () => {
    const morning = new Date('2026-07-09T06:00:00.000Z')
    const evening = new Date('2026-07-09T21:30:00.000Z')
    expect(pickVerse(morning)).toBe(pickVerse(evening))
    expect(pickVerse(NOW)).toBe(VERSE_ON_NOW)
  })

  it('advances one verse per day and wraps around the set', () => {
    // 2026-07-09 → index 3 (last); the next day wraps back to index 0.
    expect(pickVerse(new Date('2026-07-10T15:00:00.000Z'))).toBe(
      BANKING_VERSES[0]
    )
    expect(pickVerse(new Date('2026-07-11T15:00:00.000Z'))).toBe(
      BANKING_VERSES[1]
    )
  })
})
