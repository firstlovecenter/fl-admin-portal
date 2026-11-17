/**
 * SYN-227 — servant-cypher.ts must parse.
 *
 * Every statement here is a JS template literal, so a backtick inside a Cypher
 * `//` comment closes the literal early. That shipped once (a backticked
 * identifier in the SYN-220 comment on connectServiceLog) and took down every
 * module importing this file — directory-resolvers among them — with a
 * SyntaxError. Importing the module is the regression test; the assertions pin
 * that the statement the comment sits in is still whole.
 */
import servantCypher from './servant-cypher'

describe('servant-cypher', () => {
  it('SYN-227: loads, and connectServiceLog keeps the SYN-220 CURRENT_HISTORY cleanup', () => {
    const { connectServiceLog } = servantCypher

    expect(typeof connectServiceLog).toBe('string')
    expect(connectServiceLog).toContain(
      'OPTIONAL MATCH (church)-[staleChurch:CURRENT_HISTORY]->(other:ServiceLog)'
    )
    expect(connectServiceLog).toContain('DELETE staleLeader')
  })
})
