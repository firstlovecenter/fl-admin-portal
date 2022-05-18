import React, { useContext, useState } from 'react'

import { ChurchContext } from '../../../contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import { getServiceGraphData, getMonthlyStatAverage } from './trends-utils'
import ChurchGraph from '../../../components/ChurchGraph/ChurchGraph'
import { BACENTA_TRENDS } from './TrendsQueries'
import MembershipCard from './CompMembershipCard'
import StatDisplay from './CompStatDisplay'
import BaseComponent from 'components/base-component/BaseComponent'
import { Button, Col, Container, Row } from 'react-bootstrap'

export const BacentaTrends = () => {
  const { bacentaId } = useContext(ChurchContext)
  const [bussing, setBussing] = useState(true)
  const [churchData, setChurchData] = useState(
    getServiceGraphData(data?.bacentas[0], 'bussing')
  )

  const { data, loading, error } = useQuery(BACENTA_TRENDS, {
    variables: { bacentaId: bacentaId },
    onCompleted: (data) => {
      setChurchData(getServiceGraphData(data?.bacentas[0], 'bussing'))
    },
  })

  return (
    <BaseComponent loading={loading} error={error} data={data}>
      <Container>
        <div className=" my-3">
          <h5 className="mb-0">{`${data?.bacentas[0].name} Bacenta`}</h5>{' '}
          <p>
            <span className="text-secondary font-weight-bold">Leader: </span>
            {`${data?.bacentas[0].leader.fullName}`}
          </p>
        </div>

        <Row>
          <Col>
            <MembershipCard
              link="/bacenta/members"
              title="Membership"
              count={data?.bacentas[0].memberCount}
            />
          </Col>
          <Col>
            <div className="d-grid gap-2">
              <Button
                variant="success"
                onClick={() => {
                  setBussing(true)
                  setChurchData(
                    getServiceGraphData(data?.bacentas[0], 'bussing')
                  )
                }}
              >
                Bussing
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setBussing(false)
                  setChurchData(getServiceGraphData(data?.bacentas[0]))
                }}
              >
                Fellowship Services
              </Button>
            </div>
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <StatDisplay
              title={`Avg Weekly ${bussing ? 'Bussing' : 'Attendance'}`}
              statistic={getMonthlyStatAverage(churchData, 'attendance')}
            />
          </Col>
          {(!bussing || loading) && (
            <Col>
              <StatDisplay
                title="Avg Weekly Income"
                statistic={getMonthlyStatAverage(churchData, 'income')}
              />
            </Col>
          )}
        </Row>
        <ChurchGraph
          stat1="attendance"
          stat2={!bussing ? 'income' : null}
          churchData={churchData}
          church="bacenta"
          bussing={true}
        />
      </Container>
    </BaseComponent>
  )
}

export default BacentaTrends
