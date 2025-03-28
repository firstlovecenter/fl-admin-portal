import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { CAMPUS_BY_STREAM_EQUIPMENT_DEFAULTERS } from 'pages/campaigns/CampaignQueries'
import DefaulterDetailsCard, {
  EquipmentDefaulters,
} from 'pages/campaigns/components/cards/DefaulterDetailsCard'
import React, { useContext } from 'react'
import { Container, Row } from 'react-bootstrap'

const CampusByStreamEquipmentDefaulters = () => {
  const { currentUser } = useContext(MemberContext)

  const church = currentUser.currentChurch
  const { campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    CAMPUS_BY_STREAM_EQUIPMENT_DEFAULTERS,
    {
      variables: {
        campusId: campusId,
      },
    }
  )
  const campus = data?.campuses[0]
  const streams = campus?.streams

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${church?.name} Campus`}</HeadingPrimary>
            <HeadingSecondary>Equipment Campaign</HeadingSecondary>
          </div>
          <h6 className="mt-4">
            Fellowships and Governorships that haven't filled their form
          </h6>

          <Container>
            <Row>
              {streams?.map((stream: EquipmentDefaulters, index: number) => (
                <DefaulterDetailsCard
                  key={index}
                  church={stream}
                  route={'stream/council'}
                />
              ))}
            </Row>
          </Container>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default CampusByStreamEquipmentDefaulters
