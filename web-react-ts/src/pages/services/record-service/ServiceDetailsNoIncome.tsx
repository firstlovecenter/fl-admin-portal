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
import { useNavigate } from 'react-router'
import './ServiceDetails.css'
import CurrencySpan from 'components/CurrencySpan'
import CloudinaryImage from 'components/CloudinaryImage'
import { Button } from 'components/ui/button'
import { Card, CardContent } from 'components/ui/card'

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
  const navigate = useNavigate()

  useEffect(() => {
    if (!service && !loading) {
      navigate(-1)
    }
  }, [service, navigate])

  if (loading) {
    return <Loader2 className="h-6 w-6 animate-spin" />
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
    <div>
      <PlaceholderCustom as="h3" loading={loading}>
        <HeadingPrimary>{`${church?.__typename} Service Details`}</HeadingPrimary>
      </PlaceholderCustom>
      <PlaceholderCustom as="h6" loading={loading}>
        <HeadingSecondary>{`${church?.name} ${church?.__typename}`}</HeadingSecondary>
        {service?.created_by && (
          <p>{`Recorded by ${service?.created_by?.fullName}`}</p>
        )}
      </PlaceholderCustom>
      <div>
        <div>
          {service?.attendance && (
            <div className="d-flex justify-content-center">
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
                                <div className="">
                                  <CloudinaryImage
                                    src={image}
                                    size="large"
                                    alt="on stage attendance"
                                  />
                                </div>
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
                      navigate(`/${church?.__typename.toLowerCase()}/graphs`)
                    }}
                  >
                    View Last 4 Weeks
                  </Button>
                </div>
              </div>
            </div>
          )}
          {service?.noServiceReason && (
            <Card>
              <CardContent>
                <div>{`Service Cancelled on ${new Date(
                  service?.serviceDate.date
                ).toDateString()}`}</div>
                <div>{`Reason: ${service?.noServiceReason}`}</div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServiceDetailsNoIncome
