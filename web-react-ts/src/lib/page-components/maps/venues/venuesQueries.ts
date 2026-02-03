import { gql } from '@apollo/client'

export const GET_INDOOR_VENUES = gql`
  query IndoorVenues($options: IndoorVenueOptions) {
    indoorVenues(options: $options) {
      id
      name
      capacity
      location {
        latitude
        longitude
      }
    }
  }
`
export const GET_OUTDOOR_VENUES = gql`
  query OutdoorVenues($options: OutdoorVenueOptions) {
    outdoorVenues(options: $options) {
      id
      name
      capacity
      location {
        latitude
        longitude
      }
    }
  }
`
export const GET_SENIOR_HIGH_SCHOOLS = gql`
  query HighSchools($options: HighSchoolOptions) {
    highSchools(options: $options) {
      capacity
      id
      location {
        latitude
        longitude
      }
      name
      school
    }
  }
`
export const GET_HOSTEL_INFORMATION = gql`
  query Hostels($options: HostelOptions) {
    hostels(options: $options) {
      capacity
      id
      name
      university
      school
      location {
        latitude
        longitude
      }
    }
  }
`
