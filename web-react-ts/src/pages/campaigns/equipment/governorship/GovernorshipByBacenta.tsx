import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { GOVERNORSHIP_BY_BACENTA } from '../../CampaignQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import FellowshipTrendsButton from '../../components/buttons/FellowshipTrendsButton'
import { useNavigate } from 'react-router'
import { EquipmentChurch } from 'global-types'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'

const GovernorshipByBacenta = () => {
  const { governorshipId, clickCard } = useContext(ChurchContext)

  const navigate = useNavigate()

  const { data, loading, error } = useQuery(GOVERNORSHIP_BY_BACENTA, {
    variables: { governorshipId: governorshipId },
  })
  const bacentas = data?.governorships[0]?.bacentas

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${data?.governorships[0].name} ${data?.governorships[0].__typename}`}</HeadingPrimary>
            <HeadingSecondary>Equipment Campaign</HeadingSecondary>
          </div>
          <div className="d-grid gap-2 mt-4 text-center px-2">
            {bacentas?.map((bacenta: EquipmentChurch, index: number) => (
              <FellowshipTrendsButton
                key={index}
                church={bacenta}
                onClick={() => {
                  clickCard(bacenta)
                  navigate(`/campaigns/equipment/bacenta/fellowship`)
                }}
              />
            ))}
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default GovernorshipByBacenta
