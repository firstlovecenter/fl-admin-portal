import React, { useContext, useState } from 'react'
import { Container } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import { ChurchContext } from 'contexts/ChurchContext'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import MultiplicationCampaignServiceTrends from '../MultiplicationCampaignServiceTrends'
import { useQuery } from '@apollo/client'
import { getServiceGraphData } from 'pages/services/graphs/graphs-utils'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { CONSTITUENCY_MULTIPLICATION_GRAPHS } from '../MultiplicationQueries'

const ConstituencyMultiplicationCampaignTrends = () => {
  const { currentUser } = useContext(MemberContext)

  const churchType = currentUser.currentChurch?.__typename
  const { constituencyId } = useContext(ChurchContext)

  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const { data, loading, error } = useQuery(
    CONSTITUENCY_MULTIPLICATION_GRAPHS,
    {
      variables: { constituencyId },
      onCompleted: (data) => {
        if (!setChurchData) return
        setChurchData(
          getServiceGraphData(
            data?.constituencies[0],
            'multiplicationAggregate'
          )
        )
      },
      fetchPolicy: 'cache-and-network',
    }
  )

  const church = data?.constituencies[0]

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container>
        <div className="text-center">
          <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
          <HeadingSecondary>Multiplication Campaign</HeadingSecondary>
        </div>

        <MultiplicationCampaignServiceTrends
          church={church}
          churchData={churchData}
          churchType={churchType}
        />
      </Container>
    </ApolloWrapper>
  )
}

export default ConstituencyMultiplicationCampaignTrends
