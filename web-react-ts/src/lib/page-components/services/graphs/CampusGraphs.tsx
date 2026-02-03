import React, { useContext, useState, useCallback, useEffect } from 'react'

import { ChurchContext } from '@/contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  GraphTypes,
} from './graphs-utils'
import ChurchGraph from '@/components/ChurchGraph/ChurchGraph'
import { CAMPUS_GRAPHS } from './GraphsQueries'
import MembershipCard from './CompMembershipCard'
import StatDisplay from './CompStatDisplay'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Col, Container, Row, Button, Spinner } from 'react-bootstrap'
import GraphDropdown from './GraphDropdown'
import { MemberContext } from 'contexts/MemberContext'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import { isIncomeGraph } from 'global-utils'
import { ChevronLeft, ChevronRight } from 'react-bootstrap-icons'

const CampusReport = () => {
  const { campusId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const [graphs, setGraphs] = useState<GraphTypes>('bussingAggregate')
  const [skip, setSkip] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const limit = 4
  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const { data, loading, error, refetch } = useQuery(CAMPUS_GRAPHS, {
    variables: { campusId, limit, skip },
    onCompleted: (data) => {
      if (!setChurchData) return
      setChurchData(getServiceGraphData(data?.campuses[0], graphs))
      setIsNavigating(false)
    },
  })

  // Reset skip when graph type changes
  useEffect(() => {
    setSkip(0)
    if (data?.campuses[0]) {
      setChurchData(getServiceGraphData(data?.campuses[0], graphs))
      refetch({ campusId, limit, skip: 0 })
    }
  }, [graphs, campusId, refetch])

  const handlePrevious = useCallback(() => {
    const newSkip = Math.max(0, skip - limit)
    setSkip(newSkip)
    setIsNavigating(true)
    refetch({ campusId, limit, skip: newSkip })
  }, [skip, limit, campusId, refetch])

  const handleNext = useCallback(() => {
    const newSkip = skip + limit
    setSkip(newSkip)
    setIsNavigating(true)
    refetch({ campusId, limit, skip: newSkip })
  }, [skip, limit, campusId, refetch])

  const canGoBack = skip > 0
  const canGoForward = churchData && churchData.length === limit

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container>
        <LeaderAvatar
          leader={data?.campuses[0].leader}
          leaderTitle="Campus Leader"
        />

        <Row className="mt-3 row-cols-2">
          <Col>
            <MembershipCard
              link="/campus/members"
              title="Membership"
              count={data?.campuses[0]?.memberCount}
            />
          </Col>

          <Col>
            <GraphDropdown
              graphs={graphs}
              setGraphs={setGraphs}
              setChurchData={setChurchData}
              data={data?.campuses[0]}
            />
          </Col>
        </Row>
        <Row className="mt-3">
          <Col>
            <StatDisplay
              title="Avg Weekly Attendance"
              statistic={getMonthlyStatAverage(churchData, 'attendance')}
            />
          </Col>

          {isIncomeGraph(graphs, currentUser) && (
            <Col>
              <StatDisplay
                title="Avg Weekly Income"
                statistic={getMonthlyStatAverage(churchData, 'income')}
              />
            </Col>
          )}
        </Row>

        {!currentUser.noIncomeTracking ? (
          <ChurchGraph
            loading={loading}
            stat1="attendance"
            stat2={!isIncomeGraph(graphs, currentUser) ? null : 'income'}
            churchData={churchData || []}
            church="campus"
            graphType={graphs}
            income
          />
        ) : (
          <ChurchGraph
            loading={loading}
            stat1="attendance"
            stat2={null}
            churchData={churchData || []}
            church="campus"
            graphType={graphs}
            income={false}
          />
        )}

        {/* Navigation Controls */}
        <Row className="mt-3 justify-content-center">
          <Col xs="auto">
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleNext}
                disabled={!canGoForward || loading || isNavigating}
                className="d-flex align-items-center"
              >
                {isNavigating ? (
                  <Spinner size="sm" className="me-1" />
                ) : (
                  <ChevronLeft size={16} className="me-1" />
                )}
                Previous
              </Button>

              <span className="text-muted small">
                {churchData && churchData.length > 0
                  ? `Weeks ${Math.min(
                      ...churchData.map((d) => d.week || 0)
                    )} - ${Math.max(...churchData.map((d) => d.week || 0))}`
                  : `Weeks ${skip + 1} - ${skip + (churchData?.length || 0)}`}
              </span>

              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handlePrevious}
                disabled={!canGoBack || loading || isNavigating}
                className="d-flex align-items-center"
              >
                {isNavigating ? (
                  <Spinner size="sm" className="ms-1" />
                ) : (
                  <ChevronRight size={16} className="ms-1" />
                )}
                Next
              </Button>
            </div>
          </Col>
        </Row>
      </Container>
    </ApolloWrapper>
  )
}

export default CampusReport
