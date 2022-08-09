import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import { useQuery } from '@apollo/client'
import { FELLOWSHIP_TRENDS } from '../../CampaignQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import FellowshipTrendsButton from 'pages/campaigns/components/buttons/FellowshipTrendsButton'

const FellowshipTrends = () => {
  const { currentUser } = useContext(MemberContext)
  const { fellowshipId } = useContext(ChurchContext)

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  const { data, loading, error } = useQuery(FELLOWSHIP_TRENDS, {
    variables: { fellowshipId: fellowshipId },
  })

  const fellowship = data?.fellowships[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <h1 className="mb-1 ">Equipment Campaign</h1>
            <h6 className="text-secondary">{`${church?.name} ${churchType}`}</h6>
          </div>
          <div className="d-grid gap-2 mt-4 text-center px-2">
            <FellowshipTrendsButton church={fellowship} />
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default FellowshipTrends
