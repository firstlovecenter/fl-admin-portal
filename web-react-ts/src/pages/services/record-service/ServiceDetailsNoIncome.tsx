import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import SpinnerPage from 'components/SpinnerPage'
import TableFromArrays, {
  TableArray,
} from 'components/TableFromArrays/TableFromArrays'
import { Church, ServiceRecord } from 'global-types'
import { parseNeoTime } from 'jd-date-utils'
import { useEffect } from 'react'
import { Col, Container, Row, Button, Card } from 'react-bootstrap'
import { useRouter } from 'next/navigation'
import './ServiceDetails.css'
import CurrencySpan from 'components/CurrencySpan'
import CloudinaryImage from 'components/CloudinaryImage'

type ServiceDetailsProps = {
  service: ServiceRecord
  church: Church
  loading: boolean
}

const ServiceDetailsNoIncome = ({
  service,
  church,
  loading,
}: ServiceDetailsProps) => {
  const router = useRouter()

  useEffect(() => {
    if (!service && !loading) {
      router.back()
    }
  }, [service, loading, router])

  if (loading) {
    return <SpinnerPage />
  }

  let table: TableArray = [
    [
      'Date of Service',
      new Date(service?.serviceDate.date).toDateString() ?? '',
    ],

    ['Form Filled At', parseNeoTime(service?.createdAt) ?? ''],
  ]
  if (!service?.noServiceReason) {
    // Service Wasn't Cancelled
    table.push(['Attendance', service?.attendance.toString()])

    if (service?.onlineGiving) {
      table.push([
        'Online Giving',
        <CurrencySpan number={service?.onlineGiving} />,
      ])
    }
  }

  if (service?.noServiceReason) {
    table.push(['No Service Reason', service?.noServiceReason])
  }

  return (
    <Container>
      <PlaceholderCustom as="h3" loading={loading}>
        <HeadingPrimary>{`${church?.__typename} Service Details`}</HeadingPrimary>
      </PlaceholderCustom>
      <PlaceholderCustom as="h6" loading={loading}>
        <HeadingSecondary>{`${church?.name} ${church?.__typename}`}</HeadingSecondary>
        {service?.created_by && (
          <p>{`Recorded by ${service?.created_by?.fullName}`}</p>
        )}
      </PlaceholderCustom>
      <Row>
        <Col>
          {service?.attendance && (
            <Row className="d-flex justify-content-center">
              <TableFromArrays tableArray={table} loading={loading} />
              <div className="text-center">
                {service?.familyPicture && (
                  <>
                    <h6>Family Picture</h6>
                    <div>
                      <PlaceholderCustom
                        loading={loading}
                        className="report-picture placeholder"
                        xs={12}
                      >
                        <img
                          className="report-picture"
                          src={service?.familyPicture}
                          alt="service report"
                        />
                      </PlaceholderCustom>
                    </div>
                  </>
                )}

                {service?.onStagePictures?.length && (
                  <div className="container mb-4 card-button-row multi d-flex align-items-center">
                    <table className="card-button-row">
                      <tbody>
                        <tr>
                          {service?.onStagePictures?.map((image) => (
                            <td className="img-container" key={image}>
                              {image && (
                                <Container className="">
                                  <CloudinaryImage
                                    src={image}
                                    size="large"
                                    alt="on stage attendance"
                                  />
                                </Container>
                              )}
                            </td>
                          ))}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="d-grid gap-2">
                  <Button
                    className="btn-graphs"
                    onClick={() => {
                      router.push(`/${church?.__typename.toLowerCase()}/graphs`)
                    }}
                  >
                    View Last 4 Weeks
                  </Button>
                </div>
              </div>
            </Row>
          )}
          {service?.noServiceReason && (
            <Card>
              <Card.Body>
                <div>{`Service Cancelled on ${new Date(
                  service?.serviceDate.date
                ).toDateString()}`}</div>
                <div>{`Reason: ${service?.noServiceReason}`}</div>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default ServiceDetailsNoIncome
