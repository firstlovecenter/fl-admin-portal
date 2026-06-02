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
        currency
        conversionRateToDollar
        noIncomeTracking
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

    # Per-edge authority + flat allowed id list, computed once per login
    # on the BE from the user's Neo4j servant edges and cached for the
    # JWT lifetime. Drives the useCan hook (action gating per church) and
    # useCanViewChurch (breadcrumb / spine visibility) everywhere on the
    # FE. See api/src/resolvers/utils/allowed-church-ids.ts.
    myAuthority {
      servantTrees {
        type
        level
        churchId
        churchName
        reach
      }
      allowedChurchIds
    }
  }
`
