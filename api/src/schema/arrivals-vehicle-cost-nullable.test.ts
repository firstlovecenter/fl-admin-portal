/**
 * SYN-283: `VehicleRecord.vehicleCost` was declared `Float!`, but the bussing
 * flow no longer captures a vehicle cost and `recordVehicleFromBacenta` never
 * sets it. Every query selecting it on a modern record failed with
 * "Cannot return null for non-nullable field VehicleRecord.vehicleCost".
 * These tests pin the field as nullable in the SDL and in the schema the
 * API actually serves.
 */
import fs from 'fs'
import path from 'path'
import { Neo4jGraphQL } from '@neo4j/graphql'
import { GraphQLObjectType } from 'graphql'
import { recordVehicleFromBacenta } from '../resolvers/arrivals/arrivals-cypher'
import { typeDefs } from './graphql-schema'

const sdl = fs.readFileSync(path.join(__dirname, 'arrivals.graphql'), 'utf8')

/** The declaration line for a field on `type <typeName>`, e.g. `vehicleCost: Float`. */
const fieldDeclaration = (typeName: string, fieldName: string): string => {
  const match = sdl.match(
    new RegExp(`\\ntype ${typeName}\\b[^{]*\\{([\\s\\S]*?)\\n\\}`)
  )
  expect(match).not.toBeNull()
  const line = match![1]
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l.startsWith(`${fieldName}:`))
  expect(line).toBeDefined()
  return line!
}

describe('VehicleRecord.vehicleCost is nullable (SYN-283)', () => {
  it('is declared as a nullable Float in the SDL', () => {
    expect(fieldDeclaration('VehicleRecord', 'vehicleCost')).toBe(
      'vehicleCost: Float'
    )
  })

  // Deliberate tripwire: if vehicle recording starts writing a cost again,
  // revisit whether old records without one still need the field nullable.
  it('is never written when a vehicle is recorded, so it must allow null', () => {
    expect(recordVehicleFromBacenta).not.toContain('vehicleCost')
  })

  it('is exposed as nullable `Float` by the generated @neo4j/graphql schema', async () => {
    const schema = await new Neo4jGraphQL({ typeDefs }).getSchema()
    const vehicleRecord = schema.getType('VehicleRecord') as GraphQLObjectType

    expect(String(vehicleRecord.getFields().vehicleCost.type)).toBe('Float')
  }, 30000)
})
