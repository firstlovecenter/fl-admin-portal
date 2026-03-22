import { Driver } from 'neo4j-driver'

let driverInstance: Driver | null = null

export const setCheckinsDriver = (driver: Driver): void => {
  driverInstance = driver
}

export const getCheckinsDriver = (): Driver | null => {
  return driverInstance
}
