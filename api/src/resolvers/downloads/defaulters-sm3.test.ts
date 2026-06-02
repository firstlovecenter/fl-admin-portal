/**
 * SM3 — Characterization tests for vacation exclusion in defaulters-cypher.ts
 *
 * SM3 (kb/04-state-machines.md): A vacation Bacenta is NOT a defaulter.
 *
 * Mechanism: SetVacationBacenta (directory-crud.graphql) does:
 *   SET bacenta:Vacation
 *   REMOVE bacenta:Active
 *
 * All defaulter queries in this file use :Active:Bacenta in their MATCH
 * clauses, so vacation Bacentas are excluded by the label constraint without
 * any explicit vacationStatus WHERE guard needed.
 *
 * These tests pin the :Active:Bacenta constraint as the structural guarantee
 * of the SM3 invariant. If someone removes the :Active label filter from a
 * query, this test suite will catch it.
 *
 * All test names begin with "SM3:" for grep-ability (SYN-68):
 *   npm test -- defaulters-sm3 --testNamePattern="SM3:"
 */

import {
  governorshipDetailRows,
  councilDetailRows,
  streamDetailRows,
  campusDetailRows,
  councilSummaryByGovernorship,
  streamSummaryByCouncil,
  campusSummaryByStream,
} from './defaulters-cypher'

// ---------------------------------------------------------------------------
// Detail queries — one per level
// ---------------------------------------------------------------------------
describe('SM3 — defaulters detail queries: :Active:Bacenta label constraint', () => {
  it('SM3: governorshipDetailRows only matches :Active:Bacenta — vacation Bacentas are excluded', () => {
    expect(governorshipDetailRows).toMatch(/:Active:Bacenta/)
  })

  it('SM3: councilDetailRows only matches :Active:Bacenta', () => {
    expect(councilDetailRows).toMatch(/:Active:Bacenta/)
  })

  it('SM3: streamDetailRows only matches :Active:Bacenta', () => {
    expect(streamDetailRows).toMatch(/:Active:Bacenta/)
  })

  it('SM3: campusDetailRows only matches :Active:Bacenta', () => {
    expect(campusDetailRows).toMatch(/:Active:Bacenta/)
  })
})

// ---------------------------------------------------------------------------
// Summary queries — per child rollup
// ---------------------------------------------------------------------------
describe('SM3 — defaulters summary queries: :Active:Bacenta label constraint', () => {
  it('SM3: councilSummaryByGovernorship only matches :Active:Bacenta — vacation Bacentas do not inflate formDefaulters', () => {
    expect(councilSummaryByGovernorship).toMatch(/:Active:Bacenta/)
  })

  it('SM3: streamSummaryByCouncil only matches :Active:Bacenta', () => {
    expect(streamSummaryByCouncil).toMatch(/:Active:Bacenta/)
  })

  it('SM3: campusSummaryByStream only matches :Active:Bacenta', () => {
    expect(campusSummaryByStream).toMatch(/:Active:Bacenta/)
  })
})

// ---------------------------------------------------------------------------
// vacationStatus column — transparency in export
// ---------------------------------------------------------------------------
describe('SM3 — defaulters detail: vacationStatus column present', () => {
  it('SM3: DETAIL_RETURN includes vacationStatus so the export shows the status column', () => {
    // At least one detail query must project vacationStatus for export transparency.
    // (All four share the same DETAIL_RETURN template.)
    expect(governorshipDetailRows).toMatch(/vacationStatus/)
  })
})
