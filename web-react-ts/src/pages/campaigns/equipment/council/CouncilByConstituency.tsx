import React, { useContext } from 'react'
import { Container } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { COUNCIL_BY_CONSTITUENCY } from '../../CampaignQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router'
import TrendsButton from 'pages/campaigns/components/buttons/TrendsButton'
import { EquipmentChurch } from 'global-types'

const CouncilByConstituency = () => {
  const { councilId, clickCard } = useContext(ChurchContext)
  const navigate = useNavigate()

  const { data, loading, error } = useQuery(COUNCIL_BY_CONSTITUENCY, {
    variables: { councilId: councilId },
  })
  const constituencies = data?.councils[0]?.constituencies

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <h1 className="mb-1 ">Equipment Campaign</h1>
            <h6 className="text-secondary">{`${data?.councils[0].name} ${data?.councils[0].__typename}`}</h6>
          </div>
          <div className="d-grid gap-2 mt-4 text-center px-2">
            {constituencies?.map(
              (constituency: EquipmentChurch, index: number) => (
                <TrendsButton
                  key={index}
                  church={constituency}
                  onClick={() => {
                    clickCard(constituency)
                    navigate(`/campaigns/equipment/constituency/bacenta`)
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

export default CouncilByConstituency
