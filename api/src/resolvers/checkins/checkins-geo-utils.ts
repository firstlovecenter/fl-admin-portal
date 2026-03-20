import { GeoPoint } from './checkins-types'

/**
 * Earth's radius in metres.
 */
export const EARTH_RADIUS_M = 6371000

/**
 * Calculate the Haversine distance (in metres) between two lat/lng points.
 */
export const haversineDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_M * c
}

/**
 * Check whether a point is inside a circle geofence.
 */
export const isPointInCircle = (
  lat: number,
  lng: number,
  center: GeoPoint,
  radiusMetres: number
): { inside: boolean; distance: number } => {
  const distance = haversineDistance(lat, lng, center.latitude, center.longitude)
  return { inside: distance <= radiusMetres, distance }
}

/**
 * Ray-casting algorithm – check whether a point is inside a polygon.
 */
export const isPointInPolygon = (
  lat: number,
  lng: number,
  polygon: GeoPoint[]
): boolean => {
  if (!polygon || polygon.length < 3) return false
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude
    const yi = polygon[i].longitude
    const xj = polygon[j].latitude
    const yj = polygon[j].longitude
    const intersect =
      yi > lng !== yj > lng &&
      lat < ((xj - xi) * (lng - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}
