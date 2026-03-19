import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Container, Row, Col, Card } from 'react-bootstrap'
import HeadingSecondary from 'components/HeadingSecondary'
import ChurchList from 'pages/services/ChurchList'
import { Link } from 'react-router-dom'
import { QrCode, ClockHistory, BarChartLine } from 'react-bootstrap-icons'

const CheckInsChurchSelect = () => {
  return (
    <Container>
      <HeadingPrimary>Check-Ins</HeadingPrimary>

      {/* Quick-action shortcuts */}
      <Row className="g-3 mb-4">
        <Col xs={4}>
          <Card
            as={Link}
            to="/checkins/qr"
            className="text-center p-3 text-decoration-none h-100"
            style={{ cursor: 'pointer' }}
          >
            <QrCode size={28} className="mx-auto mb-2 text-primary" />
            <small className="fw-semibold">Scan QR</small>
          </Card>
        </Col>
        <Col xs={4}>
          <Card
            as={Link}
            to="/checkins/history"
            className="text-center p-3 text-decoration-none h-100"
            style={{ cursor: 'pointer' }}
          >
            <ClockHistory size={28} className="mx-auto mb-2 text-secondary" />
            <small className="fw-semibold">History</small>
          </Card>
        </Col>
        <Col xs={4}>
          <Card
            as={Link}
            to="/checkins/reports"
            className="text-center p-3 text-decoration-none h-100"
            style={{ cursor: 'pointer' }}
          >
            <BarChartLine size={28} className="mx-auto mb-2 text-success" />
            <small className="fw-semibold">Reports</small>
          </Card>
        </Col>
      </Row>

      <HeadingSecondary>Click on one of churches below</HeadingSecondary>
      <ChurchList color="checkins" link="/checkins" />
    </Container>
  )
}

export default CheckInsChurchSelect
