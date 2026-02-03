import { gql } from '@apollo/client'

export const CAMPUS_BACENTA_SERVICES_THIS_WEEK = gql`
  query campusBacentaServicesThisWeekReport($id: ID!) {
    campuses(where: { id: $id }) {
      id
      name

      servicesThisWeek {
        id
        name

        services(limit: 1) {
          id
          attendance
          income
          serviceDate {
            date
          }
          noServiceReason
          bankingProof
        }
      }
    }
  }
`
