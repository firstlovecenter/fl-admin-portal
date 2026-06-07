import { gql } from '@apollo/client'

export const GOVERNORSHIP_ARRIVALS_DASHBOARD = gql`
  query governorshipArrivalsDashboard($id: ID!, $arrivalDate: String!) {
    governorships(where: { id: { eq: $id } }, limit: 1) {
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
      bussesOnTheWayCount(arrivalDate: $arrivalDate)
      bussesThatArrivedCount(arrivalDate: $arrivalDate)
    }
  }
`

export const COUNCIL_ARRIVALS_DASHBOARD = gql`
  query councilArrivalsDashboard($id: ID!, $arrivalDate: String!) {
    councils(where: { id: { eq: $id } }, limit: 1) {
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
    streams(where: { id: { eq: $id } }, limit: 1) {
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
    campuses(where: { id: { eq: $id } }, limit: 1) {
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
    timeGraphs(where: { date: { eq: $date } }) {
      id
      date
      swell
    }
  }
`

export const CONFIRM_GOVERNORSHIP_ARRIVALS = gql`
  query confirmGovernorshipArrivals($id: ID!, $arrivalDate: String!) {
    governorships(where: { id: { eq: $id } }, limit: 1) {
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

export const CONFIRM_COUNCIL_ARRIVALS = gql`
  query confirmCouncilArrivals($id: ID!, $arrivalDate: String!) {
    councils(where: { id: { eq: $id } }, limit: 1) {
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

export const CONFIRM_STREAM_ARRIVALS = gql`
  query confirmStreamArrivals($id: ID!, $arrivalDate: String!) {
    streams(where: { id: { eq: $id } }, limit: 1) {
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

export const CONFIRM_CAMPUS_ARRIVALS = gql`
  query confirmGatheringArrivals($id: ID!, $arrivalDate: String!) {
    campuses(where: { id: { eq: $id } }, limit: 1) {
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
  query bacentaArrivals($id: ID!, $date: Date!, $bussingDate: String!) {
    bacentas(where: { id: { eq: $id } }, limit: 1) {
      id
      name
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
      bussingThisWeek(bussingDate: $bussingDate) {
        id
        createdAt
        serviceDate {
          date
        }
        attendance
        leaderDeclaration
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
    timeGraphs(where: { date: { eq: $date } }) {
      id
      date
      swell
    }
  }
`

export const GOVERNORSHIP_LEADER_ARRIVALS = gql`
  query governorshipLeaderArrivals($id: ID!) {
    members(where: { id: { eq: $id } }, limit: 1) {
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
    members(where: { id: { eq: $id } }, limit: 1) {
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
    members(where: { id: { eq: $id } }, limit: 1) {
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
    members(where: { id: { eq: $id } }, limit: 1) {
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
    bussingRecords(where: { id: { eq: $bussingRecordId } }) {
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
      mobileNetwork
      momoNumber
      momoName
      vehicleRecords {
        id
        vehicle
        arrivalTime
        attendance
      }
    }
    bacentas(where: { id: { eq: $bacentaId } }) {
      id
      name
      stream {
        id
        arrivalStartTime
        arrivalEndTime
        meetingDay {
          day
          dayNumber
        }
      }
    }
  }
`
export const DISPLAY_VEHICLE_RECORDS = gql`
  query DisplayVehicleRecords($vehicleRecordId: ID!, $bacentaId: ID!) {
    vehicleRecords(where: { id: { eq: $vehicleRecordId } }) {
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
      bussingRecord {
        id
        mobilisationPicture
      }
    }
    bacentas(where: { id: { eq: $bacentaId } }) {
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
    }
  }
`

export const DISPLAY_VEHICLE_PAYMENT_RECORDS = gql`
  query DisplayVehiclePaymentRecords($vehicleRecordId: ID!, $bacentaId: ID!) {
    vehicleRecords(where: { id: { eq: $vehicleRecordId } }) {
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
    bacentas(where: { id: { eq: $bacentaId } }) {
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
    }
  }
`

export const DISPLAY_ARRIVALS_PAYMENT_DATA = gql`
  query DisplayArrivalsPaymentData(
    $arrivalsDate: String!
    $streamId: ID!
    $offset: Int!
    $limit: Int!
  ) {
    streams(where: { id: { eq: $streamId } }) {
      id
      name
      arrivalsPaymentCount(arrivalsDate: $arrivalsDate)
      arrivalsPaymentData(
        arrivalsDate: $arrivalsDate
        limit: $limit
        offset: $offset
      ) {
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
