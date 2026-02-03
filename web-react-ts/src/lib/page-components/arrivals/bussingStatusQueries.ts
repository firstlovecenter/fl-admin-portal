import { gql } from '@apollo/client'

// No Activity Queries
export const GOVERNORSHIP_BACENTAS_NO_ACTIVITY = gql`
  query governorshipBacentasNoActivity($id: ID!, $arrivalDate: String!) {
    governorships(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasNoActivity(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`

export const COUNCIL_BACENTAS_NO_ACTIVITY = gql`
  query councilBacentasNoActivity($id: ID!, $arrivalDate: String!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasNoActivity(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`

export const STREAM_BACENTAS_NO_ACTIVITY = gql`
  query streamBacentasNoActivity($id: ID!, $arrivalDate: String!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasNoActivity(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`

export const CAMPUS_BACENTAS_NO_ACTIVITY = gql`
  query gatheringBacentasNoActivity($id: ID!, $arrivalDate: String!) {
    campuses(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasNoActivity(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
      }
    }
  }
`

export const GOVERNORSHIP_BACENTAS_MOBILISING = gql`
  query governorshipBacentasMobilising($id: ID!, $arrivalDate: String!) {
    governorships(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasMobilising(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`

export const COUNCIL_BACENTAS_MOBILISING = gql`
  query councilBacentasMobilising($id: ID!, $arrivalDate: String!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasMobilising(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`

export const STREAM_BACENTAS_MOBILISING = gql`
  query streamBacentasMobilising($id: ID!, $arrivalDate: String!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasMobilising(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`

export const CAMPUS_BACENTAS_MOBILISING = gql`
  query gatheringBacentasMobilising($id: ID!, $arrivalDate: String!) {
    campuses(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasMobilising(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`

export const GOVERNORSHIP_BACENTAS_ON_THE_WAY = gql`
  query governorshipBacentasOnTheWay($id: ID!, $arrivalDate: String!) {
    governorships(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasOnTheWay(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`

export const COUNCIL_BACENTAS_ON_THE_WAY = gql`
  query councilBacentasOnTheWay($id: ID!, $arrivalDate: String!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasOnTheWay(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`
export const STREAM_BACENTAS_ON_THE_WAY = gql`
  query streamBacentasOnTheWay($id: ID!, $arrivalDate: String!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasOnTheWay(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`

export const CAMPUS_BACENTAS_ON_THE_WAY = gql`
  query gatheringBacentasOnTheWay($id: ID!, $arrivalDate: String!) {
    campuses(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasOnTheWay(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`

export const GOVERNORSHIP_BACENTAS_TO_COUNT = gql`
  query governorshipBacentasToCount($id: ID!, $arrivalDate: String!) {
    governorships(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasNotCounted(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`

export const COUNCIL_BACENTAS_TO_COUNT = gql`
  query councilBacentasToCount($id: ID!, $arrivalDate: String!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasNotCounted(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`

export const COUNCIL_VEHICLES_TO_BE_PAID = gql`
  query councilVehiclesToBePaid($id: ID!, $arrivalDate: String!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasToBePaid(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          vehicleRecords(where: { arrivalTime_NOT: null, vehicleTopUp_GT: 0 }) {
            id
            attendance
            vehicle
            vehicleTopUp
            arrivalTime
            transactionStatus
            transactionReference
          }
        }
      }
    }
  }
`

export const STREAM_BACENTAS_TO_COUNT = gql`
  query streamBacentasToCount($id: ID!, $arrivalDate: String!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasNotCounted(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          vehicleRecords(where: { arrivalTime: null }) {
            id
            attendance
            vehicle
            arrivalTime
          }
        }
      }
    }
  }
`

export const CAMPUS_BACENTAS_TO_COUNT = gql`
  query gatheringBacentasToCount($id: ID!, $arrivalDate: String!) {
    campuses(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasNotCounted(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
        }
      }
    }
  }
`

export const GOVERNORSHIP_BACENTAS_ARRIVED = gql`
  query governorshipBacentasArrived($id: ID!, $arrivalDate: String!) {
    governorships(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasHaveArrived(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
          attendance
        }
      }
    }
  }
`

export const COUNCIL_BACENTAS_ARRIVED = gql`
  query councilBacentasArrived($id: ID!, $arrivalDate: String!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasHaveArrived(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
          attendance
        }
      }
    }
  }
`

export const STREAM_BACENTAS_ARRIVED = gql`
  query streamBacentasArrived($id: ID!, $arrivalDate: String!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasHaveArrived(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
          attendance
        }
      }
    }
  }
`

export const CAMPUSES_BACENTAS_ARRIVED = gql`
  query gatheringBacentasArrived($id: ID!, $arrivalDate: String!) {
    campuses(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasHaveArrived(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
          attendance
        }
      }
    }
  }
`

export const GOVERNORSHIP_BACENTAS_BELOW_8 = gql`
  query governorshipBacentasBelow8($id: ID!, $arrivalDate: String!) {
    governorships(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasBelow8(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
          attendance
        }
      }
    }
  }
`

export const COUNCIL_BACENTAS_BELOW_8 = gql`
  query councilBacentasBelow8($id: ID!, $arrivalDate: String!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasBelow8(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
          attendance
        }
      }
    }
  }
`

export const STREAM_BACENTAS_BELOW_8 = gql`
  query streamBacentasBelow8($id: ID!, $arrivalDate: String!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasBelow8(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
          attendance
        }
      }
    }
  }
`

export const CAMPUS_BACENTAS_BELOW_8 = gql`
  query gatheringBacentasBelow8($id: ID!, $arrivalDate: String!) {
    campuses(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      bacentasBelow8(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          nameWithTitle
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussingThisWeek(limit: 1, bussingDate: $arrivalDate) {
          id
          attendance
        }
      }
    }
  }
`
