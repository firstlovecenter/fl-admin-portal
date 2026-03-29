import { useQuery } from '@apollo/client'
import { useParams, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  Nav,
  ProgressBar,
  Row,
  Spinner,
  Table,
} from 'react-bootstrap'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { GET_CHECKIN_DASHBOARD } from './checkinsQueries'

const STATUS_COLOURS: Record<string, string> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  ENDED: 'secondary',
}

type Tab = 'checkedIn' | 'defaulted' | 'checkedOut'

const CheckInEventReport = () => {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('checkedIn')
  const [exporting, setExporting] = useState(false)

  const { data, loading, error } = useQuery(GET_CHECKIN_DASHBOARD, {
    variables: { eventId },
    skip: !eventId,
    fetchPolicy: 'cache-and-network',
  })

  const dashboard = data?.GetCheckInDashboard
  const event = dashboard?.event
  const stats = dashboard?.stats

  const pct = stats?.percentage ?? 0
  const progressVariant = pct >= 80 ? 'success' : pct >= 50 ? 'warning' : 'danger'

  const exportToCSV = () => {
    if (!dashboard || !event) return
    setExporting(true)

    const headers = ['Name', 'Role', 'Unit', 'Status', 'Checked In At', 'Checked Out At', 'Auto Out', 'Method', 'Late', 'Geo Verified', 'Face Match']
    const rows = [
      ...(dashboard.checkedIn ?? []).map((a: any) => [
        a.fullName, a.roleLabel, a.unitName, 'Checked In',
        a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : '',
        '', '', a.checkInMethod ?? '',
        a.isLate ? 'Yes' : 'No',
        a.geoVerified != null ? (a.geoVerified ? 'Yes' : 'No') : '',
        a.faceMatchStatus ?? '',
      ]),
      ...(dashboard.checkedOut ?? []).map((a: any) => [
        a.fullName, a.roleLabel, a.unitName, 'Checked Out',
        a.checkedInAt ? new Date(a.checkedInAt).toLocaleString() : '',
        a.checkedOutAt ? new Date(a.checkedOutAt).toLocaleString() : '',
        a.autoCheckedOut ? 'Yes' : 'No', '', '', '', '',
      ]),
      ...(dashboard.defaulted ?? []).map((a: any) => [
        a.fullName, a.roleLabel, a.unitName, 'Defaulted',
        '', '', '', '', a.isLate ? 'Yes' : 'No', '', '',
      ]),
    ]

    const csv = [headers, ...rows]
      .map((row) => row.map((c: string) => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `report-${event.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
    setExporting(false)
  }

  const tabData: Record<Tab, any[]> = {
    checkedIn: dashboard?.checkedIn ?? [],
    defaulted: dashboard?.defaulted ?? [],
    checkedOut: dashboard?.checkedOut ?? [],
  }

  return (
    <ApolloWrapper loading={loading} error={error} data={data}>
      <Container className="py-3">
        <Button
          variant="link"
          className="ps-0 mb-2"
          onClick={() => navigate(`/checkins/event/${eventId}`)}
        >
          ← Back to Dashboard
        </Button>

        <HeadingPrimary loading={loading}>
          {event?.name ?? 'Event Report'}
        </HeadingPrimary>

        {event && (
          <p className="text-center text-muted mb-3">
            <Badge bg={STATUS_COLOURS[event.status] ?? 'secondary'} className="me-2">
              {event.status}
            </Badge>
            {event.scopeLevel} ·{' '}
            {new Date(event.startsAt).toLocaleDateString(undefined, {
              weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
            })}
            {event.createdByName && ` · Admin: ${event.createdByName}`}
          </p>
        )}

        {stats && (
          <Card className="mb-4 p-3">
            <Row className="g-3 text-center mb-3">
              <Col>
                <div className="display-6">{stats.totalExpected ?? '—'}</div>
                <small className="text-muted">Expected</small>
              </Col>
              <Col>
                <div className="display-6 text-success">{stats.checkedInCount}</div>
                <small className="text-muted">Checked In</small>
              </Col>
              <Col>
                <div className="display-6 text-warning">{stats.checkedOutCount}</div>
                <small className="text-muted">Checked Out</small>
              </Col>
              <Col>
                <div className="display-6 text-danger">{stats.defaultedCount}</div>
                <small className="text-muted">Defaulted</small>
              </Col>
            </Row>
            <div className="mb-1 d-flex justify-content-between">
              <small>Attendance</small>
              <small className="fw-bold">{pct}%</small>
            </div>
            <ProgressBar now={pct} variant={progressVariant} label={`${pct}%`} />
          </Card>
        )}

        <div className="d-flex justify-content-end mb-3">
          <Button
            variant="outline-success"
            size="sm"
            onClick={exportToCSV}
            disabled={exporting || !dashboard}
          >
            {exporting ? <Spinner size="sm" className="me-1" /> : null}
            Export CSV
          </Button>
        </div>

        <Nav variant="tabs" className="mb-3" activeKey={activeTab} onSelect={(k) => setActiveTab((k as Tab) ?? 'checkedIn')}>
          <Nav.Item>
            <Nav.Link eventKey="checkedIn">
              Checked In <Badge bg="success">{stats?.checkedInCount ?? 0}</Badge>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="defaulted">
              Defaulted <Badge bg="danger">{stats?.defaultedCount ?? 0}</Badge>
            </Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="checkedOut">
              Checked Out <Badge bg="warning" text="dark">{stats?.checkedOutCount ?? 0}</Badge>
            </Nav.Link>
          </Nav.Item>
        </Nav>

        {tabData[activeTab].length === 0 ? (
          <p className="text-center text-muted py-4">No records.</p>
        ) : (
          <Table striped hover responsive size="sm">
            <thead>
              <tr>
                <th>Name</th>
                <th>Unit</th>
                {activeTab === 'checkedIn' && (
                  <>
                    <th>Time</th>
                    <th>Method</th>
                    <th>Late?</th>
                  </>
                )}
                {activeTab === 'checkedOut' && (
                  <>
                    <th>Checked In</th>
                    <th>Checked Out</th>
                    <th>Auto?</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {tabData[activeTab].map((m: any) => (
                <tr key={m.memberId}>
                  <td>
                    <strong>{m.fullName}</strong>
                    <br />
                    <small className="text-muted">{m.roleLabel}</small>
                  </td>
                  <td>{m.unitName}</td>
                  {activeTab === 'checkedIn' && (
                    <>
                      <td>
                        <small>
                          {m.checkedInAt ? new Date(m.checkedInAt).toLocaleTimeString() : '—'}
                        </small>
                      </td>
                      <td>
                        <Badge bg="info" text="dark">{m.checkInMethod}</Badge>
                      </td>
                      <td>
                        {m.isLate && <Badge bg="warning" text="dark">Late</Badge>}
                      </td>
                    </>
                  )}
                  {activeTab === 'checkedOut' && (
                    <>
                      <td>
                        <small>
                          {m.checkedInAt ? new Date(m.checkedInAt).toLocaleTimeString() : '—'}
                        </small>
                      </td>
                      <td>
                        <small>
                          {m.checkedOutAt ? new Date(m.checkedOutAt).toLocaleTimeString() : '—'}
                        </small>
                      </td>
                      <td>
                        {m.autoCheckedOut && <Badge bg="secondary">Auto</Badge>}
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Container>
    </ApolloWrapper>
  )
}

export default CheckInEventReport
