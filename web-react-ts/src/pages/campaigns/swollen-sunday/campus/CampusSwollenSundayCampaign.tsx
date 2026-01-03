import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { useContext } from 'react'
import SwollenSundayLandingPage from '../SwollenSundayLandingPage'
import { CAMPUS } from '../SwollenSundayQueries'

const CampusSwollenSundayCampaign = () => {
  const { campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(CAMPUS, {
    variables: {
      campusId: campusId,
    },
  })

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <SwollenSundayLandingPage
        churchName={data?.campuses[0]?.name}
        churchLevel={data?.campuses[0]?.__typename}
      />
    </ApolloWrapper>
  )
}

export default CampusSwollenSundayCampaign
