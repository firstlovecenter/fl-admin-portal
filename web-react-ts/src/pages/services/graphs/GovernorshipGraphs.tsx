import React, { useContext, useState, useCallback, useEffect } from 'react'

import { ChurchContext } from '../../../contexts/ChurchContext'
import { useQuery } from '@apollo/client'
import {
  getServiceGraphData,
  getMonthlyStatAverage,
  GraphTypes,
} from './graphs-utils'
import ChurchGraph from '../../../components/ChurchGraph/ChurchGraph'
import { GOVERNORSHIP_GRAPHS } from './GraphsQueries'
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

export const GovernorshipGraphs = () => {
  const { governorshipId } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)

  const [graphs, setGraphs] = useState<GraphTypes>('bussingAggregate')
  const [skip, setSkip] = useState(0)
  const [isNavigating, setIsNavigating] = useState(false)
  const limit = 4
  const [churchData, setChurchData] = useState<any[] | undefined>([])
  const { data, loading, error, refetch } = useQuery(GOVERNORSHIP_GRAPHS, {
    variables: { id: governorshipId, limit, skip },
    onCompleted: (data) => {
      if (!setChurchData) return
      setChurchData(getServiceGraphData(data?.governorships[0], graphs))
      setIsNavigating(false)
    },
  })

  // Reset skip when graph type changes
  useEffect(() => {
    setSkip(0)
    if (data?.governorships[0]) {
      setChurchData(getServiceGraphData(data?.governorships[0], graphs))
      refetch({ id: governorshipId, limit, skip: 0 })
    }
  }, [graphs, governorshipId, refetch])

  const handlePrevious = useCallback(() => {
    const newSkip = Math.max(0, skip - limit)
    setSkip(newSkip)
    setIsNavigating(true)
    refetch({ id: governorshipId, limit, skip: newSkip })
  }, [skip, limit, governorshipId, refetch])

  const handleNext = useCallback(() => {
    const newSkip = skip + limit
    setSkip(newSkip)
    setIsNavigating(true)
    refetch({ id: governorshipId, limit, skip: newSkip })
  }, [skip, limit, governorshipId, refetch])

  const canGoBack = skip > 0
  const canGoForward = churchData && churchData.length === limit

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <div>
        <LeaderAvatar
          leader={data?.governorships[0].leader}
          leaderTitle="Governorship Leader"
        />

        <div className="row-cols-2">
          <div>
            <MembershipCard
              link="/governorship/members"
              title="Membership"
              count={data?.governorships[0].memberCount}
            />
          </div>

          <div>
            <GraphDropdown
              graphs={graphs}
              setGraphs={setGraphs}
              setChurchData={setChurchData}
              data={data?.governorships[0]}
            />
          </div>
        </div>
        <div className="mt-3">
          <div>
            <StatDisplay
              title={`Avg Weekly ${
                graphs === 'bussing' ? 'Bussing' : 'Attendance'
              }`}
              statistic={getMonthlyStatAverage(churchData, 'attendance')}
            />
          </div>

          <div>
            {isIncomeGraph(graphs, currentUser) && (
              <StatDisplay
                title="Avg Weekly Income"
                statistic={getMonthlyStatAverage(churchData, 'income')}
              />
            )}
          </div>
        </div>

        {!currentUser.noIncomeTracking ? (
          <ChurchGraph
            stat1="attendance"
            stat2={!isIncomeGraph(graphs, currentUser) ? null : 'income'}
            churchData={churchData || []}
            church="governorship"
            graphType={graphs}
            income={true}
          />
        ) : (
          <ChurchGraph
            stat1="attendance"
            stat2={null}
            churchData={churchData || []}
            church="governorship"
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

export default GovernorshipGraphs
