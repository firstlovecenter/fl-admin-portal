/**
 * SYN-227 — checkMemberHasNoActiveRelationships, the pre-check that stops
 * MakeMemberInactive while a member still holds church roles.
 *
 * It used to return only a count, so the delete dialog could say roles exist
 * but not which ones. It now also returns `activeRoles` — one entry per
 * blocking role — for the dialog to list. And only roles on the seven live
 * church levels count: the Fellowship and Creative Arts tiers were removed
 * with their servant mutations (a849f2fa1, 8c62fff15), so an edge to one of
 * their nodes could never be removed and blocked the member for good.
 *
 * No DB here: these pin the statement text. The statement was run against dev
 * Neo4j when it was written — a member with two Bacenta leader roles got both,
 * a former Fellowship leader and a former Hub / Creative Arts leader got none.
 *
 *   npm test -- resolver-cypher --testNamePattern="SYN-227:"
 */
import { checkMemberHasNoActiveRelationships } from './resolver-cypher'

const LIVE_LEVELS = [
  'Denomination',
  'Oversight',
  'Campus',
  'Stream',
  'Council',
  'Governorship',
  'Bacenta',
]

const RETIRED_LEVELS = [
  'Fellowship',
  'HubFellowship',
  'Ministry',
  'Hub',
  'HubCouncil',
  'CreativeArts',
  'Basonta',
]

const SERVANT_EDGES = [
  ['LEADS', 'Leader'],
  ['IS_ADMIN_FOR', 'Admin'],
  ['DOES_ARRIVALS_FOR', 'ArrivalsAdmin'],
  ['COUNTS_ARRIVALS_FOR', 'ArrivalsCounter'],
  ['IS_TELLER_FOR', 'Teller'],
]

const matchedLabels = (): string[] => {
  const match = checkMemberHasNoActiveRelationships.match(
    /->\(church:([A-Za-z|]+)\)/
  )
  expect(match).not.toBeNull()
  return (match as RegExpMatchArray)[1].split('|')
}

const activeRolesMap = (): string => {
  const match = checkMemberHasNoActiveRelationships.match(
    /COLLECT\(\{([\s\S]*)\}\) AS activeRoles/
  )
  expect(match).not.toBeNull()
  return (match as RegExpMatchArray)[1]
}

describe('checkMemberHasNoActiveRelationships', () => {
  it('SYN-227: anchors on the member id, and $id is its only parameter', () => {
    expect(checkMemberHasNoActiveRelationships).toContain(
      'MATCH (member:Member {id:$id})'
    )
    // A `${…}` would already be filled in by the time this module loads, so
    // pin the parameter set instead (the lint rule guards interpolation).
    const params = checkMemberHasNoActiveRelationships.match(/\$[A-Za-z_]\w*/g)
    expect(new Set(params)).toEqual(new Set(['$id']))
  })

  it('SYN-227: still matches the same five servant edges', () => {
    expect(checkMemberHasNoActiveRelationships).toContain(
      '-[servant:LEADS|DOES_ARRIVALS_FOR|IS_ADMIN_FOR|COUNTS_ARRIVALS_FOR|IS_TELLER_FOR]->'
    )
  })

  it('SYN-227: counts roles on exactly the seven live church levels', () => {
    expect(matchedLabels().sort()).toEqual([...LIVE_LEVELS].sort())
  })

  it.each(RETIRED_LEVELS)(
    'SYN-227: a role on a retired %s node does not block the deactivation',
    (level) => {
      expect(matchedLabels()).not.toContain(level)
    }
  )

  it('SYN-227: a role on a closed church does not block the deactivation', () => {
    expect(checkMemberHasNoActiveRelationships).toContain(
      "WHERE none(label IN labels(church) WHERE label STARTS WITH 'Closed')"
    )
  })

  it('SYN-227: counts each role once, however many edges back it', () => {
    expect(checkMemberHasNoActiveRelationships).toContain(
      'WITH DISTINCT church, type(servant) AS edgeType'
    )
    expect(checkMemberHasNoActiveRelationships).toContain(
      'RETURN COUNT(*) AS relationshipCount'
    )
  })

  it('SYN-227: lists the roles in a stable order', () => {
    expect(checkMemberHasNoActiveRelationships).toMatch(
      /ORDER BY church\.name, church\.id, edgeType\s+RETURN/
    )
  })

  it.each(SERVANT_EDGES)(
    'SYN-227: names a %s edge with the %s servant type',
    (edge, servantType) => {
      expect(activeRolesMap()).toContain(`WHEN '${edge}' THEN '${servantType}'`)
    }
  )

  it('SYN-227: an edge type without a branch still yields a servant type', () => {
    expect(activeRolesMap()).toMatch(/ELSE edgeType\s+END/)
  })

  it('SYN-227: takes churchType from a level priority list, not label order', () => {
    // Church nodes carry extra labels (Active, Graduated, Team), and labels()
    // order is not guaranteed, so the level is the first match from a fixed
    // list in hierarchy order.
    const levelList = activeRolesMap().match(
      /churchType: head\(\[level IN \[([^\]]*)\] WHERE level IN labels\(church\)\]\)/
    )
    expect(levelList).not.toBeNull()

    const levels = (levelList as RegExpMatchArray)[1]
      .split(',')
      .map((label) => label.trim().replace(/'/g, ''))

    expect(levels).toEqual(LIVE_LEVELS)
  })

  it('SYN-227: returns church names but never church ids', () => {
    expect(activeRolesMap()).toContain("churchName: coalesce(church.name, '')")
    // The list can name churches outside the caller's scope; their ids stay
    // on the server.
    expect(activeRolesMap()).not.toMatch(/church\.id/)
  })
})
