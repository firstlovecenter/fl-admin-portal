import { gql } from '@apollo/client'

export const GOVERNORSHIP_ARRIVALS_DASHBOARD = gql`
  query governorshipArrivalsDashboard($id: ID!, $arrivalDate: String!) {
    governorships(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      council {
        id
        stream {
          id
          name
          meetingDay {
            day
            dayNumber
          }
          arrivalEndTime
        }
      }
      arrivalsAdmin {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      bacentasNoActivityCount(arrivalDate: $arrivalDate)
      bacentasMobilisingCount(arrivalDate: $arrivalDate)
      bacentasOnTheWayCount(arrivalDate: $arrivalDate)
      bacentasBelow8Count(arrivalDate: $arrivalDate)
      bacentasHaveArrivedCount(arrivalDate: $arrivalDate)
      bussingMembersOnTheWayCount(arrivalDate: $arrivalDate)
      bussingMembersHaveArrivedCount(arrivalDate: $arrivalDate)
      bussesThatArrivedCount(arrivalDate: $arrivalDate)

      bacentasHaveArrivedCount(arrivalDate: $arrivalDate)
      bussingMembersOnTheWayCount(arrivalDate: $arrivalDate)
      bussingMembersHaveArrivedCount(arrivalDate: $arrivalDate)
      bussesOnTheWayCount(arrivalDate: $arrivalDate)
      bussesThatArrivedCount(arrivalDate: $arrivalDate)
    }
  }
`

export const COUNCIL_ARRIVALS_DASHBOARD = gql`
  query councilArrivalsDashboard($id: ID!, $arrivalDate: String!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      stream {
        id
        name
        meetingDay {
          day
          dayNumber
        }
        arrivalEndTime
      }

      arrivalsAdmin {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      governorshipCount
      bacentasNoActivityCount(arrivalDate: $arrivalDate)
      bacentasMobilisingCount(arrivalDate: $arrivalDate)
      bacentasOnTheWayCount(arrivalDate: $arrivalDate)
      bacentasBelow8Count(arrivalDate: $arrivalDate)

      bacentasHaveArrivedCount(arrivalDate: $arrivalDate)
      bussingMembersOnTheWayCount(arrivalDate: $arrivalDate)
      bussingMembersHaveArrivedCount(arrivalDate: $arrivalDate)
      bussesOnTheWayCount(arrivalDate: $arrivalDate)
      bussesThatArrivedCount(arrivalDate: $arrivalDate)

      vehiclesToBePaidCount(arrivalDate: $arrivalDate)
      vehiclesHaveBeenPaidCount(arrivalDate: $arrivalDate)
      vehicleAmountToBePaid(arrivalDate: $arrivalDate)
      vehicleAmountHasBeenPaid(arrivalDate: $arrivalDate)
    }
  }
`

export const STREAM_ARRIVALS_DASHBOARD = gql`
  query streamArrivalsDashboard($id: ID!, $arrivalDate: String!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      meetingDay {
        day
        dayNumber
      }
      arrivalsAdmin {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      arrivalEndTime
      councilCount
      bacentasNoActivityCount(arrivalDate: $arrivalDate)
      bacentasMobilisingCount(arrivalDate: $arrivalDate)
      bacentasOnTheWayCount(arrivalDate: $arrivalDate)
      bacentasBelow8Count(arrivalDate: $arrivalDate)

      bacentasHaveArrivedCount(arrivalDate: $arrivalDate)
      bussingMembersOnTheWayCount(arrivalDate: $arrivalDate)
      bussingMembersHaveArrivedCount(arrivalDate: $arrivalDate)
      bussesOnTheWayCount(arrivalDate: $arrivalDate)
      bussesThatArrivedCount(arrivalDate: $arrivalDate)

      vehiclesNotCountedCount(arrivalDate: $arrivalDate)

      vehiclesToBePaidCount(arrivalDate: $arrivalDate)
      vehiclesHaveBeenPaidCount(arrivalDate: $arrivalDate)
      vehicleAmountToBePaid(arrivalDate: $arrivalDate)
      vehicleAmountHasBeenPaid(arrivalDate: $arrivalDate)
    }
  }
`

