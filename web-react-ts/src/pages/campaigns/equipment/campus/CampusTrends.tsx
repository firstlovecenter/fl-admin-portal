import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import TrendsButton from '../../components/buttons/TrendsButton'
import { MemberContext } from 'contexts/MemberContext'
import { useQuery } from '@apollo/client'
import { CAMPUS_TRENDS } from '../../CampaignQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'

const CampusTrends = () => {
  const { currentUser } = useContext(MemberContext)
  const { campusId } = useContext(ChurchContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch

  const { data, loading, error } = useQuery(CAMPUS_TRENDS, {
    variables: { campusId: campusId },
  })
  const campuses = data?.campuses[0]
  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${church?.name} Campus`}</HeadingPrimary>
            <HeadingSecondary>Equipment Campaign</HeadingSecondary>
          </div>
          <div className="d-grid gap-2 mt-4 text-center px-2">
            <TrendsButton
              church={campuses}
              onClick={() => navigate(`/campaigns/equipment/campus/stream`)}
            />
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default CampusTrends
