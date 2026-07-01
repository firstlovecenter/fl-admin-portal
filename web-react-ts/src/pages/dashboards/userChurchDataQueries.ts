import { gql } from '@apollo/client'

export const SERVANT_BACENTA_LEADER = gql`
  query bacentaLeader($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      leadsBacenta {
        id
        name
        meetingDay {
          day
          dayNumber
        }

        vacationStatus

        governorship {
          id
          council {
            id
            stream {
              id
              meetingDay {
                day
                dayNumber
              }
            }
          }
        }

        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          week
          year
        }

        services(limit: 24) {
          id
          createdAt
          attendance
          income
          week
          noServiceReason
          bankingProof
          transactionStatus
          serviceDate {
            date
          }
        }

        bussing(limit: 24) {
          id
          createdAt
          attendance
          week
          serviceDate {
            date
          }
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }
      }
    }
  }
`

export const SERVANT_GOVERNORSHIP_LEADER = gql`
  query governorshipLeader($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      leadsGovernorship {
        id
        name

        council {
          id
        }
        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANT_COUNCIL_LEADER = gql`
  query councilLeader($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      leadsCouncil {
        id
        name

        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANT_STREAM_LEADER = gql`
  query streamLeader($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      leadsStream {
        id
        name

        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANT_CAMPUS_LEADER = gql`
  query campusLeader($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      leadsCampus {
        id
        name
        currency
        noIncomeTracking
        conversionRateToDollar

        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANT_OVERSIGHT_LEADER = gql`
  query oversightLeader($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      leadsOversight {
        id
        name

        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          currency
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANT_DENOMINATION_LEADER = gql`
  query denominationLeader($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      leadsDenomination {
        id
        name

        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          currency
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANT_GOVERNORSHIP_ADMIN = gql`
  query governorshipAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isAdminForGovernorship {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
        }
        council {
          id
        }
        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANT_COUNCIL_ADMIN = gql`
  query councilAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isAdminForCouncil {
        id
        name

        leader {
          id
          firstName
          lastName
          fullName
        }
        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANTS_STREAM_ADMIN = gql`
  query streamAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isAdminForStream {
        id
        name

        leader {
          id
          firstName
          lastName
          fullName
        }
        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANTS_CAMPUS_ADMIN = gql`
  query campusAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isAdminForCampus {
        id
        name
        currency
        noIncomeTracking
        conversionRateToDollar

        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          dollarIncome
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANTS_OVERSIGHT_ADMIN = gql`
  query oversightAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isAdminForOversight {
        id
        name

        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          dollarIncome
          currency
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANTS_DENOMINATION_ADMIN = gql`
  query denominationAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isAdminForDenomination {
        id
        name

        aggregateServiceRecords(limit: 24) {
          id
          attendance
          income
          dollarIncome
          currency
          week
          year
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }

        services(limit: 24) {
          id
          week
          noServiceReason
          bankingProof
          transactionStatus
        }
      }
    }
  }
`

export const SERVANTS_GOVERNORSHIP_ARRIVALS_ADMIN = gql`
  query governorshipArrivalsAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isArrivalsAdminForGovernorship {
        id
        name

        leader {
          id
          firstName
          lastName
          fullName
        }
        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }
      }
    }
  }
`

export const SERVANTS_COUNCIL_ARRIVALS_ADMIN = gql`
  query councilArrivalsAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isArrivalsAdminForCouncil {
        id
        name

        leader {
          id
          firstName
          lastName
          fullName
        }
        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }
      }
    }
  }
`

export const SERVANTS_STREAM_ARRIVALS_ADMIN = gql`
  query streamArrivalsAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isArrivalsAdminForStream {
        id
        name

        leader {
          id
          firstName
          lastName
          fullName
        }
        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }
      }
    }
  }
`

export const SERVANTS_CAMPUS_ARRIVALS_ADMIN = gql`
  query campusArrivalsAdmin($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isArrivalsAdminForCampus {
        id
        name
        currency
        noIncomeTracking
        conversionRateToDollar

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }
      }
    }
  }
`

export const SERVANTS_STREAM_ARRIVALS_COUNTER = gql`
  query streamArrivalsCounter($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isArrivalsCounterForStream {
        id
        name

        leader {
          id
          firstName
          lastName
          fullName
        }

        aggregateBussingRecords(limit: 24) {
          id
          attendance
          week
          year
        }
      }
    }
  }
`

export const SERVANTS_STREAM_TELLER = gql`
  query streamArrivalsTeller($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id

      isTellerForStream {
        id
        name

        leader {
          id
          firstName
          lastName
          fullName
        }
      }
    }
  }
`

