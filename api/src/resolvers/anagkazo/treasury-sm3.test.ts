/**
 * SM3 — Characterization tests for vacation exclusion in treasury-cypher.ts
 *
 * SM3 (kb/04-state-machines.md): vacation Bacentas are NOT defaulters.
 *
 * Mechanism: SetVacationBacenta removes the :Active label from the Bacenta node.
 * All treasury defaulter count queries here use :Active:Bacenta in their MATCH
 * clauses, guaranteeing vacation Bacentas are excluded without an explicit
 * vacationStatus property filter.
 *
 * All test names begin with "SM3:" for grep-ability (SYN-68):
 *   npm test -- treasury-sm3 --testNamePattern="SM3:"
 */

import anagkazo from './treasury-cypher'

// ---------------------------------------------------------------------------
// formDefaultersCount — form submission defaulters
// ---------------------------------------------------------------------------
describe('SM3 — formDefaultersCount: :Active:Bacenta constraint', () => {
  it('SM3: service-match in formDefaultersCount uses :Active:Bacenta — vacation Bacentas with no service are not counted', () => {
    expect(anagkazo.formDefaultersCount).toMatch(/:Active:Bacenta/)
  })

  it('SM3: defaulters-match in formDefaultersCount uses :Active:Bacenta (both sides of the exclusion check are Active-scoped)', () => {
    const activeMatches = (anagkazo.formDefaultersCount.match(/:Active:Bacenta/g) ?? []).length
    expect(activeMatches).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// membershipAttendanceDefaultersCount — attendance defaulters
// ---------------------------------------------------------------------------
describe('SM3 — membershipAttendanceDefaultersCount: :Active:Bacenta constraint', () => {
  it('SM3: membershipAttendanceDefaultersCount uses :Active:Bacenta', () => {
    expect(anagkazo.membershipAttendanceDefaultersCount).toMatch(/:Active:Bacenta/)
  })
})

// ---------------------------------------------------------------------------
// bankingDefaulersCount — banking defaulters
// ---------------------------------------------------------------------------
describe('SM3 — bankingDefaulersCount: vacation Bacentas cannot appear', () => {
  it('SM3: bankingDefaulersCount counts unbanked service records — vacation Bacentas cannot have service records (SM3 service-recording guard)', () => {
    // bankingDefaulersCount traverses ServiceRecord nodes, not Bacenta nodes directly.
    // Vacation Bacentas have no service records (RecordService/RecordServiceNoIncome refuse them),
    // so they cannot appear in the banking defaulter count by construction.
    // The positive assertion confirms the ServiceRecord path is present.
    expect(anagkazo.bankingDefaulersCount).toMatch(/ServiceRecord/)
    // The negative assertion confirms no independent unconstrained Bacenta MATCH
    // exists that could re-introduce vacation Bacentas through a parallel path.
    expect(anagkazo.bankingDefaulersCount).not.toMatch(/\(bacenta:Bacenta\)/)
  })
})
