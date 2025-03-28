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

export const GOVERNORSHIP_AVG_WEEKDAY_STATS = gql`
  query governorshipAvgWeekdayStats($governorshipId: ID, $days: Int!) {
    governorships(where: { id: $governorshipId }) {
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
        avgGovernorshipBussingAttendance(days: $days)
        avgGovernorshipWeekdayStats(days: $days) {
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
      campus {
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

export const CAMPUS_AVG_WEEKDAY_STATS = gql`
  query campusAvgWeekdayStats($campusId: ID, $days: Int!) {
    campuses(where: { id: $campusId }) {
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
        avgCampusBussingAttendance(days: $days)
        avgCampusWeekdayStats(days: $days) {
          income
          attendance
        }
      }
    }
  }
`
