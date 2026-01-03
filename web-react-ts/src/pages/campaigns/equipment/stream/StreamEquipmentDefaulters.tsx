import DefaultersMenuButton from 'pages/campaigns/components/buttons/DefaultersMenuButton'
import React, { useContext } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import { useNavigate } from 'react-router'
import { ChurchContext } from 'contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import { STREAM_EQUIPMENT_DEFAULTERS_NUMBER_BY_GOVERNORSHIP_AND_FELLOWSHIP } from 'pages/campaigns/CampaignQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'

const StreamEquipmentDefaulters = () => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const church = currentUser.currentChurch
  const churchType = currentUser.currentChurch?.__typename
  const { streamId, clickCard } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    STREAM_EQUIPMENT_DEFAULTERS_NUMBER_BY_GOVERNORSHIP_AND_FELLOWSHIP,
    {
      variables: {
        streamId: streamId,
      },
    }
  )
  const stream = data?.streams[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <div className="d-flex align-items-center justify-content-center ">
        <Container>
          <div className="text-center">
            <HeadingPrimary>{`${church?.name} ${churchType}`}</HeadingPrimary>
            <HeadingSecondary>Equipment Campaign</HeadingSecondary>
          </div>
          <h6 className="mt-4">
            Fellowships and Governorships that haven't filled their form
          </h6>
          <DefaultersMenuButton
            name="Councils"
            onClick={() => {
              clickCard(stream)
              navigate('/campaigns/stream/council/equipment/defaulters')
            }}
            number={stream?.councilCount}
            color="text-danger"
          />
          <div className=" gap-2 mt-4">
            <h6>
              Fellowships :{' '}
              <span className="text-primary">{stream?.fellowshipCount}</span>
            </h6>
            <Row className="mt-3">
              <Col>
                <DefaultersMenuButton
                  name="Have not filled"
                  onClick={() => {
                    navigate(
                      '/campaigns/stream/equipment/have-not-filled/fellowship'
                    )
                  }}
                  number={stream?.fellowshipEquipmentNotFilledCount}
                  color="text-danger"
                />
              </Col>
              <Col>
                <DefaultersMenuButton
                  name="Filled"
                  onClick={() => {}}
                  number={stream?.fellowshipEquipmentFilledCount}
                  color="text-success"
                />
              </Col>
            </Row>
          </div>
          <div className=" gap-2 mt-4">
            <h6>
              Governorships :{' '}
              <span className="text-primary">{stream?.governorshipCount}</span>
            </h6>
            <Row className="mt-3">
              <Col>
                <DefaultersMenuButton
                  name="Have not filled"
                  onClick={() => {
                    navigate(
                      '/campaigns/stream/equipment/have-not-filled/governorship'
                    )
                  }}
                  number={stream?.governorshipEquipmentNotFilledCount}
                  color="text-danger"
                />
              </Col>
              <Col>
                <DefaultersMenuButton
                  name="Filled"
                  onClick={() => {}}
                  number={stream?.governorshipEquipmentFilledCount}
                  color="text-success"
                />
              </Col>
            </Row>
          </div>
        </Container>
      </div>
    </ApolloWrapper>
  )
}

export default StreamEquipmentDefaulters
