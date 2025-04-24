import { gql } from '@apollo/client'

export const REMOVE_USER_ROLE = gql`
  mutation RemoveRoleFromMember($role: String!) {
    RemoveRoleFromMember(role: $role)
  }
`

export const FELLOWSHIP_LEADER_DASHBOARD = gql`
  query fellowshipLeaderDashboard($fellowshipId: ID!) {
    fellowships(where: { id: $fellowshipId }) {
      id
      name
      leader {
        id
        fullName
      }
      serviceLogs {
        id
        historyRecord
        serviceRecords {
          createdAt
          attendance
          income
          serviceDate {
            date
          }
        }
      }
    }
  }
`

export const SERVANT_CHURCH_LIST = gql`
  query churchList($id: ID!) {
    members(where: { id: $id }) {
      id
      firstName
      lastName
      fullName

      leadsBacenta {
        id
        name
        isManualBanking
        vacationStatus
      }
      leadsGovernorship {
        id
        name
        isManualBanking
      }
      leadsCouncil {
        id
        name
        isManualBanking
      }
      leadsStream {
        id
        name
        vacationStatus
        isManualBanking
      }
      leadsCampus {
        id
        name
        currency
        conversionRateToDollar
        noIncomeTracking
      }
      leadsOversight {
        id
        name
      }
      leadsDenomination {
        id
        name
      }
      isAdminForGovernorship {
        id
        name
        isManualBanking
      }
      isAdminForCouncil {
        id
        name
        isManualBanking
      }
      isAdminForStream {
        id
        name
        vacationStatus
        isManualBanking
      }
      isAdminForCampus {
        id
        name
        currency
        conversionRateToDollar
        noIncomeTracking
      }

      isAdminForOversight {
        id
        name
      }
      isAdminForDenomination {
        id
        name
      }

      isArrivalsAdminForGovernorship {
        id
        name
      }
      isArrivalsAdminForStream {
        id
        name
        vacationStatus
      }
      isArrivalsAdminForCampus {
        id
        name
      }

      #MArrivals
      isArrivalsCounterForStream {
        id
        name
      }
      isArrivalsAdminForCouncil {
        id
        name
      }

      isTellerForStream {
        id
        name
        vacationStatus
        bankAccount
      }
      isArrivalsPayerForCouncil {
        id
        name
      }

      #sheepSeeking
      isSheepSeekerForStream {
        id
        name
        bankAccount
      }

      leadsHub {
        id
        name
        vacationStatus
      }

      leadsHubCouncil {
        id
        name
      }

      leadsMinistry {
        id
        name
        vacationStatus
      }

      leadsCreativeArts {
        id
        name
      }
      isAdminForMinistry {
        id
        name
        vacationStatus
      }
      isAdminForCreativeArts {
        id
        name
      }
    }
  }
`

export const SERVANT_CHURCHES_COUNT = gql`
  query churchesLed($id: ID!) {
    members(where: { id: $id }) {
      id
      memberCount
      basontaMembershipCount
      leadsFellowshipCount
      leadsBacentaCount
      leadsAdminsGovernorshipCount
      leadsAdminsCouncilCount
      leadsAdminsCampusCount
      leadsHubCount
      leadsAdminsMinistryCount
      leadsAdminsCreativeArtsCount
    }
  }
`
