import DefaultersMenuButton from 'pages/campaigns/components/buttons/DefaultersMenuButton'
import React, { useContext } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { MemberContext } from 'contexts/MemberContext'
import { useNavigate } from 'react-router'
import { ChurchContext } from 'contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import { CAMPUS_EQUIPMENT_DEFAULTERS_NUMBER_BY_GOVERNORSHIP_AND_FELLOWSHIP } from 'pages/campaigns/CampaignQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import useSetUserChurch from 'hooks/useSetUserChurch'

const CampusEquipmentDefaulters = () => {
  const { currentUser } = useContext(MemberContext)
  const { setUserFinancials } = useSetUserChurch()
  const navigate = useNavigate()

  const church = currentUser.currentChurch

  const { campusId, clickCard } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(
    CAMPUS_EQUIPMENT_DEFAULTERS_NUMBER_BY_GOVERNORSHIP_AND_FELLOWSHIP,
    {
      variables: {
        campusId: campusId,
      },
    }
  )
  const campus = data?.campuses[0]

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
          <DefaultersMenuButton
            name="Streams"
            onClick={() => {
              clickCard(campus)
              setUserFinancials(campus)
              navigate('/campaigns/campus/stream/equipment/defaulters')
            }}
            number={campus?.streamCount}
            color="text-danger"
          />
          <div className=" gap-2 mt-4">
            <h6>
              Fellowships :{' '}
              <span className="text-primary">{campus?.fellowshipCount}</span>
            </h6>

            <Row className="mt-3">
              <Col>
                <DefaultersMenuButton
                  name="Have not filled"
                  onClick={() =>
                    navigate(
                      '/campaigns/campus/equipment/have-not-filled/fellowship'
                    )
                  }
                  number={campus?.fellowshipEquipmentNotFilledCount}
                  color="text-danger"
                />
              </Col>
              <Col>
                <DefaultersMenuButton
                  name="Filled"
                  onClick={() => {}}
                  number={campus?.fellowshipEquipmentFilledCount}
                  color="text-success"
                />
              </Col>
            </Row>
          </div>
          <div className=" gap-2 mt-4">
            <h6>
              Governorships :{' '}
              <span className="text-primary">{campus?.governorshipCount}</span>
            </h6>
            <Row className="mt-3">
              <Col>
                <DefaultersMenuButton
                  name="Have not filled"
                  onClick={() =>
                    navigate(
                      '/campaigns/campus/equipment/have-not-filled/governorship'
                    )
                  }
                  number={campus?.governorshipEquipmentNotFilledCount}
                  color="text-danger"
                />
              </Col>
              <Col>
                <DefaultersMenuButton
                  name="Filled"
                  onClick={() => {}}
                  number={campus?.governorshipEquipmentFilledCount}
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

export default CampusEquipmentDefaulters
