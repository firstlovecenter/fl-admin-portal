import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { STREAM_BY_COUNCIL_EQUIPMENT_DEFAULTERS } from 'pages/campaigns/CampaignQueries'
import DefaulterDetailsCard, {
  EquipmentDefaulters,
} from 'pages/campaigns/components/cards/DefaulterDetailsCard'
import React, { useContext } from 'react'
import { Container, Row } from 'react-bootstrap'

const StreamByCouncilEquipmentDefaulters = () => {
  const { streamId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    STREAM_BY_COUNCIL_EQUIPMENT_DEFAULTERS,
    {
      variables: {
        streamId: streamId,
      },
    }
  )
  const stream = data?.streams[0]
  const councils = stream?.councils

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${stream?.name} Stream`}</HeadingPrimary>
            <HeadingSecondary>Equipment Campaign</HeadingSecondary>
          </div>
          <h6 className="mt-4">
            Fellowships and Governorships that haven't filled their form
          </h6>

          <Container>
            <Row>
              {councils?.map((council: EquipmentDefaulters, index: number) => (
                <DefaulterDetailsCard
                  key={index}
                  church={council}
                  route={'council/governorship'}
                />
              ))}
            </Row>
          </Container>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default StreamByCouncilEquipmentDefaulters
