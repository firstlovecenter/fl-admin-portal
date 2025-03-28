import { useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import React, { useContext } from 'react'
import { Button, Card, Col, Container, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { COUNCIL_WITH_CREDITS } from './membership-list/DownloadMembership.gql'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import CheckDownloadCredits from './CheckDownloadCredits'

const CouncilDownloadReports = () => {
  const navigate = useNavigate()

  const { councilId } = useContext(ChurchContext)
  const { data, loading, error } = useQuery(COUNCIL_WITH_CREDITS, {
    variables: { id: councilId },
  })

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <HeadingPrimary>Download Reports</HeadingPrimary>
        <CheckDownloadCredits church={data?.councils[0]}>
          <Card border="success">
            <Card.Header>Download Credits</Card.Header>
            <Card.Body>{data?.councils[0].downloadCredits}</Card.Body>
          </Card>

          <div className="mt-5">Choose a report to download</div>

          <Button
            onClick={() => navigate('/dowload-reports/council/membership')}
          >
            Download Council Membership
          </Button>
        </CheckDownloadCredits>
        <Row className="mt-5">
          <Col>
            <Button
              variant="success"
              onClick={() =>
                navigate('/download-reports/council/purchase-credits')
              }
            >
              Purchase Credits
            </Button>
          </Col>
          <Col>
            <Button
              onClick={() =>
                navigate('/download-reports/council/purchase-history')
              }
            >
              View Purchase History
            </Button>
          </Col>
        </Row>
      </Container>
    </ApolloWrapper>
  )
}

export default CouncilDownloadReports
