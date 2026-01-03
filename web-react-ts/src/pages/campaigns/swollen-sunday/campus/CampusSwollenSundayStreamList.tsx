import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import CampaignChurchList from 'pages/campaigns/CampaignChurchList'
import { useContext } from 'react'
import { STREAM_LIST } from '../SwollenSundayQueries'

const CampusSwollenSundayCampaign = () => {
  const { campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(STREAM_LIST, {
    variables: {
      campusId: campusId,
    },
  })

  const streams = data?.campuses[0]?.streams
  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <div className="text-center">
        <HeadingPrimary>Swollen Sunday Campaign</HeadingPrimary>
        <HeadingSecondary>
          {`${data?.campuses[0]?.name} ${data?.campuses[0]?.__typename}`}{' '}
          Streams
        </HeadingSecondary>
        <CampaignChurchList data={streams} page="swollen-sunday-dashboard" />
      </div>
    </ApolloWrapper>
  )
}

export default CampusSwollenSundayCampaign
