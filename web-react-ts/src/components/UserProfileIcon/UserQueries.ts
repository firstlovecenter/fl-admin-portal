import { gql } from '@apollo/client'

export const GET_LOGGED_IN_USER = gql`
  query memberByEmail($email: String!) {
    memberByEmail(email: $email) {
      id
      firstName
      lastName
      currentTitle
      nameWithTitle
      pictureUrl
      stream_name
      fellowship {
        id
        bacenta {
          id
          constituency {
            id
            council {
              id
              stream {
                id
                gatheringService {
                  id
                  noIncome
                  oversight {
                    id
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`
