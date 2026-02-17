import { useQuery, useLazyQuery } from '@apollo/client'
import { useMemo, useState } from 'react'
import { Button, Card, Col, Container, Row, Table } from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { LIST_CHECKIN_EVENTS, GET_CHECKIN_DASHBOARD } from './checkinsQueries'

const CheckInReports = () => {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null)
  const [loadingExport, setLoadingExport] = useState<string | null>(null)

  const { data, loading, error } = useQuery(LIST_CHECKIN_EVENTS)
  const [getDashboard] = useLazyQuery(GET_CHECKIN_DASHBOARD)

  const events = useMemo(() => data?.ListCheckInEvents ?? [], [data])

  const getAttendanceLabel = (type: string) => {
    return type === 'LEADERS_ONLY' ? 'Leaders Only' : 'Leaders + Members'
  }

  const exportToCSV = async (event: any) => {
    setLoadingExport(event.id)
    try {
      const { data: dashboardData } = await getDashboard({
        variables: { eventId: event.id },
      })

      if (!dashboardData?.GetCheckInDashboard) {
        alert('Failed to load event data for export')
        return
      }

      const dashboard = dashboardData.GetCheckInDashboard
      const checkedIn = dashboard.checkedIn || []
      const defaulted = dashboard.defaulted || []

      const headers = [
        'Name',
        'Role',
        'Unit',
        'Status',
        'Checked In At',
        'Method',
        'Is Late',
      ]

      const rows = [
        ...checkedIn.map((a: any) => [
          a.fullName,
          a.roleLabel,
          a.unitName,
          'Checked In',
          a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : '',
          a.checkInMethod || '',
          a.isLate ? 'Yes' : 'No',
        ]),
        ...defaulted.map((a: any) => [
          a.fullName,
          a.roleLabel,
          a.unitName,
          'Defaulted',
          '',
          '',
          a.isLate ? 'Yes' : 'No',
        ]),
      ]

      const csv = [headers, ...rows]
        .map((row) => row.map((cell: string | number) => `"${cell}"`).join(','))
        .join('\n')

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `checkin-report-${event.name
        .replace(/[^a-z0-9]/gi, '-')
        .toLowerCase()}-${Date.now()}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } finally {
      setLoadingExport(null)
    }
  }

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container className="py-4">
        <HeadingPrimary className="mb-3">
          Check-In Reports & Analytics
        </HeadingPrimary>

        <Card className="p-4 mb-4 bg-light">
          <Row className="g-3">
            <Col md={4}>
              <div className="text-center">
                <div className="display-6">{events.length}</div>
                <small className="text-muted">Total Events</small>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="display-6">
                  {events.filter((e: any) => e.status === 'ACTIVE').length}
                </div>
                <small className="text-muted">Active Events</small>
              </div>
            </Col>
            <Col md={4}>
              <div className="text-center">
                <div className="display-6">
                  {events.filter((e: any) => e.status === 'ENDED').length}
                </div>
                <small className="text-muted">Completed Events</small>
              </div>
            </Col>
          </Row>
        </Card>

        <h5 className="mb-3">Events Breakdown</h5>
        <div className="table-responsive">
          <Table striped bordered hover className="mb-0">
            <thead>
              <tr>
                <th>Event Name</th>
                <th>Scope</th>
                <th>Type</th>
                <th>Status</th>
                <th>Started</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">
                    No events found.
                  </td>
                </tr>
              ) : (
                events.map((event: any) => (
                  <tr key={event.id}>
                    <td>
                      <strong>{event.name}</strong>
                    </td>
                    <td>{event.scopeLevel}</td>
                    <td>{getAttendanceLabel(event.attendanceType)}</td>
                    <td>
                      <span
                        className={`badge bg-${
                          event.status === 'ACTIVE'
                            ? 'success'
                            : event.status === 'PAUSED'
                            ? 'warning'
                            : 'danger'
                        }`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td>{new Date(event.startsAt).toLocaleDateString()}</td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() =>
                          setExpandedEventId(
                            expandedEventId === event.id ? null : event.id
                          )
                        }
                        className="me-2"
                      >
                        {expandedEventId === event.id ? '−' : '+'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => exportToCSV(event)}
                        disabled={loadingExport === event.id}
                      >
                        {loadingExport === event.id ? '⏳' : '📥 CSV'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        </div>

        {expandedEventId && (
          <Card className="mt-4 p-3 bg-light">
            <h6 className="mb-3">
              Detailed Summary:{' '}
              {events.find((e: any) => e.id === expandedEventId)?.name}
            </h6>
            <Row className="g-3">
              <Col md={3}>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="small text-muted mb-2">Status</div>
                  <div className="fw-bold">
                    {events.find((e: any) => e.id === expandedEventId)?.status}
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="small text-muted mb-2">Attendance Type</div>
                  <div className="fw-bold text-truncate">
                    {getAttendanceLabel(
                      events.find((e: any) => e.id === expandedEventId)
                        ?.attendanceType
                    )}
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="small text-muted mb-2">Scope</div>
                  <div className="fw-bold">
                    {
                      events.find((e: any) => e.id === expandedEventId)
                        ?.scopeLevel
                    }
                  </div>
                </div>
              </Col>
              <Col md={3}>
                <div className="text-center p-3 bg-white rounded border">
                  <div className="small text-muted mb-2">Grace Period</div>
                  <div className="fw-bold">
                    {events.find((e: any) => e.id === expandedEventId)
                      ?.gracePeriod ?? 0}{' '}
                    min
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default CheckInReports
