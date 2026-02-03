import { gql } from '@apollo/client'

export const MAKE_GOVERNORSHIPARRIVALS_ADMIN = gql`
  mutation MakeGovernorshipArrrivalsAdmin(
    $governorshipId: ID!
    $newAdminId: ID!
    $oldAdminId: ID!
  ) {
    RemoveGovernorshipArrivalsAdmin(
      governorshipId: $governorshipId
      arrivalsAdminId: $oldAdminId
      newArrivalsAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeGovernorshipArrivalsAdmin(
      governorshipId: $governorshipId
      arrivalsAdminId: $newAdminId
      oldArrivalsAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      fullName
      isArrivalsAdminForGovernorship {
        id
        arrivalsAdmin {
          id
          firstName
          lastName
          fullName
        }
      }
    }
  }
`

export const MAKE_COUNCILARRIVALS_ADMIN = gql`
  mutation MakeCouncilArrrivalsAdmin(
    $councilId: ID!
    $newAdminId: ID!
    $oldAdminId: ID!
  ) {
    RemoveCouncilArrivalsAdmin(
      councilId: $councilId
      arrivalsAdminId: $oldAdminId
      newArrivalsAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeCouncilArrivalsAdmin(
      councilId: $councilId
      arrivalsAdminId: $newAdminId
      oldArrivalsAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      fullName
      isArrivalsAdminForCouncil {
        id
        arrivalsAdmin {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const MAKE_STREAMARRIVALS_ADMIN = gql`
  mutation MakeStreamArrrivalsAdmin(
    $streamId: ID!
    $newAdminId: ID!
    $oldAdminId: ID!
  ) {
    RemoveStreamArrivalsAdmin(
      streamId: $streamId
      arrivalsAdminId: $oldAdminId
      newArrivalsAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeStreamArrivalsAdmin(
      streamId: $streamId
      arrivalsAdminId: $newAdminId
      oldArrivalsAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      isArrivalsAdminForStream {
        id
        arrivalsAdmin {
          id
          firstName
          lastName
        }
      }
    }
  }
`

export const MAKE_CAMPUSARRIVALS_ADMIN = gql`
  mutation MakeCampusArrrivalsAdmin(
    $campusId: ID!
    $newAdminId: ID!
    $oldAdminId: ID!
  ) {
    RemoveCampusArrivalsAdmin(
      campusId: $campusId
      arrivalsAdminId: $oldAdminId
      newArrivalsAdminId: $newAdminId
    ) {
      id
      firstName
      lastName
    }
    MakeCampusArrivalsAdmin(
      campusId: $campusId
      arrivalsAdminId: $newAdminId
      oldArrivalsAdminId: $oldAdminId
    ) {
      id
      firstName
      lastName
      isArrivalsAdminForCampus {
        id
        arrivalsAdmin {
          id
          firstName
          lastName
        }
      }
    }
  }
`
export const UPLOAD_MOBILISATION_PICTURE = gql`
  mutation UploadMobilisationPicture(
    $bacentaId: ID!
    $serviceDate: String!
    $mobilisationPicture: String!
  ) {
    UploadMobilisationPicture(
      bacentaId: $bacentaId
      serviceDate: $serviceDate
      mobilisationPicture: $mobilisationPicture
    ) {
      id
      attendance
      mobilisationPicture
      serviceLog {
        bacenta {
          id
          stream_name
          bussing(limit: 1) {
            id
            serviceDate {
              date
            }
            week
            mobilisationPicture
          }
        }
      }
    }
  }
`

export const RECORD_BUSSING_FROM_BACENTA = gql`
  mutation RecordVehicleFromBacenta(
    $bacentaId: ID!
    $bussingRecordId: ID!
    $leaderDeclaration: Int!
    $vehicle: String!
    $picture: String!
  ) {
    RecordVehicleFromBacenta(
      bacentaId: $bacentaId
      bussingRecordId: $bussingRecordId
      leaderDeclaration: $leaderDeclaration
      vehicle: $vehicle
      picture: $picture
    ) {
      id
      leaderDeclaration
      attendance
      vehicleTopUp
      bussingRecord {
        serviceLog {
          bacenta {
            id
            stream_name
            bussing(limit: 1) {
              id
              week
            }
          }
        }
      }
    }
  }
`

export const CONFIRM_VEHICLE_BY_ADMIN = gql`
  mutation ConfirmVehicleByAdmin(
    $vehicleRecordId: ID!
    $attendance: Int!
    $vehicle: String!
    $comments: String!
  ) {
    ConfirmVehicleByAdmin(
      vehicleRecordId: $vehicleRecordId
      attendance: $attendance
      vehicle: $vehicle
      comments: $comments
    ) {
      id
      attendance
      arrivalTime
      vehicle
      vehicleTopUp
      momoName
      momoNumber

      counted_by {
        id
        firstName
        lastName
        fullName
      }

      comments
      outbound
    }
  }
`

export const SET_VEHICLE_SUPPORT = gql`
  mutation SetVehicleSupport($vehicleRecordId: ID!) {
    SetVehicleSupport(vehicleRecordId: $vehicleRecordId) {
      id
      vehicleTopUp
    }
  }
`

export const SEND_VEHICLE_SUPPORT = gql`
  mutation SendVehicleSupport(
    $vehicleRecordId: ID!
    $momoName: String!
    $momoNumber: String!
    $vehicleTopUp: Int!
    $outbound: Boolean!
  ) {
    SendVehicleSupport(
      vehicleRecordId: $vehicleRecordId
      momoName: $momoName
      momoNumber: $momoNumber
      vehicleTopUp: $vehicleTopUp
      outbound: $outbound
    ) {
      id
      vehicleTopUp
      momoNumber
      momoName
      outbound
      paystackTransferCode
      transactionStatus
    }
  }
`
export const SET_SWELL_DATE = gql`
  mutation SetSwellDate($date: String!) {
    SetSwellDate(date: $date) {
      id
      date
      swell
    }
  }
`

export const SET_CODE_OF_THE_DAY = gql`
  mutation SetCodeOfTheDay($code: String!) {
    SetCodeOfTheDay(code: $code)
  }
`
