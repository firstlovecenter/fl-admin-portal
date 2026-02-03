import { useContext, useState } from 'react'
import { useQuery } from '@apollo/client'
import MobileSearchNav from 'components/MobileSearchNav'
import { MEMBER_SEARCH } from './SearchQuery'
import { MemberContext, SearchContext } from 'contexts/MemberContext'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
import { Container } from 'react-bootstrap'
import { ScaleLoader } from 'react-spinners'
import { SearchResult } from './search-types'
import NoDataComponent from 'pages/arrivals/CompNoData'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { MemberWithoutBioData } from 'global-types'

const SearchPageMobile = () => {
  const { searchKey } = useContext(SearchContext)
  const { currentUser } = useContext(MemberContext)

  const [combinedData, setCombinedData] = useState<SearchResult[]>([])
  const LIMIT = 10
  const { data, loading, error } = useQuery(MEMBER_SEARCH, {
    skip: !searchKey,
    variables: {
      id: currentUser.id,
      key: searchKey?.trim(),
      limit: LIMIT,
    },
    onCompleted: (data) => {
      const member = data.members[0]

      setCombinedData([
        ...member.memberSearch,
        ...member.oversightSearch,
        ...member.campusSearch,
        ...member.streamSearch,
        ...member.councilSearch,
        ...member.governorshipSearch,
        ...member.bacentaSearch,
        ...member.fellowshipSearch,
        ...member.creativeArtsSearch,
        ...member.ministrySearch,
        ...member.hubCouncilSearch,
        ...member.hubSearch,
      ])
    },
  })

  return (
    <ApolloWrapper data={data} loading={loading} error={error} placeholder>
      <Container>
        <MobileSearchNav />
        {loading && (
          <div className="mt-5 pt-5 d-flex align-items-center justify-content-center">
            <ScaleLoader color="gray" className="mt-5" />
          </div>
        )}

        {combinedData.length === 0 && !loading && (
          <div className="text-center py-5">
            <NoDataComponent text="No Results Found" />
          </div>
        )}
        {!loading &&
          combinedData.map((searchResult, index) => {
            return (
              <MemberDisplayCard
                key={index}
                member={searchResult as MemberWithoutBioData}
              />
            )
          })}
      </Container>
    </ApolloWrapper>
  )
}

export default SearchPageMobile
