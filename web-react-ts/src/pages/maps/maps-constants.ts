import type { LatLng, PlaceType } from './types'

export const FLC_HQ: LatLng = { lat: 5.655949, lng: -0.167033 }

// Key paths, not copy: this is a module constant so it cannot call the
// component's `t`. InfoWindowCard resolves the entry at render. An empty
// string means the type contributes no prefix to the heading.
export const TYPENAME_LABEL_KEY: Record<PlaceType['typename'], string> = {
  Member: '',
  Bacenta: 'shared.churchLevel.Bacenta',
  GooglePlace: 'maps.typename.googlePlace',
  IndoorVenue: 'maps.typename.indoorVenue',
  OutdoorVenue: 'maps.typename.outdoorVenue',
  HighSchool: 'maps.typename.highSchool',
  Hostel: 'maps.typename.hostel',
}
