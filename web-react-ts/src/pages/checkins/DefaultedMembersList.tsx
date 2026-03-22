import { useQuery } from '@apollo/client'
import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, Container, Form } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { GET_CHECKIN_DASHBOARD } from './checkinsQueries'
import { SHORT_POLL_INTERVAL } from 'global-utils'
import PullToRefresh from 'react-simple-pull-to-refresh'

const DefaultedMembersList = () => {
  const { eventId } = useParams()
  const [searchTerm, setSearchTerm] = useState('')

  const { data, loading, error, refetch } = useQuery(GET_CHECKIN_DASHBOARD, {
    pollInterval: SHORT_POLL_INTERVAL,
    variables: { eventId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  })

  const dashboard = data?.GetCheckInDashboard
  const event = dashboard?.event
  const defaulted = useMemo(() => dashboard?.defaulted ?? [], [dashboard])

  const filteredMembers = useMemo(() => {
    if (!searchTerm.trim()) return defaulted

    const term = searchTerm.toLowerCase()
    return defaulted.filter(
      (member: any) =>
        member.firstName?.toLowerCase().includes(term) ||
        member.lastName?.toLowerCase().includes(term) ||
        member.roleLabel?.toLowerCase().includes(term) ||
        member.unitName?.toLowerCase().includes(term)
    )
  }, [defaulted, searchTerm])

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container className="py-4">
          <HeadingPrimary loading={loading}>Defaulted Members</HeadingPrimary>
          <HeadingSecondary loading={!event?.name}>
            {event?.name}
          </HeadingSecondary>

          {/* Search Input */}
          <div className="mb-3">
            <Form.Control
              placeholder="Search by name, role, or unit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control-lg"
            />
          </div>

          {/* Member List */}
          <div className="d-grid gap-2">
            {filteredMembers.length ? (
              filteredMembers.map((member: any) => (
                <Card key={member.memberId} className="p-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div className="fw-bold">{member.fullName}</div>
                      <div className="text-muted small">{member.roleLabel}</div>
                      <div className="text-muted small">
                        {member.unitType}: {member.unitName}
                      </div>
                    </div>
                    <div className="d-flex flex-column align-items-end gap-1">
                      <span className="badge bg-warning">Pending</span>
                      {member.isLate && (
                        <span className="badge bg-danger">Late</span>
                      )}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="alert alert-success">
                {searchTerm
                  ? 'No members match your search.'
                  : 'All members have checked in!'}
              </div>
            )}
          </div>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default DefaultedMembersList
