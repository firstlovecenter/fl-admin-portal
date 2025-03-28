import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MenuButton from 'components/buttons/MenuButton'
import SubmitButton from 'components/formik/SubmitButton'
import Popup from 'components/Popup/Popup'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import { useContext } from 'react'
import { Accordion, Col, Container, Row } from 'react-bootstrap'
import { COUNCIL_ARRIVALS_DASHBOARD } from '../arrivalsQueries'
import { useNavigate } from 'react-router'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import RoleView from 'auth/RoleView'
import {
  SHORT_POLL_INTERVAL,
  authorisedLink,
  throwToSentry,
} from 'global-utils'
import { MAKE_COUNCILARRIVALS_ADMIN } from '../arrivalsMutation'
import {
  permitAdmin,
  permitArrivals,
  permitArrivalsPayer,
  permitLeaderAdmin,
} from 'permission-utils'
import DefaulterInfoCard from 'pages/services/defaulters/DefaulterInfoCard'
import usePopup from 'hooks/usePopup'
import { AdminFormOptions } from './DashboardGovernorship'
import SearchMember from 'components/formik/SearchMember'
import { beforeStreamArrivalsDeadline } from '../arrivals-utils'
import ErrorText from 'components/ErrorText'
import PullToRefresh from 'react-simple-pull-to-refresh'
import ArrivalsMenuDropdown from '../ArrivalsMenuDropdown'
import Input from 'components/formik/Input'
import { ChurchContext } from 'contexts/ChurchContext'
import ArrivalsDateSubmitBtn from '../components/ArrivalsDateSubmitBtn'
import { MemberContext } from 'contexts/MemberContext'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'

type DateFormOptions = {
  arrivalDate: string
}

const CouncilDashboard = () => {
  const { isOpen, togglePopup } = usePopup()
  const { currentUser } = useContext(MemberContext)
  const { arrivalDate, setArrivalDate, councilId } = useContext(ChurchContext)
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const { data, loading, error, refetch } = useQuery(
    COUNCIL_ARRIVALS_DASHBOARD,
    {
      pollInterval: SHORT_POLL_INTERVAL,
      variables: { id: councilId, arrivalDate: arrivalDate || today },
      fetchPolicy: 'cache-and-network',
    }
  )

  const [MakeCouncilArrivalsAdmin] = useMutation(MAKE_COUNCILARRIVALS_ADMIN)
  const council = data?.councils[0]

  const initialValues: AdminFormOptions = {
    adminName: council?.arrivalsAdmin
      ? `${council?.arrivalsAdmin?.firstName} ${council?.arrivalsAdmin?.lastName}`
      : '',
    adminSelect: council?.arrivalsAdmin?.id ?? '',
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

    MakeCouncilArrivalsAdmin({
      variables: {
        councilId,
        newAdminId: values.adminSelect,
        oldAdminId: initialValues.adminSelect || 'no-old-admin',
      },
    })
      .then(() => {
        togglePopup()
        onSubmitProps.setSubmitting(false)
        alert('Council Arrivals Admin has been changed successfully')
      })
      .catch((e) => throwToSentry(e))
  }

  const aggregates = {
    title: 'Governorships',
    data: council?.governorshipCount,
    link: `/arrivals/council-by-governorship`,
  }

  const ArrivalsMenu = [
    { title: 'Change Arrivals Admin', onClick: togglePopup },
    {
      title: 'Arrivals Payment Governorship',
      onClick: () => navigate('/council/arrivals-payers'),
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
        <Container>
          <HeadingPrimary loading={loading}>
            {council?.name} Council Arrivals Real Time Dashboard
          </HeadingPrimary>

          {council?.arrivalsAdmin && (
            <>
              <hr className="m-2" />
              <div className="ps-4">
                <div className="text-warning">Arrivals Admin</div>
                <MemberAvatarWithName member={council?.arrivalsAdmin} />
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
                          ...permitAdmin('Council'),
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

          <div className="d-grid gap-2">
            <DefaulterInfoCard defaulter={aggregates} />
            {!beforeStreamArrivalsDeadline(council?.stream) && (
              <ErrorText>Arrival Deadline is up! Thank you very much</ErrorText>
            )}

            <Accordion defaultActiveKey="0">
              <Accordion.Item eventKey="0">
                <Accordion.Header>Bacenta Monitoring</Accordion.Header>
                <Accordion.Body>
                  <div className="d-grid gap-2">
                    <MenuButton
                      title="Bacentas With No Activity"
                      onClick={() => navigate('/arrivals/bacentas-no-activity')}
                      number={council?.bacentasNoActivityCount.toString()}
                      color="red"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Bacentas Mobilising"
                      onClick={() => navigate('/arrivals/bacentas-mobilising')}
                      number={council?.bacentasMobilisingCount.toString()}
                      color="orange"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Bacentas On The Way"
                      onClick={() => navigate('/arrivals/bacentas-on-the-way')}
                      number={council?.bacentasOnTheWayCount.toString()}
                      color="yellow"
                      iconBg
                      noCaption
                    />

                    <MenuButton
                      title="Bacentas That Didn't Bus"
                      onClick={() => navigate('/arrivals/bacentas-below-8')}
                      number={council?.bacentasBelow8Count.toString()}
                      iconBg
                      color="red"
                      noCaption
                    />

                    <MenuButton
                      title="Bacentas That Have Arrived"
                      onClick={() =>
                        navigate('/arrivals/bacentas-have-arrived')
                      }
                      number={council?.bacentasHaveArrivedCount.toString()}
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
                  ...permitLeaderAdmin('Council'),
                  ...permitArrivalsPayer(),
                ]}
              >
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Financial Data</Accordion.Header>
                  <Accordion.Body>
                    <div className="d-grid gap-2">
                      <MenuButton
                        title="Vehicles That Have Been Paid"
                        onClick={() =>
                          navigate(
                            authorisedLink(
                              currentUser,
                              permitArrivalsPayer(),
                              '/arrivals/vehicles-to-be-paid'
                            )
                          )
                        }
                        number={council?.vehiclesHaveBeenPaidCount.toString()}
                        color="green"
                        iconBg
                        noCaption
                      />

                      <MenuButton
                        title="Vehicles To Be Paid"
                        onClick={() =>
                          navigate(
                            authorisedLink(
                              currentUser,
                              permitArrivalsPayer(),
                              '/arrivals/vehicles-to-be-paid'
                            )
                          )
                        }
                        number={council?.vehiclesToBePaidCount.toString()}
                        color="yellow"
                        iconBg
                        noCaption
                      />

                      <MenuButton
                        title="Amount That Has Been Paid"
                        onClick={() => navigate('#')}
                        number={council?.vehicleAmountHasBeenPaid.toString()}
                        color="green"
                        iconBg
                        noCaption
                      />
                      <MenuButton
                        title="Amount To Be Paid"
                        onClick={() => navigate('#')}
                        number={council?.vehicleAmountToBePaid.toString()}
                        color="yellow"
                        iconBg
                        noCaption
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
                      number={council?.bussingMembersOnTheWayCount.toString()}
                      color="yellow"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Members That Have Arrived"
                      number={council?.bussingMembersHaveArrivedCount.toString()}
                      color="green"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Busses On The Way"
                      number={council?.bussesOnTheWayCount.toString()}
                      color="yellow"
                      iconBg
                      noCaption
                    />
                    <MenuButton
                      title="Busses That Have Arrived"
                      number={council?.bussesThatArrivedCount.toString()}
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

export default CouncilDashboard
