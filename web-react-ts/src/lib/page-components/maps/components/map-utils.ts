import { PlaceType } from './MapComponent'

type MapIconType = google.maps.Icon
export type Neo4jLocation = { x: number; y: number }
export type MemberMapData = {
  id: string
  firstName: string
  lastName: string
  phoneNumber: string
  whatsappNumber: string
  location: Neo4jLocation
}

export const getMapIcon = (place: PlaceType) => {
  if (place.typename === 'Member') {
    return {
      url: 'https://res.cloudinary.com/firstlovecenter/image/upload/v1678537048/map-icons/people-marker_j5g9ut.png',
      scaledSize: new google.maps.Size(40, 40),
    } as MapIconType
  }
  if (place.typename === 'Fellowship') {
    return {
      url: 'https://res.cloudinary.com/firstlovecenter/image/upload/v1678533889/map-icons/bible-fellowship-service_hlpo0d.png',
      scaledSize: new google.maps.Size(40, 40),
    } as MapIconType
  }
  if (place.typename === 'IndoorVenue') {
    return {
      url: 'https://res.cloudinary.com/firstlovecenter/image/upload/v1678534118/map-icons/univenue-marker_n2zdqi.png',
      scaledSize: new google.maps.Size(40, 40),
    } as MapIconType
  }
  if (place.typename === 'OutdoorVenue') {
    return {
      url: 'https://res.cloudinary.com/firstlovecenter/image/upload/v1678533891/map-icons/loud-speaker-outdoor-venue_wqpjqr.png',
      scaledSize: new google.maps.Size(30, 30),
    } as MapIconType
  }

  if (place.typename === 'HighSchool') {
    return {
      url: 'https://res.cloudinary.com/firstlovecenter/image/upload/v1678533894/map-icons/school-shs-schools_cfm6sr.png',
      scaledSize: new google.maps.Size(40, 40),
    } as MapIconType
  }

  return undefined
}

export const getMapIconClass = (place: PlaceType) => {
  if (place.typename === 'Member') {
    return 'member-label'
  }

  if (place.typename === 'Fellowship') {
    return 'fellowship-label'
  }
  if (place.typename === 'IndoorVenue') {
    return 'indoor-venue-label'
  }
  if (place.typename === 'OutdoorVenue') {
    return 'outdoor-venue-label'
  }

  if (place.typename === 'HighSchool') {
    return 'high-school-label'
  }

  return undefined
}
