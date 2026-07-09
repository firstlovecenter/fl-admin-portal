/**
 * Unit tests for the banking-reminder body builder (banking-message.js),
 * extracted from index.js so the assembled notification text is covered:
 * money label, relative service date, and the "+N more" pluralisation.
 *
 * Anchor: NOW = Thursday 2026-07-09 (UTC / Accra). `date` values are the
 * `toString(serviceDate.date)` shape produced by BANKING_REMINDER_RECIPIENTS.
 */

const { toNumber, formatMoney, buildBankingBody } = require('./banking-message')

const NOW = new Date('2026-07-09T15:00:00.000Z')

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
      "Accra Central: GHS 500 from your service yesterday hasn't been banked yet. Please bank it today."
    )
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
