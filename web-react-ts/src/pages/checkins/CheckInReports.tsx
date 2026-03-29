import { useQuery, useLazyQuery } from '@apollo/client'
import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  ProgressBar,
  Row,
  Spinner,
} from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import PullToRefresh from 'react-simple-pull-to-refresh'
import {
  LIST_CHECKIN_EVENTS,
  GET_CHECKIN_DASHBOARD,
  GET_CHECKIN_EVENT_STATS_BATCH,
} from './checkinsQueries'

const STATUS_COLOURS: Record<string, string> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  ENDED: 'secondary',
}

const SCOPE_LABELS: Record<string, string> = {
  BACENTA: 'Bacenta',
  GOVERNORSHIP: 'Governorship',
  COUNCIL: 'Council',
  STREAM: 'Stream',
  CAMPUS: 'Campus',
  OVERSIGHT: 'Oversight',
}

const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

const getProgressVariant = (pct: number) => {
  if (pct >= 80) return 'success'
  if (pct >= 50) return 'warning'
  return 'danger'
}

const CheckInReports = () => {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [scopeFilter, setScopeFilter] = useState<string>('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const [exportingId, setExportingId] = useState<string | null>(null)

  const { data, loading, error, refetch } = useQuery(LIST_CHECKIN_EVENTS)
  const [getDashboard] = useLazyQuery(GET_CHECKIN_DASHBOARD)

  const allEvents = useMemo(() => data?.ListCheckInEvents ?? [], [data])

  const filteredEvents = useMemo(() => {
    return allEvents.filter((e: any) => {
      if (statusFilter !== 'ALL' && e.status !== statusFilter) return false
      if (scopeFilter !== 'ALL' && e.scopeLevel !== scopeFilter) return false
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase()
        if (
          !e.name?.toLowerCase().includes(term) &&
          !e.location?.toLowerCase().includes(term) &&
          !e.createdByName?.toLowerCase().includes(term)
        )
          return false
      }
      return true
    })
  }, [allEvents, statusFilter, scopeFilter, searchTerm])

  const eventIds = useMemo(
    () => filteredEvents.map((e: any) => e.id),
    [filteredEvents]
  )

  const { data: statsData } = useQuery(GET_CHECKIN_EVENT_STATS_BATCH, {
    variables: { eventIds },
    skip: eventIds.length === 0,
  })

  const statsMap = useMemo(() => {
    const map: Record<string, any> = {}
    for (const s of statsData?.GetCheckInEventStatsBatch ?? []) {
      map[s.eventId] = s
    }
    return map
  }, [statsData])

  // Summary totals across ALL events (unfiltered)
  const summary = useMemo(() => {
    const total = allEvents.length
    const active = allEvents.filter((e: any) => e.status === 'ACTIVE').length
    const ended = allEvents.filter((e: any) => e.status === 'ENDED').length
    const totalExpected = allEvents.reduce(
      (sum: number, e: any) => sum + (e.totalExpected ?? 0),
      0
    )
    return { total, active, ended, totalExpected }
  }, [allEvents])

  const exportToCSV = async (event: any) => {
    setExportingId(event.id)
    try {
      const { data: dashboardData } = await getDashboard({
        variables: { eventId: event.id },
      })
      if (!dashboardData?.GetCheckInDashboard) {
        alert('Failed to load event data')
        return
      }
      const { checkedIn, defaulted, checkedOut } =
        dashboardData.GetCheckInDashboard

      const headers = [
        'Name',
        'Role',
        'Unit',
        'Status',
        'Checked In At',
        'Checked Out At',
        'Auto Checked Out',
        'Method',
        'Is Late',
        'Geo Verified',
        'Face Match',
      ]
      const rows = [
        ...checkedIn.map((a: any) => [
          a.fullName,
          a.roleLabel,
          a.unitName,
          'Checked In',
          a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : '',
          '',
          '',
          a.checkInMethod ?? '',
          a.isLate ? 'Yes' : 'No',
          a.geoVerified != null ? (a.geoVerified ? 'Yes' : 'No') : '',
          a.faceMatchStatus ?? '',
        ]),
        ...checkedOut.map((a: any) => [
          a.fullName,
          a.roleLabel,
          a.unitName,
          'Checked Out',
          a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : '',
          a.checkedOutAt ? new Date(a.checkedOutAt).toLocaleString() : '',
          a.autoCheckedOut ? 'Yes' : 'No',
          a.checkInMethod ?? '',
          a.isLate ? 'Yes' : 'No',
          a.geoVerified != null ? (a.geoVerified ? 'Yes' : 'No') : '',
          a.faceMatchStatus ?? '',
        ]),
        ...defaulted.map((a: any) => [
          a.fullName,
          a.roleLabel,
          a.unitName,
          'Defaulted',
          '',
          '',
          '',
          '',
          '',
          '',
          '',
        ]),
      ]

      const csv = [headers, ...rows]
        .map((row) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `checkin-${event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } finally {
      setExportingId(null)
    }
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data}>
        <Container className="py-4">
          <HeadingPrimary className="mb-3">
            Check-In Reports
          </HeadingPrimary>

          {/* Summary cards */}
          <Row className="g-2 mb-4">
            {[
              { label: 'Total Events', value: summary.total, colour: 'primary' },
              { label: 'Active', value: summary.active, colour: 'success' },
              { label: 'Ended', value: summary.ended, colour: 'secondary' },
              { label: 'Total Expected', value: summary.totalExpected, colour: 'info' },
            ].map(({ label, value, colour }) => (
              <Col xs={6} md={3} key={label}>
                <Card className={`text-center border-0 bg-${colour} bg-opacity-10`}>
                  <Card.Body className="py-3">
                    <div className={`display-6 fw-bold text-${colour}`}>{value}</div>
                    <div className="small text-muted">{label}</div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {/* Filters */}
          <Row className="g-2 mb-3">
            <Col xs={12} md={4}>
              <Form.Control
                placeholder="Search by name, location or creator…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Col>
            <Col xs={6} md={4}>
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PAUSED">Paused</option>
                <option value="ENDED">Ended</option>
              </Form.Select>
            </Col>
            <Col xs={6} md={4}>
              <Form.Select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
              >
                <option value="ALL">All Scopes</option>
                {Object.entries(SCOPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </Form.Select>
            </Col>
          </Row>

          {/* Count */}
          <p className="text-muted small mb-3">
            Showing {filteredEvents.length} of {allEvents.length} events
          </p>

          {/* Event cards */}
          <div className="d-grid gap-3">
            {filteredEvents.length === 0 && (
              <p className="text-center text-muted mt-3">No events match your filters.</p>
            )}
            {filteredEvents.map((event: any) => {
              const stats = statsMap[event.id]
              const pct = stats?.percentage ?? 0
              const checkedIn = stats?.checkedInCount ?? 0
              const checkedOut = stats?.checkedOutCount ?? 0
              const defaulted = stats?.defaultedCount ?? 0
              const expected = stats?.totalExpected ?? event.totalExpected ?? 0

              return (
                <Card key={event.id}>
                  <Card.Body>
                    {/* Header row */}
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <div className="fw-bold">{event.name}</div>
                        <div className="text-muted small">
                          {event.location ? `${event.location} · ` : ''}
                          {formatDate(event.startsAt)}
                        </div>
                        {event.createdByName && (
                          <div className="text-muted small">
                            Created by {event.createdByName}
                          </div>
                        )}
                      </div>
                      <div className="d-flex flex-column align-items-end gap-1">
                        <Badge bg={STATUS_COLOURS[event.status] ?? 'secondary'}>
                          {event.status}
                        </Badge>
                        <Badge bg="dark" className="fw-normal">
                          {SCOPE_LABELS[event.scopeLevel] ?? event.scopeLevel}
                        </Badge>
                        <Badge bg="light" text="dark" className="fw-normal">
                          {event.attendanceType === 'LEADERS_ONLY'
                            ? 'Leaders Only'
                            : 'All Members'}
                        </Badge>
                      </div>
                    </div>

                    {/* Attendance progress */}
                    {stats ? (
                      <>
                        <div className="d-flex justify-content-between small mb-1">
                          <span>
                            <span className="text-success fw-bold">{checkedIn}</span>
                            {checkedOut > 0 && (
                              <span className="text-muted"> (+{checkedOut} out)</span>
                            )}{' '}
                            / {expected} expected
                          </span>
                          <span className={`fw-bold text-${getProgressVariant(pct)}`}>
                            {pct}%
                          </span>
                        </div>
                        <ProgressBar
                          variant={getProgressVariant(pct)}
                          now={pct}
                          className="mb-2"
                          style={{ height: 8 }}
                        />
                        <Row className="g-2 text-center mb-3">
                          <Col>
                            <div className="text-success fw-bold">{checkedIn}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              Checked In
                            </div>
                          </Col>
                          <Col>
                            <div className="text-secondary fw-bold">{checkedOut}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              Checked Out
                            </div>
                          </Col>
                          <Col>
                            <div className="text-danger fw-bold">{defaulted}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              Defaulted
                            </div>
                          </Col>
                          <Col>
                            <div className="fw-bold">{expected}</div>
                            <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                              Expected
                            </div>
                          </Col>
                        </Row>
                      </>
                    ) : (
                      <div className="text-center py-2">
                        <Spinner size="sm" animation="border" className="text-muted" />
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="d-flex gap-2">
                      <Button
                        size="sm"
                        variant="outline-primary"
                        className="flex-grow-1"
                        onClick={() =>
                          navigate(`/checkins/event/${event.id}`)
                        }
                      >
                        View Dashboard
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => exportToCSV(event)}
                        disabled={exportingId === event.id}
                      >
                        {exportingId === event.id ? (
                          <Spinner size="sm" animation="border" />
                        ) : (
                          'CSV'
                        )}
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              )
            })}
          </div>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CheckInReports

