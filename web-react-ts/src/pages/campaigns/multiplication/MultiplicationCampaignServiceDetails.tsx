import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import SpinnerPage from 'components/SpinnerPage'
import TableFromArrays from 'components/TableFromArrays/TableFromArrays'
import { MemberContext } from 'contexts/MemberContext'
import { Church, Member } from 'global-types'
import { useContext, useEffect } from 'react'
import { Col, Container, Row, Button } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import '../../services/record-service/ServiceDetails.css'

type ServiceDetailsProps = {
  service: MultiplicationServiceRecord
  church: Church
  loading: boolean
}

export type MultiplicationServiceRecord = {
  bankingProof: boolean
  __typename: 'MultiplicationRecord'
  id: string
  createdAt: string
  created_by: Member
  crusadeLocation: string
  attendance: number
  income: number
  foreignCurrency: string
  souls: number
  miracles: number
  week: number
  crusadePictures: string[]
  treasurers: Member[]
  crusadeDate: {
    date: string
  }
  preacher: {
    firstName: string
    lastName: string
  }

  // Offering
  treasurerSelfie: string
  bankingSlip: string
  bankingSlipUploader: Member
  offeringBankedBy: Member
}

const MultiplicationCampaignServiceDetails = ({
  service,
  church,
  loading,
}: ServiceDetailsProps) => {
  const { theme } = useContext(MemberContext)
  const navigate = useNavigate()

  useEffect(() => {
    if (!service && !loading) {
      navigate(-1)
    }
  }, [service, navigate])

  if (loading) {
    return <SpinnerPage />
  }

  let table: string[][] = [
    [
      'Date of Crusade',
      new Date(service?.crusadeDate.date).toDateString() ?? '',
    ],
    [
      'Preacher',
      `${service?.preacher?.firstName.toString()} ${service?.preacher?.lastName.toString()}` ??
        '',
    ],
    ['Location Of Crusade', service?.crusadeLocation.toString()],
    ['Attendance', service?.attendance.toString()],
    ['Income', service?.income.toString()],
    ['Number of Souls Won', service?.souls.toString()],
    ['Number of Miracles', service?.miracles.toString()],
  ]

  if (service?.foreignCurrency) {
    table.push(['Foreign Currency', service?.foreignCurrency])
  }

  return (
    <Container>
      <PlaceholderCustom as="h3" loading={loading}>
        <HeadingPrimary>{`${church?.__typename} Multiplication Event Details`}</HeadingPrimary>
      </PlaceholderCustom>
      <PlaceholderCustom as="h6" loading={loading}>
        <HeadingSecondary>{`${church?.name} ${church?.__typename}`}</HeadingSecondary>
        {service?.created_by && (
          <p>{`Recorded by ${service?.created_by?.fullName}`}</p>
        )}
        {service?.bankingSlipUploader && (
          <p className="fw-bold">{`Banking Slip Uploaded by ${service?.bankingSlipUploader.fullName}`}</p>
        )}
        {service?.offeringBankedBy && (
          <p className="fw-bold">{`Offering Banked by ${service?.offeringBankedBy.fullName}`}</p>
        )}
      </PlaceholderCustom>
      <Row>
        <Col>
          {service?.attendance && (
            <Row className="d-flex justify-content-center">
              <TableFromArrays tableArray={table} loading={loading} />
              <div className="text-center">
                {service?.treasurerSelfie && (
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
                {service?.crusadePictures && (
                  <>
                    <h6>Crusade Pictures</h6>
                    <div className="container mb-4 card-button-row">
                      <table>
                        <tbody>
                          <tr>
                            {service?.crusadePictures?.map(
                              (crusadePicture, index) => (
                                <td className="col-auto" key={index}>
                                  <div key={index}>
                                    <PlaceholderCustom
                                      loading={loading}
                                      className="report-picture placeholder"
                                      xs={12}
                                    >
                                      <img
                                        height={200}
                                        className="report-picture"
                                        src={crusadePicture}
                                        alt="service report"
                                      />
                                    </PlaceholderCustom>
                                  </div>
                                </td>
                              )
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                {service?.bankingSlip && (
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
                          src={service.bankingSlip}
                          alt="banking slip"
                        />
                      </PlaceholderCustom>
                    </div>
                  </>
                )}{' '}
                {!service.bankingProof && service?.treasurerSelfie && (
                  <p className="fw-bold text-danger">
                    You Have Not Submitted Your Banking Slip!!!
                  </p>
                )}
                <div className="d-grid gap-2">
                  <Button
                    className={`btn-graphs ${theme}`}
                    onClick={() => {
                      navigate(
                        `/campaigns/${church?.__typename.toLowerCase()}/multiplication/trends`
                      )
                    }}
                  >
                    View Trends
                  </Button>
                </div>
              </div>
            </Row>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default MultiplicationCampaignServiceDetails
