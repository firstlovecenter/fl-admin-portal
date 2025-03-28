import { useMutation, useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { useContext } from 'react'
import * as Yup from 'yup'
import { useNavigate } from 'react-router'
import { MAKE_STREAMARRIVALS_ADMIN } from '../arrivalsMutation'
import { STREAM_ARRIVALS_DASHBOARD } from '../arrivalsQueries'
import { SHORT_POLL_INTERVAL, throwToSentry } from 'global-utils'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Accordion, Col, Container, Row } from 'react-bootstrap'
import Popup from 'components/Popup/Popup'
import { Form, Formik, FormikHelpers } from 'formik'
import SubmitButton from 'components/formik/SubmitButton'
import RoleView from 'auth/RoleView'
import {
  permitAdmin,
  permitArrivals,
  permitArrivalsCounter,
  permitLeaderAdmin,
} from 'permission-utils'
import MenuButton from 'components/buttons/MenuButton'
import DefaulterInfoCard from 'pages/services/defaulters/DefaulterInfoCard'
import usePopup from 'hooks/usePopup'
import { AdminFormOptions } from './DashboardGovernorship'
import SearchMember from 'components/formik/SearchMember'
import ArrivalsMenuDropdown from '../ArrivalsMenuDropdown'
import { beforeStreamArrivalsDeadline } from '../arrivals-utils'
import { StreamWithArrivals } from '../arrivals-types'
import ErrorText from 'components/ErrorText'
import PullToRefresh from 'react-simple-pull-to-refresh'
import Input from 'components/formik/Input'
import { ChurchContext } from 'contexts/ChurchContext'
import ArrivalsDateSubmitBtn from '../components/ArrivalsDateSubmitBtn'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'

type DateFormOptions = {
  arrivalDate: string
}

