/**
 * SYN-252 — shape of the CloseDownBacenta Cypher.
 *
 * Asserted on Cypher substrings (no DB): every filtering MATCH must run before
 * the HistoryLog CREATE (so a zero-row run leaves no orphaned log), and the
 * result must collapse to a single governorship row.
 */
import {
  closeDownBacenta,
  checkBacentaAlreadyClosed,
  checkBacentaHasNoMembers,
} from './close-church-cypher'

describe('SYN-252 — closeDownBacenta Cypher', () => {
  it('SYN-252: matches the bacenta, governorship and admin before creating the HistoryLog', () => {
    const create = closeDownBacenta.indexOf('CREATE (log:HistoryLog')
    expect(create).toBeGreaterThan(-1)
    expect(
      closeDownBacenta.indexOf(
        'MATCH (bacenta:Bacenta {id:$bacentaId})<-[:HAS]-(governorship:Governorship)'
      )
    ).toBeLessThan(create)
    expect(
      closeDownBacenta.indexOf('MATCH (admin:Member {id: $jwt.userId})')
    ).toBeLessThan(create)
    // No filtering MATCH after the CREATE (only OPTIONAL MATCH is allowed).
    const afterCreate = closeDownBacenta.slice(create)
    expect(afterCreate.replace(/OPTIONAL MATCH/g, '')).not.toMatch(/\bMATCH\b/)
  })

  it('SYN-252: returns one governorship row with its remaining active bacentas collected', () => {
    expect(closeDownBacenta).not.toContain('UNWIND')
    expect(closeDownBacenta).toContain(
      'OPTIONAL MATCH (governorship)-[:HAS]->(bacentas:Bacenta)'
    )
    expect(closeDownBacenta).toContain(
      'collect(bacentas {.id, .name}) AS bacentas'
    )
    expect(closeDownBacenta).toContain('SET bacenta:ClosedBacenta')
    expect(closeDownBacenta).toContain('REMOVE bacenta:Bacenta')
  })

  it('SYN-252: the already-closed check is parameterised on the ClosedBacenta label', () => {
    expect(checkBacentaAlreadyClosed).toContain(
      'MATCH (bacenta:ClosedBacenta {id:$bacentaId})'
    )
  })

  it('SYN-252: the pre-check reports whether the bacenta has a parent Governorship', () => {
    expect(checkBacentaHasNoMembers).toContain(
      'EXISTS { (bacenta)<-[:HAS]-(:Governorship) } AS hasGovernorship'
    )
    expect(checkBacentaHasNoMembers).toContain('memberCount')
  })
})
