import React, { useContext } from 'react'
import Link from 'next/link'
import { useQuery } from '@apollo/client'
import { GET_CAMPUS_STREAMS } from '@/queries/ListQueries'
import { ChurchContext } from '@/contexts/ChurchContext'
import RoleView from '@/auth/RoleView'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Container, Row, Col } from 'react-bootstrap'
import { permitAdmin } from 'permission-utils'
import AllChurchesSummary from 'components/AllChurchesSummary'
import ChurchSearch from 'components/ChurchSearch'

const DisplayAllStreams = () => {
  const { clickCard, campusId } = useContext(ChurchContext)

  const { data, loading, error } = useQuery(GET_CAMPUS_STREAMS, {
    variables: { id: campusId },
  })

  const streams = data?.campuses[0]?.streams
  const campus = data?.campuses[0]

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Container>
        <Row className="mb-2">
          <Col>
            <Link
              href="/campus/displaydetails"
              onClick={() => {
                clickCard(campus)
              }}
            >
              <h4 className="text-white">{`${campus?.name} Streams`}</h4>
            </Link>
            <Link
              href="/member/displaydetails"
              onClick={() => {
                clickCard(campus?.leader)
              }}
            >
              <h6 className="text-white text-small d-block ">
                <span className="text-muted">Overseer: </span>
                {campus?.leader ? ` ${campus.leader.fullName}` : null}
              </h6>
            </Link>
            {campus?.admin ? (
              <Link
                className="pb-4 text-white text-small"
                href="/member/displaydetails"
                onClick={() => {
                  clickCard(campus?.admin)
                }}
              >
                <span className="text-muted">Admin :</span>{' '}
                {`${campus?.admin?.fullName}`}
              </Link>
            ) : null}
          </Col>
          <RoleView roles={permitAdmin('Campus')} directoryLock>
            <Col className="col-auto">
              <Link href="/stream/addstream" className="btn btn-danger">
                Add Stream
              </Link>
            </Col>
          </RoleView>
        </Row>

        <AllChurchesSummary
          church={streams}
          memberCount={campus?.memberCount}
          numberOfChurchesBelow={streams?.length}
          churchType="Stream"
          route="campus"
        />
        <ChurchSearch data={streams} churchType="Stream" />
      </Container>
    </ApolloWrapper>
  )
}

export default DisplayAllStreams
