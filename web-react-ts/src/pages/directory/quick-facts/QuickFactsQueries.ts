import { gql } from '@apollo/client'

export const FELLOWSHIP_AVG_WEEKDAY_STATS = gql`
  query fellowshipAvgWeekdayStats($fellowshipId: ID, $days: Int!) {
    fellowships(where: { id: $fellowshipId }) {
      id
      name
      leader {
        id
        firstName
        lastName
      }
      avgWeekdayStats(days: $days) {
        income
        attendance
      }
      council {
        id
        name
        avgFellowshipWeekdayStats(days: $days) {
          income
          attendance
        }
      }
    }
  }
`

export const BACENTA_AVG_WEEKDAY_STATS = gql`
  query bacentaAvgWeekdayStats($bacentaId: ID, $days: Int!) {
    bacentas(where: { id: $bacentaId }) {
      id
      name
      avgBussingAttendance(days: $days)
      leader {
        id
        firstName
        lastName
      }
      avgWeekdayStats(days: $days) {
        income
        attendance
      }
      council {
        id
        name
        avgBacentaBussingAttendance(days: $days)
        avgBacentaWeekdayStats(days: $days) {
          income
          attendance
        }
      }
    }
  }
`

export const CONSTITUENCY_AVG_WEEKDAY_STATS = gql`
  query constituencyAvgWeekdayStats($constituencyId: ID, $days: Int!) {
    constituencies(where: { id: $constituencyId }) {
      id
      name
      avgBussingAttendance(days: $days)
      leader {
        id
        firstName
        lastName
      }
      avgWeekdayStats(days: $days) {
        income
        attendance
      }
      council {
        id
        name
        avgConstituencyBussingAttendance(days: $days)
        avgConstituencyWeekdayStats(days: $days) {
          income
          attendance
        }
      }
    }
  }
`

export const COUNCIL_AVG_WEEKDAY_STATS = gql`
  query councilAvgWeekdayStats($councilId: ID, $days: Int!) {
    councils(where: { id: $councilId }) {
      id
      name
      avgBussingAttendance(days: $days)
      leader {
        id
        firstName
        lastName
      }
      avgWeekdayStats(days: $days) {
        income
        attendance
      }
      stream {
        id
        name
        avgCouncilBussingAttendance(days: $days)
        avgCouncilWeekdayStats(days: $days) {
          income
          attendance
        }
      }
    }
  }
`

export const STREAM_AVG_WEEKDAY_STATS = gql`
  query streamAvgWeekdayStats($streamId: ID, $days: Int!) {
    streams(where: { id: $streamId }) {
      id
      name
      avgBussingAttendance(days: $days)
      leader {
        id
        firstName
        lastName
      }
      avgWeekdayStats(days: $days) {
        income
        attendance
      }
      gatheringService {
        id
        name
        avgStreamBussingAttendance(days: $days)
        avgStreamWeekdayStats(days: $days) {
          income
          attendance
        }
      }
    }
  }
`

export const GATHERING_SERVICE_AVG_WEEKDAY_STATS = gql`
  query gatheringServiceAvgWeekdayStats($gatheringServiceId: ID, $days: Int!) {
    gatheringServices(where: { id: $gatheringServiceId }) {
      id
      name
      avgBussingAttendance(days: $days)
      leader {
        id
        firstName
        lastName
      }
      avgWeekdayStats(days: $days) {
        income
        attendance
      }
      oversight {
        id
        name
        avgGatheringServiceBussingAttendance(days: $days)
        avgGatheringServiceWeekdayStats(days: $days) {
          income
          attendance
        }
      }
    }
  }
`
