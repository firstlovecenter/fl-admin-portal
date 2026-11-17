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
