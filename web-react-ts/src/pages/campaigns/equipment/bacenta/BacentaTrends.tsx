import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import { useQuery } from '@apollo/client'
import { BACENTA_TRENDS } from '../../CampaignQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import FellowshipTrendsButton from 'pages/campaigns/components/buttons/FellowshipTrendsButton'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'

const BacentaTrends = () => {
  const { currentUser } = useContext(MemberContext)
  const { bacentaId } = useContext(ChurchContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename

  const { data, loading, error } = useQuery(BACENTA_TRENDS, {
    variables: { bacentaId: bacentaId },
  })
  const bacenta = data?.bacentas[0]
  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
            <HeadingSecondary>Equipment Campaign</HeadingSecondary>
          </div>
          <div className="d-grid gap-2 mt-4 text-center px-2">
            <FellowshipTrendsButton
              church={bacenta}
              onClick={() =>
                navigate(`/campaigns/equipment/bacenta/fellowship`)
              }
            />
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default BacentaTrends
