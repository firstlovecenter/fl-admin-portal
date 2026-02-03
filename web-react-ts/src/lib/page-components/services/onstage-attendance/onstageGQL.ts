import { gql } from '@apollo/client'

export const RECORD_MINISTRY_ON_STAGE_ATTENDANCE = gql`
  mutation RecordMinistryOnStageAttendance(
    $churchId: ID!
    $serviceDate: String!
    $attendance: Int!
    $onStagePictures: [String!]!
  ) {
    RecordMinistryOnStageAttendance(
      churchId: $churchId
      serviceDate: $serviceDate
      attendance: $attendance
      onStagePictures: $onStagePictures
    ) {
      id
      week
    }
  }
`

export const DISPLAY_MINISTRY_ON_STAGE_ATTENDANCE = gql`
  query displayMinistryOnStageAttendanceDetails(
    $serviceId: ID!
    $ministryId: ID!
  ) {
    stageAttendanceRecords(where: { id: $serviceId }) {
      id
      week
      createdAt
      serviceDate {
        date
      }
      attendance
      onStagePictures
    }
    ministries(where: { id: $ministryId }) {
      id
      name
    }
  }
`