export const CAMPUS_ARRIVALS_DASHBOARD = gql`
  query gatheringArrivalsDashboard(
    $id: ID!
    $date: Date!
    $arrivalDate: String!
  ) {
    campuses(where: { id: $id }, options: { limit: 1 }) {
      id
      name

      arrivalsAdmin {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      streamCount
      bacentasNoActivityCount(arrivalDate: $arrivalDate)
      bacentasMobilisingCount(arrivalDate: $arrivalDate)
      bacentasOnTheWayCount(arrivalDate: $arrivalDate)
      bacentasBelow8Count(arrivalDate: $arrivalDate)

      bacentasHaveArrivedCount(arrivalDate: $arrivalDate)
      bussingMembersOnTheWayCount(arrivalDate: $arrivalDate)
      bussingMembersHaveArrivedCount(arrivalDate: $arrivalDate)
      bussesOnTheWayCount(arrivalDate: $arrivalDate)
      bussesThatArrivedCount(arrivalDate: $arrivalDate)

      vehiclesNotCountedCount(arrivalDate: $arrivalDate)

      vehiclesToBePaidCount(arrivalDate: $arrivalDate)
      vehiclesHaveBeenPaidCount(arrivalDate: $arrivalDate)
      vehicleAmountToBePaid(arrivalDate: $arrivalDate)
      vehicleAmountHasBeenPaid(arrivalDate: $arrivalDate)
    }
    timeGraphs(where: { date: $date }) {
      id
      date
      swell
    }
  }
`

export const CONFIRM_GOVERNORSHIP_ARRIVALS = gql`
  query confirmGovernorshipArrivals($id: ID!, $arrivalDate: String!) {
    governorships(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      stream_name
      bacentasOnTheWay(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussing(limit: 1) {
          id
          counted_by {
            id
            firstName
            lastName
            fullName
          }
        }
      }
    }
  }
`

export const CONFIRM_COUNCIL_ARRIVALS = gql`
  query confirmCouncilArrivals($id: ID!, $arrivalDate: String!) {
    councils(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      stream_name
      bacentasOnTheWay(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussing(limit: 1) {
          id
          counted_by {
            id
            firstName
            lastName
            fullName
          }
        }
      }
    }
  }
`

export const CONFIRM_STREAM_ARRIVALS = gql`
  query confirmStreamArrivals($id: ID!, $arrivalDate: String!) {
    streams(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      stream_name
      bacentasOnTheWay(arrivalDate: $arrivalDate) {
        id
        name
        leader {
          id
          firstName
          lastName
          fullName
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussing(limit: 1) {
          id
          counted_by {
            id
            firstName
            lastName
            fullName
          }
        }
      }
    }
  }
`

export const CONFIRM_CAMPUS_ARRIVALS = gql`
  query confirmGatheringArrivals($id: ID!, $arrivalDate: String!) {
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
          pictureUrl
          phoneNumber
          whatsappNumber
        }
        bussing(limit: 1) {
          id
          counted_by {
            id
            firstName
            lastName
            fullName
          }
        }
      }
    }
  }
`

export const BACENTA_ARRIVALS = gql`
  query bacentaArrivals($id: ID!, $date: Date!) {
    bacentas(where: { id: $id }, options: { limit: 1 }) {
      id
      name
      stream_name
      stream {
        id
        name
        meetingDay {
          day
          dayNumber
        }
        mobilisationStartTime
        mobilisationEndTime
        arrivalStartTime
        arrivalEndTime
      }
      momoNumber
      sprinterTopUp
      urvanTopUp

      arrivalsCodeOfTheDay
      bussing(limit: 1) {
        id
        createdAt
        serviceDate {
          date
        }
        attendance
        vehicleRecords {
          id
          vehicle
          attendance
          arrivalTime
        }
        week
        mobilisationPicture
      }
    }
    timeGraphs(where: { date: $date }) {
      id
      date
      swell
    }
  }
`

export const GOVERNORSHIP_LEADER_ARRIVALS = gql`
  query governorshipLeaderArrivals($id: ID!) {
    members(where: { id: $id }, options: { limit: 1 }) {
      id
      firstName
      lastName
      fullName
      leadsGovernorship {
        id
        name
      }
      isAdminForGovernorship {
        id
        name
      }
    }
  }
`

