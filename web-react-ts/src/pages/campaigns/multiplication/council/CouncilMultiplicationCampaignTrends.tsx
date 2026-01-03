import { useContext, useState } from 'react'
import { useQuery } from '@apollo/client'
import { getServiceGraphData } from '../../../services/graphs/graphs-utils'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container } from 'react-bootstrap'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import MultiplicationCampaignServiceTrends from '../MultiplicationCampaignServiceTrends'
import { COUNCIL_MULTIPLICATION_GRAPHS } from '../MultiplicationQueries'

const CouncilMultiplicationCampaignTrends = () => {
  const { currentUser } = useContext(MemberContext)
  const churchType = currentUser.currentChurch?.__typename
  const { councilId } = useContext(ChurchContext)

  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const { data, loading, error } = useQuery(COUNCIL_MULTIPLICATION_GRAPHS, {
    variables: { councilId },
    onCompleted: (data) => {
      if (!setChurchData) return
      setChurchData(
        getServiceGraphData(data?.councils[0], 'multiplicationAggregate')
      )
    },
    fetchPolicy: 'cache-and-network',
  })

  const church = data?.councils[0]

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

export default CouncilMultiplicationCampaignTrends
