import { useMutation, useQuery } from '@apollo/client'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { useContext } from 'react'
import * as Yup from 'yup'
import { useRouter } from 'next/navigation'
import { MAKE_CAMPUSARRIVALS_ADMIN, SET_SWELL_DATE } from '../arrivalsMutation'
import { CAMPUS_ARRIVALS_DASHBOARD } from '../arrivalsQueries'
import { alertMsg, SHORT_POLL_INTERVAL, throwToSentry } from 'global-utils'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { Accordion, Col, Container, Row } from 'react-bootstrap'
import Popup from 'components/Popup/Popup'
import { Form, Formik, FormikHelpers } from 'formik'
import SubmitButton from 'components/formik/SubmitButton'
import RoleView from 'auth/RoleView'
import {
  permitAdmin,
  permitArrivals,
  permitLeaderAdmin,
} from 'permission-utils'
import MenuButton from 'components/buttons/MenuButton'
import { getHumanReadableDate } from 'jd-date-utils'
import DefaulterInfoCard from 'pages/services/defaulters/DefaulterInfoCard'
import usePopup from 'hooks/usePopup'
import ArrivalsMenuDropdown from '../ArrivalsMenuDropdown'
import { AdminFormOptions } from './DashboardGovernorship'
import SearchMember from 'components/formik/SearchMember'
import PullToRefresh from 'react-simple-pull-to-refresh'
import Input from 'components/formik/Input'
import { ChurchContext } from 'contexts/ChurchContext'
import ArrivalsDateSubmitBtn from '../components/ArrivalsDateSubmitBtn'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'

type DateFormOptions = {
  arrivalDate: string
}

