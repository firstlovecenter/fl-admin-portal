import { gql } from '@apollo/client'

export const GET_INDOOR_VENUES = gql`
  query IndoorVenues(
    $limit: Int
    $offset: Int
    $sort: [IndoorVenueSort!]
  ) {
    indoorVenues(limit: $limit, offset: $offset, sort: $sort) {
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
  query OutdoorVenues(
    $limit: Int
    $offset: Int
    $sort: [OutdoorVenueSort!]
  ) {
    outdoorVenues(limit: $limit, offset: $offset, sort: $sort) {
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
  query HighSchools(
    $limit: Int
    $offset: Int
    $sort: [HighSchoolSort!]
  ) {
    highSchools(limit: $limit, offset: $offset, sort: $sort) {
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
  query Hostels(
    $limit: Int
    $offset: Int
    $sort: [HostelSort!]
  ) {
    hostels(limit: $limit, offset: $offset, sort: $sort) {
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
