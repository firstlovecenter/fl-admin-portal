import React, { useContext } from 'react'
import { Row, Col, Accordion, Stack, Button, Container } from 'react-bootstrap'
import { useQuery } from '@apollo/client'
import { MemberContext } from 'contexts/MemberContext'
import { getMemberDob } from 'jd-date-utils'
import Timeline from 'components/Timeline/Timeline'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import {
  DISPLAY_MEMBER_BIO,
  DISPLAY_MEMBER_CHURCH,
} from 'pages/directory/display/ReadQueries'
import PlaceholderCustom from 'components/Placeholder'
import './UserProfile.css'
import AuthButton from 'components/buttons/AuthButton'
import CloudinaryImage from 'components/CloudinaryImage'
import { USER_PLACEHOLDER } from 'global-utils'
import { useNavigate } from 'react-router'

const DisplayPage = () => {
  const { currentUser, theme } = useContext(MemberContext)
  const navigate = useNavigate()

  const {
    data: bioData,
    loading,
    error,
  } = useQuery(DISPLAY_MEMBER_BIO, {
    variables: { id: currentUser?.id },
  })
  const { data: churchData } = useQuery(DISPLAY_MEMBER_CHURCH, {
    variables: { id: currentUser?.id },
  })

  const member = bioData?.members[0]
  const memberChurch = churchData?.members[0]
  const memberBirthday = getMemberDob(member)

  return (
    <div className="scroll-bottom">
      <ApolloWrapper loading={loading} error={error} data={bioData} placeholder>
        <div className="py-5">
          <div className="pt-5 text-center">
            <Row className="d-flex justify-content-center">
              <Col
                className="d-flex justify-content-center"
                xs={6}
                md={6}
                lg={2}
              >
                <PlaceholderCustom
                  loading={!member?.pictureUrl}
                  className="img bg-secondary m-2 rounded-circle"
                >
                  <CloudinaryImage
                    src={member?.pictureUrl || USER_PLACEHOLDER}
                    className="img bg-secondary m-2 rounded-circle"
                    size="large"
                  />
                </PlaceholderCustom>
              </Col>
            </Row>
          </div>

          <>
            <PlaceholderCustom
              loading={!member?.nameWithTitle}
              as="h1"
              className="text-center"
            >
              <h1 className="text-center">{`${member?.nameWithTitle}`}</h1>
            </PlaceholderCustom>
            <Container className="px-5 mb-2 text-center">
              <Button
                variant="brand"
                className="px-5"
                onClick={() => navigate('/user-profile/edit')}
              >
                Edit Your Profile
              </Button>
            </Container>

            <PlaceholderCustom as="h6" className="text-center">
              <h6 className="text-center text-secondary">
                {memberChurch?.bacenta?.name}
              </h6>
            </PlaceholderCustom>
          </>
          <div className="py-5">
            <Row className="d-flex justify-content-center">
              <Col lg={8}>
                <Accordion className={theme}>
                  <Stack gap={4}>
                    <div className="px-4">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Bio</Accordion.Header>
                        <Accordion.Body>
                          <div>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                First Name
                              </Col>
                              <Col className="placeholder-display">
                                {member?.firstName}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Middle Name
                              </Col>
                              <Col className="placeholder-display">
                                {member?.middleName}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Last Name
                              </Col>
                              <Col className="placeholder-display">
                                {member?.lastName}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Email Address
                              </Col>
                              <Col className="placeholder-display">
                                {member?.email}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Date Of Birth
                              </Col>
                              <Col className="placeholder-display">
                                {memberBirthday && memberBirthday}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Gender
                              </Col>
                              <Col className="placeholder-display">
                                {member?.gender ? member?.gender.gender : null}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Marital Status
                              </Col>
                              <Col className="placeholder-display">
                                {member?.maritalStatus
                                  ? member?.maritalStatus.status
                                  : null}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Occupation
                              </Col>
                              <Col className="placeholder-display">
                                {member?.occupation
                                  ? member?.occupation.occupation
                                  : '-'}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Phone Number
                              </Col>
                              <Col className="placeholder-display">
                                {member?.phoneNumber}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                WhatsApp No.
                              </Col>
                              <Col className="placeholder-display">
                                <a
                                  className="font-weight-bold"
                                  href={`https://wa.me/${member?.whatsappNumber}`}
                                >
                                  {member?.whatsappNumber}
                                </a>
                              </Col>
                            </Row>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    </div>
                    <div className="px-4">
                      <Accordion.Item eventKey="1">
                        <Accordion.Header>History</Accordion.Header>
                        <Accordion.Body>
                          <div>
                            {memberChurch?.history?.length ? (
                              <Timeline
                                record={memberChurch?.history}
                                limit={3}
                              />
                            ) : null}
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    </div>
                    <div className="px-4">
                      <Accordion.Item eventKey="2">
                        <Accordion.Header>Church Groups</Accordion.Header>
                        <Accordion.Body>
                          <div className="col-mt-2">
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Overseeing Pastor
                              </Col>
                              <Col className="placeholder-display">
                                {memberChurch?.bacenta.council.leader.fullName}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Bacenta
                              </Col>
                              <Col className="placeholder-display">
                                {memberChurch?.bacenta?.name}
                              </Col>
                            </Row>
                            <Row>
                              <Col className="text-secondary placeholder-display">
                                Ministry
                              </Col>
                              <Col className="placeholder-display">
                                {memberChurch?.ministry
                                  ? `${memberChurch?.ministry.name}`
                                  : null}
                              </Col>
                            </Row>
                          </div>
                        </Accordion.Body>
                      </Accordion.Item>
                    </div>
                  </Stack>
                </Accordion>
                <div className="mt-3 text-center">
                  <AuthButton mobileFullSize />
                </div>
              </Col>
            </Row>
          </div>
        </div>
      </ApolloWrapper>
    </div>
  )
}

export default DisplayPage
