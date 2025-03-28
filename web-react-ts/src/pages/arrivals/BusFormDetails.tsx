import { useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import PlaceholderCustom from 'components/Placeholder'
import { ChurchContext } from 'contexts/ChurchContext'
import { MemberContext } from 'contexts/MemberContext'
import { ServiceContext } from 'contexts/ServiceContext'
import { useState } from 'react'
import { useContext } from 'react'
import { Container, Row, Col, Table, Button } from 'react-bootstrap'
import { DISPLAY_BUSSING_RECORDS } from './arrivalsQueries'
import '../services/record-service/ServiceDetails.css'
import { useNavigate } from 'react-router'
import RoleView from 'auth/RoleView'
import { permitAdminArrivals } from 'permission-utils'
import { parseNeoTime } from 'jd-date-utils'
import CloudinaryImage from 'components/CloudinaryImage'
import usePopup from 'hooks/usePopup'
import Popup from 'components/Popup/Popup'
import { getHumanReadableDate } from 'jd-date-utils'
import { BacentaWithArrivals, BussingRecord } from './arrivals-types'
import CurrencySpan from 'components/CurrencySpan'
import VehicleButton from './components/VehicleButton'
import PullToRefresh from 'react-simple-pull-to-refresh'
import './Arrivals.css'

const BusFormDetails = () => {
  const { bacentaId } = useContext(ChurchContext)
  const { theme } = useContext(MemberContext)
  const { bussingRecordId } = useContext(ServiceContext)
  const { isOpen, togglePopup } = usePopup()
  const [picturePopup, setPicturePopup] = useState('')
  const { data, loading, error, refetch } = useQuery(DISPLAY_BUSSING_RECORDS, {
    variables: { bussingRecordId: bussingRecordId, bacentaId: bacentaId },
  })

  const navigate = useNavigate()
  const bussing: BussingRecord = data?.bussingRecords[0]
  const church: BacentaWithArrivals = data?.bacentas[0]

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper loading={loading} error={error} data={data} placeholder>
        <Container>
          <PlaceholderCustom as="h3" loading={loading}>
            <HeadingPrimary>{`${church?.__typename} Bussing Details`}</HeadingPrimary>
          </PlaceholderCustom>
          <PlaceholderCustom as="h6" loading={loading}>
            <HeadingSecondary>{`${church?.name} ${church?.__typename}`}</HeadingSecondary>
            <p>{`Recorded by ${bussing?.created_by.fullName}`}</p>
            {bussing?.counted_by.length ? (
              <p className="mb-0">
                {`Counted`}
                <RoleView roles={permitAdminArrivals('Stream')}>
                  {` by `}
                  {bussing.counted_by.map((counter, i) => (
                    <span key={i} className="good">
                      {counter.fullName}
                      {i < bussing.counted_by.length - 1 && ' | '}
                    </span>
                  ))}
                </RoleView>
              </p>
            ) : null}
          </PlaceholderCustom>

          <Row>
            <Col>
              <Row className="d-flex justify-content-center mt-3">
                <Table variant={theme} striped bordered>
                  <tbody>
                    <tr>
                      <td>Date of Service</td>
                      <PlaceholderCustom
                        as="td"
                        xs={12}
                        loading={loading}
                        className="td-placeholder"
                      >
                        <td>
                          {getHumanReadableDate(
                            bussing?.serviceDate.date.toString()
                          )}
                        </td>
                      </PlaceholderCustom>
                    </tr>
                    <tr>
                      <td>Mobilisation Picture</td>
                      <td>
                        <PlaceholderCustom loading={loading}>
                          <span
                            className="text-primary"
                            onClick={() =>
                              navigate('/arrivals/mobilisation-picture')
                            }
                          >
                            <u>Click Here To View</u>
                          </span>
                        </PlaceholderCustom>
                      </td>
                    </tr>
                    <tr>
                      <td>Leader Says</td>
                      <td>
                        <PlaceholderCustom loading={loading}>
                          {bussing?.leaderDeclaration}
                        </PlaceholderCustom>
                      </td>
                    </tr>
                    <tr>
                      <td>Confirmed Attendance</td>
                      <td className="good">
                        <PlaceholderCustom loading={loading}>
                          {bussing?.attendance}
                        </PlaceholderCustom>
                      </td>
                    </tr>

                    <tr>
                      <td>Bussing Top Up</td>
                      <td className="good">
                        <PlaceholderCustom loading={loading}>
                          <CurrencySpan number={bussing?.bussingTopUp} />
                        </PlaceholderCustom>
                      </td>
                    </tr>

                    {bussing?.numberOfBusses && (
                      <tr>
                        <td>Number of Sprinters</td>
                        <td>
                          <PlaceholderCustom loading={loading}>
                            {bussing?.numberOfBusses}
                          </PlaceholderCustom>
                        </td>
                      </tr>
                    )}
                    {bussing?.numberOfSprinters ? (
                      <tr>
                        <td>Number of Sprinters</td>
                        <td>
                          <PlaceholderCustom loading={loading}>
                            {bussing?.numberOfSprinters}
                          </PlaceholderCustom>
                        </td>
                      </tr>
                    ) : null}
                    {bussing?.numberOfUrvans ? (
                      <tr>
                        <td>Number of Urvans</td>
                        <td>
                          <PlaceholderCustom loading={loading}>
                            {bussing?.numberOfUrvans}
                          </PlaceholderCustom>
                        </td>
                      </tr>
                    ) : null}

                    {bussing?.numberOfCars ? (
                      <tr>
                        <td>Number of Private Cars</td>
                        <td>
                          <PlaceholderCustom loading={loading}>
                            {bussing?.numberOfCars}
                          </PlaceholderCustom>
                        </td>
                      </tr>
                    ) : null}
                    {bussing?.mobileNetwork && (
                      <tr>
                        <td>Mobile Network</td>
                        <td>
                          <PlaceholderCustom loading={loading}>
                            {bussing?.mobileNetwork}
                          </PlaceholderCustom>
                        </td>
                      </tr>
                    )}
                    {bussing?.momoNumber && (
                      <tr>
                        <td>Momo Number</td>
                        <td>
                          <PlaceholderCustom loading={loading}>
                            {bussing?.momoNumber}
                          </PlaceholderCustom>
                        </td>
                      </tr>
                    )}
                    {bussing?.momoName && (
                      <tr>
                        <td>Momo Name</td>
                        <td>
                          <PlaceholderCustom loading={loading}>
                            {bussing?.momoName}
                          </PlaceholderCustom>
                        </td>
                      </tr>
                    )}
                    {bussing?.comments && (
                      <tr>
                        <td>Comments</td>
                        <td>
                          <i>
                            <PlaceholderCustom loading={loading}>
                              {bussing?.comments}
                            </PlaceholderCustom>
                          </i>
                        </td>
                      </tr>
                    )}

                    {bussing?.arrivalTime && (
                      <tr>
                        <td>Arrival Time</td>
                        <td className="fw-bold good">
                          <PlaceholderCustom loading={loading}>
                            {parseNeoTime(bussing?.arrivalTime.toString())}
                          </PlaceholderCustom>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
                <Row className="text-center">
                  {isOpen && (
                    <Popup handleClose={togglePopup}>
                      <CloudinaryImage
                        src={picturePopup}
                        className="full-width"
                        size="respond"
                      />
                    </Popup>
                  )}
                  {bussing?.bussingPictures && (
                    <>
                      <h6>Bussing Pictures</h6>
                      <div className="container card-button-row">
                        <table>
                          <tbody>
                            <tr>
                              {bussing?.bussingPictures?.map(
                                (picture, index) => (
                                  <td
                                    onClick={() => {
                                      setPicturePopup(picture)
                                      togglePopup()
                                    }}
                                    key={index}
                                  >
                                    <CloudinaryImage
                                      className="report-picture"
                                      src={picture}
                                      size="respond"
                                    />
                                  </td>
                                )
                              )}
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </Row>
              </Row>
            </Col>
          </Row>

          {bussing?.vehicleRecords.map((record, index) => (
            <span key={index}>
              <VehicleButton
                className="mb-2 me-1 py-2 px-1"
                record={record}
                size="sm"
              />
            </span>
          ))}
          <div className="d-grid gap-2 mb-2">
            <Button
              variant="outline-primary"
              size="lg"
              onClick={() => navigate('/arrivals')}
            >
              Back to Arrivals Home
            </Button>
          </div>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default BusFormDetails
