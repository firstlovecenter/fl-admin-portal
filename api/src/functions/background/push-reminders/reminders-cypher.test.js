/**
 * Shape/structure tests for the defaulters targeting queries. The Cypher is
 * executed + profiled against dev Neo4j by the cypher-reviewer (the raw-string
 * real-connection carve-out); these tests instead lock in the structural
 * decisions that a static reader can't otherwise guarantee stay put:
 *   - both defaulter CALLs anchor on the TimeGraph(date) index (perf);
 *   - the supervisory node anchor is deliberately NOT `:Active` (label is not
 *     reliably maintained on Council/Governorship/Stream);
 *   - the recipient + opt-out wiring (LEADS|IS_ADMIN_FOR + notifyDefaulters);
 *   - the correct :HAS depth per level.
 */

const { DEFAULTERS_REMINDER_QUERIES } = require('./reminders-cypher')

const [GOVERNORSHIP, COUNCIL, STREAM] = DEFAULTERS_REMINDER_QUERIES

describe('DEFAULTERS_REMINDER_QUERIES', () => {
  it('exposes exactly three level queries', () => {
    expect(DEFAULTERS_REMINDER_QUERIES).toHaveLength(3)
  })

  it.each([
    ['Governorship', () => GOVERNORSHIP],
    ['Council', () => COUNCIL],
    ['Stream', () => STREAM],
  ])('%s query is index-anchored and correctly wired', (level, get) => {
    const q = get()

    // Both defaulter CALLs anchor on the TimeGraph(date) index (twice: form +
    // banking), never a per-Bacenta full-history NOT EXISTS.
    expect(q.match(/USING INDEX serviceDate:TimeGraph\(date\)/g)).toHaveLength(
      2
    )
    expect(q).not.toContain('(bacenta)-[:HAS_HISTORY]')

    // Node anchor is the bare level label — NOT `:Active:<Level>` (dormant
    // nodes are filtered downstream, not by an unreliable :Active label).
    expect(q).toContain(`MATCH (node:${level})`)
    expect(q).not.toContain(`MATCH (node:Active:${level})`)

    // Recipients: leaders + admins, active, opt-out default-ON.
    expect(q).toContain('(node)<-[:LEADS|IS_ADMIN_FOR]-(member:Active:Member)')
    expect(q).toContain('coalesce(member.notifyDefaulters, true) = true')
    expect(q).toContain('(member)-[:HAS_PUSH_TOKEN]->(pushToken:PushToken)')

    // Vacation Bacentas excluded structurally (SM3).
    expect(q).toContain(':Active:Bacenta')

    // Emits the summary shape the message builder + sender expect.
    expect(q).toContain('formDefaulters')
    expect(q).toContain('bankingDefaulters')
    expect(q).toContain(`'${level}' AS level`)
    expect(q).toContain('collect(DISTINCT pushToken.token) AS tokens')
  })

  it('uses the correct :HAS depth from node down to Bacenta per level', () => {
    // Governorship → Bacenta (1 hop): no intermediate church label on the path.
    expect(GOVERNORSHIP).toContain('(node)-[:HAS]->(bacenta:Active:Bacenta)')
    // Council → Governorship → Bacenta (2 hops).
    expect(COUNCIL).toContain(
      '(node)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)'
    )
    // Stream → Council → Governorship → Bacenta (3 hops).
    expect(STREAM).toContain(
      '(node)-[:HAS]->(:Council)-[:HAS]->(:Governorship)-[:HAS]->(bacenta:Active:Bacenta)'
    )
  })
})
