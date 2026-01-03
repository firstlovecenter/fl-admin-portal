import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { STREAM_BY_COUNCIL } from '../../CampaignQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import TrendsButton from 'pages/campaigns/components/buttons/TrendsButton'
import { EquipmentChurch } from 'global-types'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'

const StreamByCouncil = () => {
  const { streamId, clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(STREAM_BY_COUNCIL, {
    variables: { streamId: streamId },
  })
  const councils = data?.streams[0]?.councils

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${data?.streams[0].name} ${data?.streams[0].__typename}`}</HeadingPrimary>
            <HeadingSecondary>Equipment Campaign</HeadingSecondary>
          </div>
          <div className="d-grid gap-2 mt-4 text-center px-2">
            {councils?.map((council: EquipmentChurch, index: number) => (
              <TrendsButton
                key={index}
                church={council}
                onClick={() => {
                  clickCard(council)
                  navigate(`/campaigns/equipment/council/governorship`)
                }}
              />
            ))}
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default StreamByCouncil
