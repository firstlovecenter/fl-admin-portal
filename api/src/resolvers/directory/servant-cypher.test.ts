/**
 * servant-cypher.ts holds every leader-change Cypher as a template literal, so
 * a stray backtick inside a `//` Cypher comment terminates the string and the
 * whole module stops parsing — taking down tsc and every resolver that imports
 * it (directory-resolvers, make-remove-servants). That happened with the
 * SYN-220 comment in connectServiceLog; these tests pin that the module loads
 * and the SYN-220 retirement clause survived the comment fix intact.
 */

import servantCypher from './servant-cypher'

describe('servant-cypher module', () => {
  it('loads and exposes every statement as a non-empty string', () => {
    const entries = Object.entries(servantCypher)

    expect(entries.length).toBeGreaterThan(0)
    entries.forEach(([, statement]) => {
      expect(typeof statement).toBe('string')
      expect((statement as string).trim()).not.toBe('')
    })
  })

  it('contains no backtick inside any statement (would end the template literal)', () => {
    Object.values(servantCypher).forEach((statement) => {
      expect(statement).not.toContain('`')
    })
  })

  it('SYN-220: connectServiceLog still retires stale CURRENT_HISTORY edges for church and leader', () => {
    const { connectServiceLog } = servantCypher

    expect(connectServiceLog).toContain(
      'OPTIONAL MATCH (church)-[staleChurch:CURRENT_HISTORY]->(other:ServiceLog)'
    )
    expect(connectServiceLog).toContain('DELETE staleChurch')
    expect(connectServiceLog).toContain(
      'OPTIONAL MATCH (leader)-[staleLeader:CURRENT_HISTORY]->(otherLeaderLog:ServiceLog)'
    )
    expect(connectServiceLog).toContain('DELETE staleLeader')
  })
})

// SYN-226: the presence checks above would still pass if the template were cut
// short, so these also pin every statement's RETURN and connectServiceLog end
// to end: the $logId scoping, retire-before-create order and its final RETURN.
describe('servant-cypher (SYN-226)', () => {
  it('SYN-226: exports every query as a non-empty Cypher string', () => {
    const entries = Object.entries(servantCypher)
    expect(entries.length).toBeGreaterThan(0)
    entries.forEach(([, cypher]) => {
      expect(typeof cypher).toBe('string')
      expect(cypher).toMatch(/\bRETURN\b/)
    })
  })

  describe('connectServiceLog', () => {
    const cypher = servantCypher.connectServiceLog

    it('SYN-226: keeps the SYN-220 stale CURRENT_HISTORY cleanup for church and leader', () => {
      expect(cypher).toMatch(
        /OPTIONAL MATCH \(church\)-\[staleChurch:CURRENT_HISTORY\]->\(other:ServiceLog\)\s+WHERE other\.id <> \$logId\s+DELETE staleChurch/
      )
      expect(cypher).toMatch(
        /OPTIONAL MATCH \(leader\)-\[staleLeader:CURRENT_HISTORY\]->\(otherLeaderLog:ServiceLog\)\s+WHERE otherLeaderLog\.id <> \$logId\s+DELETE staleLeader/
      )
    })

    it('SYN-226: retires stale edges before creating the new CURRENT_HISTORY edges', () => {
      const cleanup = cypher.indexOf('DELETE staleLeader')
      const create = cypher.indexOf('MERGE (church)-[:CURRENT_HISTORY]->(log)')
      expect(cleanup).toBeGreaterThan(-1)
      expect(create).toBeGreaterThan(cleanup)
    })

    it('SYN-226: runs through to its final RETURN (template not truncated)', () => {
      expect(cypher.trim()).toMatch(/RETURN church\.id AS id$/)
    })
  })
})
