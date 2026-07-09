/**
 * Unit tests for the defaulters-roundup body builder (defaulters-message.js),
 * covering the singular/plural agreement and the form-only / banking-only /
 * both phrasing. Counts are exercised as both plain numbers and neo4j-integer
 * shapes ({ toNumber }), since the query returns them as neo4j ints.
 */

const { toNumber, buildDefaultersBody } = require('./defaulters-message')

const row = (overrides = {}) => ({
  churchId: 'council-1',
  churchName: 'Adenta Council',
  level: 'Council',
  formDefaulters: 7,
  bankingDefaulters: 4,
  ...overrides,
})

describe('toNumber', () => {
  it('passes through plain numbers', () => {
    expect(toNumber(42)).toBe(42)
  })

  it('coerces null/undefined to 0', () => {
    expect(toNumber(null)).toBe(0)
    expect(toNumber(undefined)).toBe(0)
  })

  it('unwraps a neo4j integer via its toNumber method', () => {
    expect(toNumber({ toNumber: () => 12 })).toBe(12)
  })
})

describe('buildDefaultersBody', () => {
  it('combines form and banking with the noun dropped after the comma', () => {
    expect(buildDefaultersBody(row())).toBe(
      "Adenta Council: 7 Bacentas haven't filled their service form, 4 haven't banked this week."
    )
  })

  it('renders form-only when there are no banking defaulters', () => {
    expect(
      buildDefaultersBody(row({ formDefaulters: 3, bankingDefaulters: 0 }))
    ).toBe(
      "Adenta Council: 3 Bacentas haven't filled their service form this week."
    )
  })

  it('renders banking-only with the full noun when there are no form defaulters', () => {
    expect(
      buildDefaultersBody(row({ formDefaulters: 0, bankingDefaulters: 5 }))
    ).toBe("Adenta Council: 5 Bacentas haven't banked this week.")
  })

  it('uses singular agreement for a count of one (form)', () => {
    expect(
      buildDefaultersBody(row({ formDefaulters: 1, bankingDefaulters: 0 }))
    ).toBe(
      "Adenta Council: 1 Bacenta hasn't filled its service form this week."
    )
  })

  it('uses singular agreement for a count of one (banking-only)', () => {
    expect(
      buildDefaultersBody(row({ formDefaulters: 0, bankingDefaulters: 1 }))
    ).toBe("Adenta Council: 1 Bacenta hasn't banked this week.")
  })

  it('mixes singular form with plural banking correctly', () => {
    expect(
      buildDefaultersBody(row({ formDefaulters: 1, bankingDefaulters: 2 }))
    ).toBe(
      "Adenta Council: 1 Bacenta hasn't filled its service form, 2 haven't banked this week."
    )
  })

  it('handles neo4j-integer counts', () => {
    const body = buildDefaultersBody(
      row({
        formDefaulters: { toNumber: () => 2 },
        bankingDefaulters: { toNumber: () => 0 },
      })
    )
    expect(body).toBe(
      "Adenta Council: 2 Bacentas haven't filled their service form this week."
    )
  })

  it('is defensive about the 0/0 case', () => {
    expect(
      buildDefaultersBody(row({ formDefaulters: 0, bankingDefaulters: 0 }))
    ).toBe('Adenta Council: no outstanding defaulters this week.')
  })
})
