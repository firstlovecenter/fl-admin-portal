/**
 * SYN-273: `Council.bacentasNotCounted` returned `bacenta` while its MATCH
 * bound `bacentas`, so Neo4j rejected every councilBacentasToCount query with
 * "Variable `bacenta` not defined". These tests guard every church level's
 * copy of the field against the same unbound-RETURN typo.
 */
import fs from 'fs'
import path from 'path'

const sdl = fs.readFileSync(path.join(__dirname, 'arrivals.graphql'), 'utf8')

/** Extract the @cypher statement body for a field on `extend type <typeName>`. */
const fieldCypher = (typeName: string, fieldName: string): string => {
  const typeStart = sdl.indexOf(`extend type ${typeName} {`)
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

/** Types whose `extend type` block declares `bacentasNotCounted`. */
const typesWithField = (fieldName: string): string[] => {
  const re = /extend type (\w+) \{([\s\S]*?)(?=\nextend type |$)/g
  const types: string[] = []
  let m = re.exec(sdl)
  while (m) {
    if (m[2].includes(`${fieldName}(`)) types.push(m[1])
    m = re.exec(sdl)
  }
  return types
}

describe('bacentasNotCounted returns a bound variable', () => {
  it('is declared on Campus, Stream, Council and Governorship', () => {
    expect(typesWithField('bacentasNotCounted')).toEqual(
      expect.arrayContaining(['Campus', 'Stream', 'Council', 'Governorship'])
    )
  })

  it('Council.bacentasNotCounted returns `bacentas`, not `bacenta`', () => {
    const cypher = fieldCypher('Council', 'bacentasNotCounted')
    expect(cypher).toContain('RETURN DISTINCT bacentas AS bacentasNotCounted')
    expect(cypher).not.toMatch(/RETURN DISTINCT bacenta AS/)
  })

  it.each(typesWithField('bacentasNotCounted'))(
    '%s.bacentasNotCounted RETURNs a variable its MATCH binds',
    (typeName) => {
      const cypher = fieldCypher(typeName, 'bacentasNotCounted')
      const ret = cypher.match(/RETURN DISTINCT (\w+) AS bacentasNotCounted/)
      expect(ret).not.toBeNull()
      expect(cypher).toMatch(new RegExp(`\\(${ret![1]}:Active:Bacenta\\)`))
    }
  )
})
