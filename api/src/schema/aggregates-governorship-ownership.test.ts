/**
 * Governorship aggregate reads must hard-filter by church-owned id prefix so
 * a church with no own week cannot surface another church's Aggregate* node
 * (same figures / recomputedAt) via multi-church-reachable ServiceLog edges.
 */
import fs from 'fs'
import path from 'path'

const sdl = fs.readFileSync(path.join(__dirname, 'aggregates.graphql'), 'utf8')

/** Extract the @cypher statement body for a field on `extend type Governorship`. */
const governorshipCypher = (fieldName: string): string => {
  const typeStart = sdl.indexOf('extend type Governorship {')
  expect(typeStart).toBeGreaterThanOrEqual(0)

  const nextExtend = sdl.indexOf('extend type ', typeStart + 1)
  const block = sdl.slice(
    typeStart,
    nextExtend === -1 ? sdl.length : nextExtend
  )

  const fieldIdx = block.indexOf(`${fieldName}(`)
  expect(fieldIdx).toBeGreaterThanOrEqual(0)

  const statementMatch = block
    .slice(fieldIdx)
    .match(/statement:\s*"""([\s\S]*?)"""/)
  expect(statementMatch).not.toBeNull()
  return statementMatch![1]
}

describe('Governorship aggregate ownership filter', () => {
  it.each(['aggregateServiceRecords', 'aggregateBussingRecords'] as const)(
    '%s requires aggregate.id STARTS WITH church id prefix',
    (fieldName) => {
      const cypher = governorshipCypher(fieldName)
      expect(cypher).toContain("aggregate.id STARTS WITH (this.id + '-')")
    }
  )
})

describe('AggregateServiceRecord Inf sanitization', () => {
  it('Campus aggregateServiceRecords maps Inf dollarIncome/income to 0.0', () => {
    const typeStart = sdl.indexOf('extend type Campus {')
    expect(typeStart).toBeGreaterThanOrEqual(0)
    const nextExtend = sdl.indexOf('extend type ', typeStart + 1)
    const block = sdl.slice(
      typeStart,
      nextExtend === -1 ? sdl.length : nextExtend
    )
    const fieldIdx = block.indexOf('aggregateServiceRecords(')
    const statementMatch = block
      .slice(fieldIdx)
      .match(/statement:\s*"""([\s\S]*?)"""/)
    expect(statementMatch).not.toBeNull()
    const cypher = statementMatch![1]
    expect(cypher).toContain('aggregate.dollarIncome = Inf')
    expect(cypher).toContain('THEN 0.0 ELSE toFloat(aggregate.dollarIncome)')
    expect(cypher).toContain('aggregate.income = Inf')
  })
})
