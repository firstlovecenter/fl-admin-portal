/**
 * SYN-226 — servant-cypher.ts must parse and every query must survive intact.
 *
 * The SYN-220 comment block inside connectServiceLog quoted a name in
 * backticks. In a JS template literal a backtick closes the string, so the
 * module stopped compiling: tsc failed and every suite that imports the
 * directory resolvers failed to load. These tests import the module (so a
 * syntax error fails here, with a clear name) and pin connectServiceLog
 * end to end, so a truncated template cannot silently ship a shorter query.
 */
import servantCypher from './servant-cypher'

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