export const COUNCIL_LEADER_ARRIVALS = gql`
  query councilLeaderArrivals($id: ID!) {
    members(where: { id: $id }, options: { limit: 1 }) {
      id
      firstName
      lastName
      fullName
      leadsCouncil {
        id
        name
      }
      isAdminForCouncil {
        id
        name
      }
    }
  }
`

export const STREAM_LEADER_ARRIVALS = gql`
  query streamLeaderArrivals($id: ID!) {
    members(where: { id: $id }, options: { limit: 1 }) {
      id
      firstName
      lastName
      fullName
      leadsStream {
        id
        name
      }
      isAdminForStream {
        id
        name
      }
    }
  }
`

export const CAMPUS_LEADER_ARRIVALS = gql`
  query gatheringLeaderArrivals($id: ID!) {
    members(where: { id: $id }, options: { limit: 1 }) {
      id
      firstName
      lastName
      fullName
      leadsCampus {
        id
        name
      }
      isAdminForCampus {
        id
        name
      }
    }
  }
`

export const DISPLAY_BUSSING_RECORDS = gql`
  query DisplayBussingRecords($bussingRecordId: ID!, $bacentaId: ID!) {
    bussingRecords(where: { id: $bussingRecordId }) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      counted_by {
        id
        firstName
        lastName
        fullName
      }

      serviceDate {
        date
      }
      week
      mobilisationPicture
      leaderDeclaration
      attendance
      bussingTopUp
      numberOfBusses
      bussingPictures
      numberOfSprinters
      numberOfUrvans
      numberOfCars
      vehicleRecords {
        id
        vehicle
        arrivalTime
        attendance
      }
    }
    bacentas(where: { id: $bacentaId }) {
      id
      name
      stream_name
      stream {
        id
        arrivalStartTime
        arrivalEndTime
      }
    }
  }
`
export const DISPLAY_VEHICLE_RECORDS = gql`
  query DisplayVehicleRecords($vehicleRecordId: ID!, $bacentaId: ID!) {
    vehicleRecords(where: { id: $vehicleRecordId }) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      counted_by {
        id
        firstName
        lastName
        fullName
      }

      leaderDeclaration
      attendance
      vehicleTopUp
      vehicle
      picture
      comments
      arrivalTime
      outbound
      mobileNetwork
      momoName
      momoNumber
      transactionReference
      transactionStatus
    }
    bacentas(where: { id: $bacentaId }) {
      id
      name
      stream_name

      stream {
        id
        name
        meetingDay {
          day
          dayNumber
        }
        arrivalStartTime
        arrivalEndTime
      }
      bussing(limit: 1) {
        id
        vehicleRecords {
          id
        }
      }
    }
  }
`

export const DISPLAY_VEHICLE_PAYMENT_RECORDS = gql`
  query DisplayVehiclePaymentRecords($vehicleRecordId: ID!, $bacentaId: ID!) {
    vehicleRecords(where: { id: $vehicleRecordId }) {
      id
      createdAt
      created_by {
        id
        firstName
        lastName
        fullName
      }
      counted_by {
        id
        firstName
        lastName
        fullName
      }

      leaderDeclaration
      attendance
      vehicleCost
      picture
      momoNumber
      momoName
      vehicle
      arrivalTime
      outbound
      paystackTransferCode
      transactionStatus
    }
    bacentas(where: { id: $bacentaId }) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
        pictureUrl
      }
      governorship {
        id
        name
        council {
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
      stream {
        id
        name
      }
      bussing(limit: 1) {
        id
        vehicleRecords {
          id
        }
      }
    }
  }
`

export const DISPLAY_ARRIVALS_PAYMENT_DATA = gql`
  query DisplayArrivalsPaymentData($arrivalsDate: String!, $streamId: ID!) {
    streams(where: { id: $streamId }) {
      id
      name
      arrivalsPaymentData(arrivalsDate: $arrivalsDate) {
        stream
        bacenta
        councilHead
        leader
        bacentaCode
        attendance
        confirmedAttendance
        vehicle
        outbound
        topUp
        vehicleCost
        momoNumber
        momoName
        comments
        council
        governorship
        society
        date
        arrivalTime
      }
    }
  }
`
