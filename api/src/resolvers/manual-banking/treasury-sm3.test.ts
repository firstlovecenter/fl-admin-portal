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

import treasury from './treasury-cypher'

// ---------------------------------------------------------------------------
// formDefaultersCount — form submission defaulters
// ---------------------------------------------------------------------------
describe('SM3 — formDefaultersCount: :Active:Bacenta constraint', () => {
  it('SM3: service-match in formDefaultersCount uses :Active:Bacenta — vacation Bacentas with no service are not counted', () => {
    expect(treasury.formDefaultersCount).toMatch(/:Active:Bacenta/)
  })

  it('SM3: defaulters-match in formDefaultersCount uses :Active:Bacenta (both sides of the exclusion check are Active-scoped)', () => {
    const activeMatches = (
      treasury.formDefaultersCount.match(/:Active:Bacenta/g) ?? []
    ).length
    expect(activeMatches).toBeGreaterThanOrEqual(2)
  })
})

// ---------------------------------------------------------------------------
// membershipAttendanceDefaultersCount — attendance defaulters
// ---------------------------------------------------------------------------
describe('SM3 — membershipAttendanceDefaultersCount: :Active:Bacenta constraint', () => {
  it('SM3: membershipAttendanceDefaultersCount uses :Active:Bacenta', () => {
    expect(treasury.membershipAttendanceDefaultersCount).toMatch(
      /:Active:Bacenta/
    )
  })
})

// ---------------------------------------------------------------------------
// confirmBanking — vacation Bacentas cannot appear in the batch write
// ---------------------------------------------------------------------------
// SM3 invariant inherited from the deleted bankingDefaulersCount precheck:
// the write-side Cypher traverses ServiceRecord nodes directly, not Bacenta
// nodes. Vacation Bacentas have no service records (RecordService /
// RecordServiceNoIncome refuse them), so they cannot be teller-confirmed by
// construction. The precheck was removed in Phase 2 of the banking-flows
// audit because it was racy; the same invariant is enforced by the actual
// write Cypher below.
describe('SM3 — confirmBanking: vacation Bacentas cannot appear', () => {
  it('SM3: confirmBanking traverses ServiceRecord, not Bacenta directly', () => {
    expect(treasury.confirmBanking).toMatch(/ServiceRecord/)
    expect(treasury.confirmBanking).not.toMatch(/\(bacenta:Bacenta\)/)
  })
})