const StreamDashboard = () => {
  const { isOpen, togglePopup } = usePopup()
  const { arrivalDate, setArrivalDate, streamId } = useContext(ChurchContext)
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const { data, loading, error, refetch } = useQuery(
    STREAM_ARRIVALS_DASHBOARD,
    {
      pollInterval: SHORT_POLL_INTERVAL,
      variables: { id: streamId, arrivalDate: arrivalDate || today },
    }
  )

  const [MakeStreamArrivalsAdmin] = useMutation(MAKE_STREAMARRIVALS_ADMIN)
  const stream: StreamWithArrivals = data?.streams[0]

  const initialValues: AdminFormOptions = {
    adminName: stream?.arrivalsAdmin
      ? `${stream?.arrivalsAdmin?.firstName} ${stream?.arrivalsAdmin?.lastName}`
      : '',
    adminSelect: stream?.arrivalsAdmin?.id ?? '',
  }
  const validationSchema = Yup.object({
    adminSelect: Yup.string().required(
      'Please select an Admin from the dropdown'
    ),
  })

  const onSubmit = (
    values: AdminFormOptions,
    onSubmitProps: FormikHelpers<AdminFormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)

    MakeStreamArrivalsAdmin({
      variables: {
        streamId,
        newAdminId: values.adminSelect,
        oldAdminId: initialValues.adminSelect || 'no-old-admin',
      },
    })
      .then(() => {
        togglePopup()
        onSubmitProps.setSubmitting(false)
        alert('stream Arrivals Admin has been changed successfully')
      })
      .catch((e) => throwToSentry(e))
  }

  const aggregates = {
    title: 'Councils',
    data: stream?.councilCount,
    link: `/arrivals/stream-by-council`,
  }

  const ArrivalsMenu = [
    { title: 'Change Arrivals Admin', onClick: togglePopup },
    {
      title: 'Arrivals Counters',
      onClick: () => navigate('/stream/arrivals-counters'),
    },
    {
      title: 'Arrival Times',
      onClick: () => navigate('/stream/arrival-times'),
    },
    {
      title: "Dowload Arrival's Payment Data",
      onClick: () => navigate('/stream/arrival-excel-data'),
    },
  ]

  const dateValidationSchema = Yup.object({
    date: Yup.date().notRequired(),
  })

  const dateInitialValues: DateFormOptions = {
    arrivalDate: arrivalDate,
  }

  const onDateSubmit = (
    values: DateFormOptions,
    onSubmitProps: FormikHelpers<DateFormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)

    setArrivalDate(values.arrivalDate)
    onSubmitProps.setSubmitting(false)
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error}>
        <>
          <Container>
            <HeadingPrimary loading={loading}>
              {stream?.name} Stream Arrivals Real Time Dashboard
            </HeadingPrimary>
            {stream?.arrivalsAdmin && (
              <>
                <hr className="m-2" />
                <div className="ps-4">
                  <div className="text-warning">Arrivals Admin</div>
                  <MemberAvatarWithName member={stream?.arrivalsAdmin} />
                </div>
                <hr className="m-2" />
              </>
            )}
            {isOpen && (
              <Popup handleClose={togglePopup}>
                <b>Change Arrivals Admin</b>
                <p>Please enter the name of the new arrivals rep</p>

                <Formik
                  initialValues={initialValues}
                  validationSchema={validationSchema}
                  onSubmit={onSubmit}
                >
                  {(formik) => (
                    <Form>
                      <Row className="form-row">
                        <Col>
                          <SearchMember
                            name="adminSelect"
                            initialValue={initialValues?.adminName}
                            placeholder="Select an Admin"
                            setFieldValue={formik.setFieldValue}
                            aria-describedby="Member Search"
                            error={formik.errors.adminSelect}
                          />
                        </Col>
                      </Row>

                      <SubmitButton formik={formik} />
                    </Form>
                  )}
                </Formik>
              </Popup>
            )}

            <div className="d-grid gap-2">
              <Formik
                initialValues={dateInitialValues}
                validationSchema={dateValidationSchema}
                onSubmit={onDateSubmit}
                validateOnMount
              >
                {(formik) => (
                  <Form>
                    <Row className="align-items-center gx-0 justify-content-between">
                      <Col className="d-inline-block" xs={5}>
                        <Input
                          name="arrivalDate"
                          type="date"
                          placeholder="dd/mm/yyyy"
                          aria-describedby="date"
                        />
                      </Col>
                      <Col xs={2}>
                        <ArrivalsDateSubmitBtn formik={formik} />
                      </Col>
                      <Col>
                        <RoleView
                          roles={[
                            ...permitAdmin('Stream'),
                            ...permitArrivals('Stream'),
                          ]}
                        >
                          <ArrivalsMenuDropdown menuItems={ArrivalsMenu} />
                        </RoleView>
                      </Col>
                    </Row>
                  </Form>
                )}
              </Formik>
            </div>

            <div className="d-grid gap-2 my-3">
              <DefaulterInfoCard defaulter={aggregates} />
              {!beforeStreamArrivalsDeadline(stream) && (
                <ErrorText>
                  Arrival Deadline is up! Thank you very much
                </ErrorText>
              )}
            </div>
          </Container>
          <Accordion defaultActiveKey="0">
            <Accordion.Item eventKey="0">
              <Accordion.Header>Bacenta Monitoring</Accordion.Header>
              <Accordion.Body>
                <div className="d-grid gap-2">
                  <MenuButton
                    title="Bacentas With No Activity"
                    onClick={() => navigate('/arrivals/bacentas-no-activity')}
                    number={stream?.bacentasNoActivityCount.toString()}
                    color="red"
                    iconBg
                    noCaption
                  />
                  <MenuButton
                    title="Bacentas Mobilising"
                    onClick={() => navigate('/arrivals/bacentas-mobilising')}
                    number={stream?.bacentasMobilisingCount.toString()}
                    color="orange"
                    iconBg
                    noCaption
                  />
                  <MenuButton
                    title="Bacentas On The Way"
                    onClick={() => navigate('/arrivals/bacentas-on-the-way')}
                    number={stream?.bacentasOnTheWayCount.toString()}
                    color="yellow"
                    iconBg
                    noCaption
                  />
                  <RoleView roles={permitArrivalsCounter()}>
                    <MenuButton
                      title="Vehicles To Be Counted"
                      onClick={() => navigate('/arrivals/bacentas-to-count')}
                      number={stream?.vehiclesNotCountedCount.toString()}
                      color="yellow"
                      iconBg
                      noCaption
                    />
                  </RoleView>

                  <MenuButton
                    title="Bacentas That Didn't Bus"
                    onClick={() => navigate('/arrivals/bacentas-below-8')}
                    number={stream?.bacentasBelow8Count.toString()}
                    iconBg
                    color="red"
                    noCaption
                  />

                  <MenuButton
                    title="Bacentas That Have Arrived"
                    onClick={() => navigate('/arrivals/bacentas-have-arrived')}
                    number={stream?.bacentasHaveArrivedCount.toString()}
                    iconBg
                    color="green"
                    noCaption
                  />
                </div>
              </Accordion.Body>
            </Accordion.Item>

            <RoleView
              roles={[
                ...permitArrivals('Campus'),
                ...permitLeaderAdmin('Stream'),
              ]}
            >
              <Accordion.Item eventKey="1">
                <Accordion.Header>Financial Data</Accordion.Header>
                <Accordion.Body>
                  <div className="d-grid gap-2">
                    <MenuButton
                      title="Vehicles That Have Been Paid"
                      onClick={() => navigate('#')}
                      number={stream?.vehiclesHaveBeenPaidCount.toString()}
                      color="green"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Vehicles To Be Paid"
                      onClick={() => navigate('#')}
                      number={stream?.vehiclesToBePaidCount.toString()}
                      color="yellow"
                      iconBg
                      noCaption
                    />

                    <MenuButton
                      title="Amount That Has Been Paid"
                      onClick={() => navigate('#')}
                      number={stream?.vehicleAmountHasBeenPaid.toString()}
                      color="green"
                      noCaption
                      iconBg
                    />
                    <MenuButton
                      title="Amount To Be Paid"
                      onClick={() => navigate('#')}
                      number={stream?.vehicleAmountToBePaid.toString()}
                      color="yellow"
                      noCaption
                      iconBg
                    />
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            </RoleView>
            <Accordion.Item eventKey="2">
              <Accordion.Header>Bussing Data</Accordion.Header>
              <Accordion.Body>
                <div className="d-grid gap-2">
                  <MenuButton
                    title="Members On The Way"
                    number={stream?.bussingMembersOnTheWayCount.toString()}
                    color="yellow"
                    iconBg
                    noCaption
                  />
                  <MenuButton
                    title="Members That Have Arrived"
                    number={stream?.bussingMembersHaveArrivedCount.toString()}
                    color="green"
                    iconBg
                    noCaption
                  />
                  <MenuButton
                    title="Busses On The Way"
                    number={stream?.bussesOnTheWayCount.toString()}
                    color="yellow"
                    iconBg
                    noCaption
                  />
                  <MenuButton
                    title="Busses That Have Arrived"
                    number={stream?.bussesThatArrivedCount.toString()}
                    color="green"
                    iconBg
                    noCaption
                  />
                </div>
              </Accordion.Body>
            </Accordion.Item>
          </Accordion>
        </>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default StreamDashboard