const CampusDashboard = () => {
  const { isOpen, togglePopup } = usePopup()
  const { arrivalDate, setArrivalDate, campusId } = useContext(ChurchContext)
  const router = useRouter()
  const today = new Date().toISOString().slice(0, 10)
  const { data, loading, error, refetch } = useQuery(
    CAMPUS_ARRIVALS_DASHBOARD,
    {
      variables: {
        id: campusId,
        date: today,
        arrivalDate: arrivalDate || today,
      },
      pollInterval: SHORT_POLL_INTERVAL,
      fetchPolicy: 'cache-and-network',
    }
  )

  const [SetSwellDate] = useMutation(SET_SWELL_DATE)
  const [MakeCampusArrivalsAdmin] = useMutation(MAKE_CAMPUSARRIVALS_ADMIN)
  const campus = data?.campuses[0]

  const initialValues: AdminFormOptions = {
    adminName: campus?.arrivalsAdmin
      ? `${campus?.arrivalsAdmin?.firstName} ${campus?.arrivalsAdmin?.lastName}`
      : '',
    adminSelect: campus?.arrivalsAdmin?.id ?? '',
  }
  const validationSchema = Yup.object({
    adminSelect: Yup.string().required(
      'Please select an Admin from the dropdown'
    ),
  })

  // const submitCodeOfTheDay = async () => {
  //   const promptBox = window.prompt('Enter the Code of The Day')

  //   await SetCodeOfTheDay({ variables: { code: promptBox } })
  //     .then((res) => {
  //       alertMsg(
  //         `Code of the day has been set to "${res?.data?.SetCodeOfTheDay}"`
  //       )
  //     })
  //     .catch((error) => {
  //       alertMsg(error)
  //     })
  // }

  const onSubmit = (
    values: AdminFormOptions,
    onSubmitProps: FormikHelpers<AdminFormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)

    MakeCampusArrivalsAdmin({
      variables: {
        campusId,
        newAdminId: values.adminSelect,
        oldAdminId: initialValues.adminSelect || 'no-old-admin',
      },
    })
      .then(() => {
        togglePopup()
        onSubmitProps.setSubmitting(false)
        alert('Campus Arrivals Admin has been changed successfully')
      })
      .catch((e) => throwToSentry(e))
  }

  const aggregates = {
    title: 'Streams',
    data: campus?.streamCount,
    link: `/arrivals/campus-by-stream`,
  }

  const ArrivalsMenu = [
    { title: 'Change Arrivals Admin', onClick: togglePopup },
    !data?.timeGraphs.length || !data?.timeGraphs[0]?.swell
      ? {
          title: ' Set Today as Swell',
          onClick: () => {
            const confirmBox = window.confirm(
              'Do you want to set today as a swell day?'
            )

            if (confirmBox === true) {
              SetSwellDate({
                variables: { date: today },
              }).then(() => alertMsg('Swell Date Set Succesffully'))
            }
          },
        }
      : {},
    // { title: 'Code of the Day', onClick: () => submitCodeOfTheDay() },
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
        <Container>
          <HeadingPrimary loading={loading}>
            {campus?.name} Campus Arrivals Real Time Dashboard
          </HeadingPrimary>
          {campus?.arrivalsAdmin && (
            <>
              <hr className="m-2" />
              <div className="ps-4">
                <div className="text-warning">Arrivals Admin</div>
                <MemberAvatarWithName member={campus?.arrivalsAdmin} />
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
          {data?.timeGraphs.length ? (
            <>
              <h4>{getHumanReadableDate(data?.timeGraphs[0]?.date, true)}</h4>
              <h5>{data?.timeGraphs[0].swell && `Swollen Weekend!`}</h5>
            </>
          ) : null}
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
                      <RoleView roles={permitAdmin('Campus')}>
                        <ArrivalsMenuDropdown menuItems={ArrivalsMenu} />
                      </RoleView>
                    </Col>
                  </Row>
                </Form>
              )}
            </Formik>

            <DefaulterInfoCard defaulter={aggregates} />
            <Accordion defaultActiveKey="0">
              <Accordion.Item eventKey="0">
                <Accordion.Header>Bacenta Monitoring</Accordion.Header>
                <Accordion.Body>
                  <div className="d-grid gap-2">
                    <MenuButton
                      title="Bacentas With No Activity"
                      onClick={() =>
                        router.push('/arrivals/bacentas-no-activity')
                      }
                      number={campus?.bacentasNoActivityCount.toString()}
                      color="red"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Bacentas Mobilising"
                      onClick={() =>
                        router.push('/arrivals/bacentas-mobilising')
                      }
                      number={campus?.bacentasMobilisingCount.toString()}
                      color="orange"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Bacentas On The Way"
                      onClick={() =>
                        router.push('/arrivals/bacentas-on-the-way')
                      }
                      number={campus?.bacentasOnTheWayCount.toString()}
                      color="yellow"
                      iconBg
                      noCaption
                    />

                    <MenuButton
                      title="Bacentas That Didn't Bus"
                      onClick={() => router.push('/arrivals/bacentas-below-8')}
                      number={campus?.bacentasBelow8Count.toString()}
                      iconBg
                      color="red"
                      noCaption
                    />

                    <MenuButton
                      title="Bacentas That Have Arrived"
                      onClick={() =>
                        router.push('/arrivals/bacentas-have-arrived')
                      }
                      number={campus?.bacentasHaveArrivedCount.toString()}
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
                  ...permitLeaderAdmin('Campus'),
                ]}
              >
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Financial Data</Accordion.Header>
                  <Accordion.Body>
                    <div className="d-grid gap-2">
                      <MenuButton
                        title="Vehicles That Have Been Paid"
                        onClick={() => router.push('#')}
                        number={campus?.vehiclesHaveBeenPaidCount.toString()}
                        color="green"
                        iconBg
                        noCaption
                      />
                      <MenuButton
                        title="Vehicles To Be Paid"
                        onClick={() => router.push('#')}
                        number={campus?.vehiclesToBePaidCount.toString()}
                        color="yellow"
                        iconBg
                        noCaption
                      />

                      <MenuButton
                        title="Amount That Has Been Paid"
                        onClick={() => router.push('#')}
                        number={campus?.vehicleAmountHasBeenPaid.toString()}
                        color="green"
                        noCaption
                        iconBg
                      />
                      <MenuButton
                        title="Amount To Be Paid"
                        onClick={() => router.push('#')}
                        number={campus?.vehicleAmountToBePaid.toString()}
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
                      number={campus?.bussingMembersOnTheWayCount.toString()}
                      color="yellow"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Members That Have Arrived"
                      number={campus?.bussingMembersHaveArrivedCount.toString()}
                      color="green"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Busses On The Way"
                      number={campus?.bussesOnTheWayCount.toString()}
                      color="yellow"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Busses That Have Arrived"
                      number={campus?.bussesThatArrivedCount.toString()}
                      color="green"
                      iconBg
                      noCaption
                    />
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CampusDashboard
