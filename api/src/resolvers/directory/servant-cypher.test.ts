/**
 * SYN-234 — servant-cypher.ts stopped parsing: a SYN-220 comment inside the
 * connectServiceLog template literal wrapped `disconnectChurchLeader` in
 * backticks, which closed the template early. Every module importing it
 * (make-remove-servants → directory-resolvers) failed to load, so the
 * directory resolver suite could not run at all. Importing the module here is
 * the regression guard; the assertions pin that the statement is still whole.
 */
import servantCypher from './servant-cypher'

describe('SYN-234 — servant-cypher module parses', () => {
  it('SYN-234: every statement is a non-empty string', () => {
    Object.values(servantCypher).forEach((statement) => {
      expect(typeof statement).toBe('string')
      expect(statement.trim().length).toBeGreaterThan(0)
    })
  })

  it('SYN-234: connectServiceLog still carries the SYN-220 CURRENT_HISTORY cleanup past the comment', () => {
    const { connectServiceLog } = servantCypher

    expect(connectServiceLog).toContain(
      'OPTIONAL MATCH (church)-[staleChurch:CURRENT_HISTORY]->(other:ServiceLog)'
    )
    expect(connectServiceLog).toContain('DELETE staleLeader')
  })
})
