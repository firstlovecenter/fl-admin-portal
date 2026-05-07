import { gql } from '@apollo/client'

export const BACENTA_GRAPHS = gql`
  query bacentaGraphs($id: ID!, $limit: Int = 4, $skip: Int = 0) {
    bacentas(where: { id: $id }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: $limit, skip: $skip) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: $limit, skip: $skip) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: $limit, skip: $skip) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }
      bussing(limit: $limit, skip: $skip) {
        id
        createdAt
        attendance
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const GOVERNORSHIP_GRAPHS = gql`
  query governorshipGraphs($id: ID!, $limit: Int = 4, $skip: Int = 0) {
    governorships(where: { id: $id }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: $limit, skip: $skip) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: $limit, skip: $skip) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: $limit, skip: $skip) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const COUNCIL_GRAPHS = gql`
  query councilGraphs($councilId: ID!, $limit: Int = 4, $skip: Int = 0) {
    councils(where: { id: $councilId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: $limit, skip: $skip) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: $limit, skip: $skip) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: $limit, skip: $skip) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const STREAM_GRAPHS = gql`
  query streamGraphs($streamId: ID!, $limit: Int = 4, $skip: Int = 0) {
    streams(where: { id: $streamId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: $limit, skip: $skip) {
        id
        attendance
        income
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: $limit, skip: $skip) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: $limit, skip: $skip) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const CAMPUS_GRAPHS = gql`
  query campusGraphs($campusId: ID!, $limit: Int = 4, $skip: Int = 0) {
    campuses(where: { id: $campusId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: $limit, skip: $skip) {
        id
        attendance
        income
        dollarIncome
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: $limit, skip: $skip) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: $limit, skip: $skip) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const OVERSIGHT_GRAPHS = gql`
  query oversightGraphs($oversightId: ID!, $limit: Int = 4, $skip: Int = 0) {
    oversights(where: { id: $oversightId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: $limit, skip: $skip) {
        id
        attendance
        income
        dollarIncome
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: $limit, skip: $skip) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }
      services(limit: $limit, skip: $skip) {
        id
        createdAt
        attendance
        income
        week
        serviceDate {
          date
        }
      }

      memberCount
    }
  }
`

export const DENOMINATION_GRAPHS = gql`
  query denominationGraphs(
    $denominationId: ID!
    $limit: Int = 4
    $skip: Int = 0
  ) {
    denominations(where: { id: $denominationId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
        nameWithTitle
      }
      aggregateServiceRecords(limit: $limit, skip: $skip) {
        id
        attendance
        income
        dollarIncome
        numberOfServices
        week
      }
      aggregateBussingRecords(limit: $limit, skip: $skip) {
        id
        attendance
        week
        numberOfSprinters
        numberOfUrvans
        numberOfCars
      }

      memberCount
    }
  }
`

