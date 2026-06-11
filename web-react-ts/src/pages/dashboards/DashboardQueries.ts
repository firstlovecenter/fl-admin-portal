import { gql } from '@apollo/client'

export const REMOVE_USER_ROLE = gql`
  mutation RemoveRoleFromMember($role: String!) {
    RemoveRoleFromMember(role: $role)
  }
`

export const SERVANT_CHURCH_LIST = gql`
  query churchList($id: ID!) {
    members(where: { id: { eq: $id } }) {
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
        isManualBanking
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
        isManualBanking
      }
      isArrivalsPayerForCouncil {
        id
        name
      }

    }
  }
`

export const SERVANT_CHURCHES_COUNT = gql`
  query churchesLed($id: ID!) {
    members(where: { id: { eq: $id } }) {
      id
      memberCount
    }
  }
`
