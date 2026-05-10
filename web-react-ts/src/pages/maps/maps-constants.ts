import type { LatLng, PlaceType } from './types'

export const FLC_HQ: LatLng = { lat: 5.655949, lng: -0.167033 }

export const TYPENAME_LABEL: Record<PlaceType['typename'], string> = {
  Member: '',
  Bacenta: 'Bacenta',
  GooglePlace: 'Google Place',
  IndoorVenue: 'Indoor Venue',
  OutdoorVenue: 'Outdoor Venue',
  HighSchool: 'High School',
  Hostel: 'Hostel',
}
