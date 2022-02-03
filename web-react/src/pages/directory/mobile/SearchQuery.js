import { gql } from '@apollo/client'

export const FEDERAL_SEARCH = gql`
  query federalSearch($searchKey: String) {
    federalSontaSearch(searchKey: $searchKey) {
      id
      name
      stream_name
      constituency {
        council {
          id
        }
      }
    }
    federalStreamSearch(searchKey: $searchKey) {
      id
      name
      stream_name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    federalCouncilSearch(searchKey: $searchKey) {
      id
      name
      stream_name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }

    federalConstituencySearch(searchKey: $searchKey) {
      id
      name
      stream_name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    federalBacentaSearch(searchKey: $searchKey) {
      id
      name
      stream_name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    federalFellowshipSearch(searchKey: $searchKey) {
      id
      name
      stream_name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    federalMemberSearch(searchKey: $searchKey) {
      id
      firstName
      lastName
      pictureUrl
      stream_name
      fellowship {
        id
        name
      }
      ministry {
        id
        name
      }
    }
  }
`

export const STREAM_SEARCH = gql`
  query streamSearch($searchKey: String, $streamId: ID!) {
    streamSontaSearch(searchKey: $searchKey, streamId: $streamId) {
      id
      name
      stream_name
      constituency {
        council {
          id
        }
      }
    }
    streamCouncilSearch(searchKey: $searchKey, streamId: $streamId) {
      id
      name
      stream_name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    streamConstituencySearch(searchKey: $searchKey, streamId: $streamId) {
      id
      name
      stream_name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    streamBacentaSearch(searchKey: $searchKey, streamId: $streamId) {
      id
      name
      stream_name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    streamFellowshipSearch(searchKey: $searchKey, streamId: $streamId) {
      id
      name
      stream_name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    streamMemberSearch(searchKey: $searchKey, streamId: $streamId) {
      id
      firstName
      lastName
      pictureUrl
      stream_name
      fellowship {
        id
        name
      }
      ministry {
        id
        name
      }
    }
  }
`

export const COUNCIL_SEARCH = gql`
  query councilSearch($searchKey: String, $councilId: ID!) {
    councilSontaSearch(searchKey: $searchKey, councilId: $councilId) {
      id
      name
    }

    councilConstituencySearch(searchKey: $searchKey, councilId: $councilId) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    councilBacentaSearch(searchKey: $searchKey, councilId: $councilId) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    councilFellowshipSearch(searchKey: $searchKey, councilId: $councilId) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    councilMemberSearch(searchKey: $searchKey, councilId: $councilId) {
      id
      firstName
      lastName
      fullName
      pictureUrl
      stream_name
      fellowship {
        id
        name
      }
      ministry {
        id
        name
      }
    }
  }
`

export const CONSTITUENCY_SEARCH = gql`
  query constituencySearch($searchKey: String, $constituencyId: ID!) {
    constituencySontaSearch(
      searchKey: $searchKey
      constituencyId: $constituencyId
    ) {
      id
      name
    }
    constituencyBacentaSearch(
      searchKey: $searchKey
      constituencyId: $constituencyId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    constituencyFellowshipSearch(
      searchKey: $searchKey
      constituencyId: $constituencyId
    ) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    constituencyMemberSearch(
      searchKey: $searchKey
      constituencyId: $constituencyId
    ) {
      id
      firstName
      lastName
      fullName
      pictureUrl
      stream_name
      fellowship {
        id
        name
      }
      ministry {
        id
        name
      }
    }
  }
`

export const BACENTA_SEARCH = gql`
  query bacentaSearch($searchKey: String, $bacentaId: ID!) {
    bacentaFellowshipSearch(searchKey: $searchKey, bacentaId: $bacentaId) {
      id
      name
      leader {
        id
        firstName
        lastName
        fullName
      }
    }
    bacentaMemberSearch(searchKey: $searchKey, bacentaId: $bacentaId) {
      id
      firstName
      lastName
      fullName
      pictureUrl
      stream_name
      fellowship {
        id
        name
      }
      ministry {
        id
        name
      }
    }
  }
`

export const FELLOWSHIP_SEARCH = gql`
  query fellowshipSearch($searchKey: String, $fellowshipId: ID!) {
    fellowshipMemberSearch(searchKey: $searchKey, fellowshipId: $fellowshipId) {
      id
      firstName
      lastName
      fullName
      pictureUrl
      stream_name
      fellowship {
        id
        name
      }
      ministry {
        id
        name
      }
    }
  }
`
