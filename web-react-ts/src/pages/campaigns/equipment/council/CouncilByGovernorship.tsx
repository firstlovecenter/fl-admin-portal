import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { COUNCIL_BY_GOVERNORSHIP } from '../../CampaignQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import TrendsButton from 'pages/campaigns/components/buttons/TrendsButton'
import { EquipmentChurch } from 'global-types'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'

const CouncilByGovernorship = () => {
  const { councilId, clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(COUNCIL_BY_GOVERNORSHIP, {
    variables: { councilId: councilId },
  })
  const governorships = data?.councils[0]?.governorships

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${data?.councils[0].name} ${data?.councils[0].__typename}`}</HeadingPrimary>
            <HeadingSecondary>Equipment Campaign</HeadingSecondary>
          </div>
          <div className="d-grid gap-2 mt-4 text-center px-2">
            {governorships?.map(
              (governorship: EquipmentChurch, index: number) => (
                <TrendsButton
                  key={index}
                  church={governorship}
                  onClick={() => {
                    clickCard(governorship)
                    navigate(`/campaigns/equipment/governorship/bacenta`)
                  }}
                />
              )
            )}
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default CouncilByGovernorship
