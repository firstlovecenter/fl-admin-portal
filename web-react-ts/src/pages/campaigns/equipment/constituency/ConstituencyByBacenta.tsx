import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { CONSTITUENCY_BY_BACENTA } from '../../CampaignQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import FellowshipTrendsButton from '../../components/buttons/FellowshipTrendsButton'
import { useNavigate } from 'react-router'
import { EquipmentChurch } from 'global-types'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'

const ConstituencyByBacenta = () => {
  const { constituencyId, clickCard } = useContext(ChurchContext)

  const navigate = useNavigate()

  const { data, loading, error } = useQuery(CONSTITUENCY_BY_BACENTA, {
    variables: { constituencyId: constituencyId },
  })
  const bacentas = data?.constituencies[0]?.bacentas

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${data?.constituencies[0].name} ${data?.constituencies[0].__typename}`}</HeadingPrimary>
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

export default ConstituencyByBacenta
