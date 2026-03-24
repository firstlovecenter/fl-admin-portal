import React, { useContext, useState, useCallback, useEffect } from 'react'

import { ChurchContext } from '../../../contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  GraphTypes,
} from './graphs-utils'
import ChurchGraph from '../../../components/ChurchGraph/ChurchGraph'
import { CAMPUS_GRAPHS } from './GraphsQueries'
import MembershipCard from './CompMembershipCard'
import StatDisplay from './CompStatDisplay'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import GraphDropdown from './GraphDropdown'
import { MemberContext } from 'contexts/MemberContext'
import LeaderAvatar from 'components/LeaderAvatar/LeaderAvatar'
import { isIncomeGraph } from 'global-utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from 'components/ui/button'
import { Loader2 } from 'lucide-react'

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
      <div>
        <LeaderAvatar
          leader={data?.campuses[0].leader}
          leaderTitle="Campus Leader"
        />

        <div className="mt-3 row-cols-2">
          <div>
            <MembershipCard
              link="/campus/members"
              title="Membership"
              count={data?.campuses[0]?.memberCount}
            />
          </div>

          <div>
            <GraphDropdown
              graphs={graphs}
              setGraphs={setGraphs}
              setChurchData={setChurchData}
              data={data?.campuses[0]}
            />
          </div>
        </div>
        <div className="mt-3">
          <div>
            <StatDisplay
              title={`Avg Weekly Attendance`}
              statistic={getMonthlyStatAverage(churchData, 'attendance')}
            />
          </div>

          {isIncomeGraph(graphs, currentUser) && (
            <div>
              <StatDisplay
                title="Avg Weekly Income"
                statistic={getMonthlyStatAverage(churchData, 'income')}
              />
            </div>
          )}
        </div>

        {!currentUser.noIncomeTracking ? (
          <ChurchGraph
            loading={loading}
            stat1="attendance"
            stat2={!isIncomeGraph(graphs, currentUser) ? null : 'income'}
            churchData={churchData || []}
            church="campus"
            graphType={graphs}
            income={true}
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
        <div className="mt-3 justify-content-center">
          <div xs="auto">
            <div className="d-flex align-items-center gap-3">
              <Button
                variant="outline-secondary"
                size="sm"
                onClick={handleNext}
                disabled={!canGoForward || loading || isNavigating}
                className="d-flex align-items-center"
              >
                {isNavigating ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
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
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <ChevronRight size={16} className="ms-1" />
                )}
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ApolloWrapper>
  )
}

export default CampusReport
