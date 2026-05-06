import { useContext, useState } from 'react'
import { useQuery } from '@apollo/client'
import MobileSearchNav from 'components/MobileSearchNav'
import { MEMBER_SEARCH } from './SearchQuery'
import { MemberContext, SearchContext } from 'contexts/MemberContext'
import MemberDisplayCard from 'components/card/MemberDisplayCard'
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
        ...member.creativeArtsSearch,
        ...member.ministrySearch,
        ...member.hubCouncilSearch,
        ...member.hubSearch,
      ])
    },
  })

  return (
    <ApolloWrapper data={data} loading={loading} error={error} placeholder>
      <div className="min-h-svh bg-background pb-[env(safe-area-inset-bottom)]">
        <div className="px-4 py-3 sticky top-0 z-10 bg-background/90 backdrop-blur border-b border-border">
          <MobileSearchNav />
        </div>

        <div className="px-4 py-3">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <ScaleLoader color="gray" />
            </div>
          )}

          {combinedData.length === 0 && !loading && (
            <div className="text-center py-16">
              <NoDataComponent text="No Results Found" />
            </div>
          )}

          {!loading && (
            <div className="space-y-2">
              {combinedData.map((searchResult, index) => (
                <MemberDisplayCard
                  key={index}
                  member={searchResult as MemberWithoutBioData}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </ApolloWrapper>
  )
}

export default SearchPageMobile
