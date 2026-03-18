import { gql } from '@apollo/client'

export const GET_LOGGED_IN_USER = gql`
  query memberByEmail($email: String!) {
    memberByEmail(email: $email) {
      id
      firstName
      lastName
      fullName
      currentTitle
      nameWithTitle
      pictureUrl
      stream_name

      bacenta {
        id
        governorship {
          id
          council {
            id
            stream {
              id
              campus {
                id
                noIncomeTracking
                currency
                conversionRateToDollar
                oversight {
                  id
                  denomination {
                    id
                  }
                }
              }
            }
          }
        }
      }

      # Servant leadership relationships
      leadsFellowship {
        id
        name
      }
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

      # Administrative relationships
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
      isAdminForMinistry {
        id
        name
        vacationStatus
      }
      isAdminForCreativeArts {
        id
        name
      }

      # Arrivals admin relationships
      isArrivalsAdminForGovernorship {
        id
        name
      }
      isArrivalsAdminForCouncil {
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

      # Arrivals counter and payer relationships
      isArrivalsCounterForStream {
        id
        name
      }
      isArrivalsPayerForCouncil {
        id
        name
      }

      # Teller relationship
      isTellerForStream {
        id
        name
        vacationStatus
        bankAccount
        isManualBanking
      }
    }
  }
`
