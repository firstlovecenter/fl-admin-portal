import { useMutation } from '@apollo/client'
import RoleView from 'auth/RoleView'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import SpinnerPage from 'components/SpinnerPage'
import TableFromArrays, {
  TableArray,
} from 'components/TableFromArrays/TableFromArrays'
import { MemberContext } from 'contexts/MemberContext'
import { Church, ServiceRecord } from 'global-types'
import { alertMsg, throwToSentry } from 'global-utils'
import { parseNeoTime } from 'jd-date-utils'
import { permitAdmin, permitTellerStream } from 'permission-utils'
import { Fragment, useContext, useEffect, useState } from 'react'
import { Col, Container, Row, Button, Card } from 'react-bootstrap'
import {
  CheckCircleFill,
  FileEarmarkArrowUpFill,
  Trash,
} from 'react-bootstrap-icons'
import { useNavigate } from 'react-router'
import {
  MANUALLY_CONFIRM_OFFERING_PAYMENT,
  DELETE_SERVICE_RECORD,
} from './RecordServiceMutations'
import './ServiceDetails.css'
import CurrencySpan from 'components/CurrencySpan'

type ServiceDetailsProps = {
  service: ServiceRecord
  church: Church
  loading: boolean
}

const ServiceDetails = ({ service, church, loading }: ServiceDetailsProps) => {
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const [ManuallyConfirmOfferingPayment] = useMutation(
    MANUALLY_CONFIRM_OFFERING_PAYMENT
  )
  const [DeleteServiceRecord] = useMutation(DELETE_SERVICE_RECORD)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDeleteService = async () => {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this service record? This action cannot be undone.'
    )

    if (!confirmDelete) return

    setDeleting(true)
    try {
      await DeleteServiceRecord({
        variables: {
          serviceRecordId: service?.id,
        },
      })
      alertMsg('Service record deleted successfully')
      navigate(-1) // Navigate back after deletion
    } catch (error) {
      throwToSentry('Error deleting service record', error)
      alertMsg('Failed to delete service record. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!service && !loading) {
      navigate(-1)
    }
  }, [service, navigate])

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
    table.push(['Income', <CurrencySpan number={service?.income} />])
    if (service?.onlineGiving) {
      table.push([
        'Online Giving',
        <CurrencySpan number={service?.onlineGiving} />,
      ])
    }
    // There is income for service
    if (service?.cash) {
      table.push(['Cash', <CurrencySpan number={service?.cash} />])
      table.push(['Number of Tithers', service?.numberOfTithers?.toString()])
      if (service?.foreignCurrency) {
        table.push([
          'Foreign Currency and Cheques',
          <div>
            {service?.foreignCurrency.split('\n').map((line, index) => (
              <Fragment key={index}>
                {line}
                <br />
              </Fragment>
            ))}
          </div>,
        ])
      }

      table.push(
        ...service?.treasurers.map((treasurer, i) => [
          `Treasurer ${i + 1}`,
          treasurer.fullName ?? '',
        ])
      )
    }
  }

  if (service?.noServiceReason) {
    table.push(['No Service Reason', service?.noServiceReason])
  }

  const noBankingProof =
    service?.cash && !service?.bankingProof && !service?.bankingSlip

  return (
    <Container>
      <PlaceholderCustom as="h3" loading={loading}>
        <HeadingPrimary>{`${church?.__typename} Meeting Details`}</HeadingPrimary>
      </PlaceholderCustom>
      <PlaceholderCustom as="h6" loading={loading}>
        <HeadingSecondary>{`${church?.name} ${church?.__typename}`}</HeadingSecondary>
        {service?.created_by && (
          <p>{`Recorded by ${service?.created_by?.fullName}`}</p>
        )}
        {!currentUser.noIncomeTracking && service?.bankingSlipUploader && (
          <p className="fw-bold">{`Banking Slip Uploaded by ${service?.bankingSlipUploader.fullName}`}</p>
        )}
        {!currentUser.noIncomeTracking &&
          service?.transactionStatus === 'success' && (
            <p className="fw-bold ">{`Offering Banked by ${service?.offeringBankedBy.fullName}`}</p>
          )}
        <RoleView roles={[...permitAdmin('Council'), ...permitTellerStream()]}>
          {!currentUser.noIncomeTracking && service?.bankingConfirmer && (
            <p className="green">{`Offering Confirmed by ${service?.bankingConfirmer.fullName}`}</p>
          )}
        </RoleView>
      </PlaceholderCustom>

      {service?.name && service?.description && (
        <Card border="info" className="mb-3">
          <Card.Header>
            <div className="fw-bold">{service.name}</div>
          </Card.Header>
          <Card.Body>
            <div>{service.description}</div>
          </Card.Body>
        </Card>
      )}

      <Row>
        <Col>
          {service?.attendance && (
            <Row className="d-flex justify-content-center">
              <TableFromArrays tableArray={table} loading={loading} />
              <div className="text-center">
                {!currentUser.noIncomeTracking && service?.treasurerSelfie && (
                  <>
                    <h6>Treasurer Selfie</h6>
                    <div>
                      <PlaceholderCustom
                        className="report-picture placeholder"
                        xs={12}
                        loading={loading}
                      >
                        <img
                          className="report-picture"
                          src={service?.treasurerSelfie}
                          alt="treasurer selfie"
                        />
                      </PlaceholderCustom>
                    </div>
                  </>
                )}
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
                {!currentUser.noIncomeTracking && service?.offeringBankedBy && (
                  <div className="mb-4">
                    {`${service?.offeringBankedBy.fullName} used the Self Banking Feature. Click this button to see
                    Details`}
                    <p>
                      <Button onClick={() => navigate('/self-banking/receipt')}>
                        View Banking Details
                      </Button>
                    </p>
                  </div>
                )}
                {!currentUser.noIncomeTracking && service?.bankingSlip && (
                  <>
                    <h6>Banking Slip</h6>

                    <div>
                      <PlaceholderCustom
                        loading={loading}
                        className="report-picture placeholder"
                        xs={12}
                      >
                        <img
                          className="report-picture"
                          src={service?.bankingSlip}
                          alt="banking slip"
                        />
                      </PlaceholderCustom>
                    </div>
                  </>
                )}{' '}
                {noBankingProof && (
                  <p className="fw-bold text-danger">
                    You Have Not Submitted Your Banking Slip!!!
                  </p>
                )}
                {noBankingProof && church.__typename !== 'Hub' && (
                  <div className="d-grid gap-2">
                    <RoleView
                      roles={[
                        ...permitAdmin('Oversight'),
                        ...permitTellerStream(),
                      ]}
                    >
                      <Button
                        className="mt-3 mb-3"
                        variant="warning"
                        disabled={submitting}
                        onClick={async () => {
                          setSubmitting(true)
                          const confirmBox = window.confirm(
                            'Do you want to confirm banking for this service?'
                          )

                          if (confirmBox === true) {
                            try {
                              const res = await ManuallyConfirmOfferingPayment({
                                variables: { serviceRecordId: service?.id },
                              })

                              if (res.errors) {
                                throw new Error(res.errors[0].message)
                              }

                              alertMsg(
                                'Offering Payment has been confirmed. Thank you!'
                              )
                            } catch (error) {
                              throwToSentry('', error)
                            } finally {
                              setSubmitting(false)
                            }
                          }
                        }}
                      >
                        <CheckCircleFill />
                        {submitting ? 'Confirming...' : 'Confirm Offering'}
                      </Button>
                    </RoleView>
                    <RoleView roles={permitAdmin('Stream')}>
                      <Button
                        className="mb-3"
                        variant="danger"
                        onClick={() => {
                          navigate(
                            `/${church?.__typename.toLowerCase()}/banking-slip/submission`
                          )
                        }}
                      >
                        <FileEarmarkArrowUpFill />
                        Upload Banking Slip
                      </Button>
                    </RoleView>
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
                  <RoleView roles={['fishers']}>
                    <Button
                      variant="danger"
                      disabled={deleting}
                      onClick={handleDeleteService}
                      className="d-flex align-items-center justify-content-center gap-2"
                    >
                      <Trash />
                      {deleting ? 'Deleting...' : 'Delete Service'}
                    </Button>
                  </RoleView>
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

export default ServiceDetails
