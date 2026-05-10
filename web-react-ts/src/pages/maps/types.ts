export type LatLng = google.maps.LatLngLiteral

export type PlaceType = {
  id: string
  name: string
  typename:
    | 'GooglePlace'
    | 'Member'
    | 'Bacenta'
    | 'IndoorVenue'
    | 'OutdoorVenue'
    | 'HighSchool'
    | 'Hostel'
  picture?: string
  description?: string
  position: LatLng
}

export type VenueKind = 'indoor' | 'outdoor' | 'hostel' | 'school'

export type SortDirection = 'Name' | 'Capacity' | ''
