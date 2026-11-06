/**
 * Every aggregateServiceRecords read must map income and dollarIncome through
 * the finite check. They are Float! fields, so one stored Inf or NaN fails
 * serialization and nulls the whole church (Shepherding Control hung on W36).
 */
import fs from 'fs'
import path from 'path'

const sdl = fs.readFileSync(path.join(__dirname, 'aggregates.graphql'), 'utf8')

const serviceRecordsCypher = (typeName: string): string => {
  const typeStart = sdl.indexOf(`extend type ${typeName} {`)
  expect(typeStart).toBeGreaterThanOrEqual(0)

  const fieldStart = sdl.indexOf('aggregateServiceRecords(', typeStart)
  const statementMatch = sdl
    .slice(fieldStart)
    .match(/statement:\s*"""([\s\S]*?)"""/)
  expect(statementMatch).not.toBeNull()
  return statementMatch![1]
}

describe('aggregateServiceRecords finite income guard', () => {
  it.each([
    'Bacenta',
    'Governorship',
    'Council',
    'Stream',
    'Campus',
    'Oversight',
    'Denomination',
  ])('%s sanitizes income and dollarIncome', (typeName) => {
    const cypher = serviceRecordsCypher(typeName)

    expect(cypher).toContain(
      'income: CASE WHEN abs(toFloat(aggregate.income)) < 1.0e308 THEN toFloat(aggregate.income) ELSE 0.0 END'
    )
    expect(cypher).toContain(
      'dollarIncome: CASE WHEN abs(toFloat(aggregate.dollarIncome)) < 1.0e308 THEN toFloat(aggregate.dollarIncome) ELSE 0.0 END'
    )
  })

  it('leaves no raw aggregate return on a service record read', () => {
    const rawReturns = sdl
      .split('aggregateServiceRecords(')
      .slice(1)
      .filter((block) => {
        const statement = block.match(/statement:\s*"""([\s\S]*?)"""/)
        return statement?.[1].includes('RETURN aggregate ORDER BY')
      })

    expect(rawReturns).toHaveLength(0)
  })
})
