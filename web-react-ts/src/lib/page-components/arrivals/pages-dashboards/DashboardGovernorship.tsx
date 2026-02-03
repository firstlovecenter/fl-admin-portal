import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MenuButton from 'components/buttons/MenuButton'
import SubmitButton from 'components/formik/SubmitButton'
import Popup from 'components/Popup/Popup'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import React from 'react'
import { useContext } from 'react'
import { Col, Container, Row } from 'react-bootstrap'
import { GOVERNORSHIP_ARRIVALS_DASHBOARD } from '../arrivalsQueries'
import { useRouter } from 'next/navigation'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import RoleView from 'auth/RoleView'
import { SHORT_POLL_INTERVAL, throwToSentry } from 'global-utils'
import { MAKE_GOVERNORSHIPARRIVALS_ADMIN } from '../arrivalsMutation'
import { permitAdmin, permitArrivals } from 'permission-utils'
import usePopup from 'hooks/usePopup'
import SearchMember from 'components/formik/SearchMember'
import { beforeStreamArrivalsDeadline } from '../arrivals-utils'
import ErrorText from 'components/ErrorText'
import PullToRefresh from 'react-simple-pull-to-refresh'
import ArrivalsMenuDropdown from '../ArrivalsMenuDropdown'
import Input from 'components/formik/Input'
import { ChurchContext } from 'contexts/ChurchContext'
import ArrivalsDateSubmitBtn from '../components/ArrivalsDateSubmitBtn'
import MemberAvatarWithName from 'components/LeaderAvatar/MemberAvatarWithName'

export type AdminFormOptions = {
  adminName: string
  adminSelect: string
}

type DateFormOptions = {
  arrivalDate: string
}

const GovernorshipDashboard = () => {
  const { isOpen, togglePopup } = usePopup()
  const router = useRouter()
  const { arrivalDate, setArrivalDate, governorshipId } =
    useContext(ChurchContext)
  const today = new Date().toISOString().slice(0, 10)
  const { data, loading, error, refetch } = useQuery(
    GOVERNORSHIP_ARRIVALS_DASHBOARD,
    {
      variables: {
        id: governorshipId,
        date: today,
        arrivalDate: arrivalDate || today,
      },
      pollInterval: SHORT_POLL_INTERVAL,
      fetchPolicy: 'cache-and-network',
    }
  )

  const [MakeGovernorshipArrivalsAdmin] = useMutation(
    MAKE_GOVERNORSHIPARRIVALS_ADMIN
  )
  const governorship = data?.governorships[0]

  const initialValues: AdminFormOptions = {
    adminName: governorship?.arrivalsAdmin
      ? `${governorship?.arrivalsAdmin?.fullName}`
      : '',
    adminSelect: governorship?.arrivalsAdmin?.id ?? '',
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

    MakeGovernorshipArrivalsAdmin({
      variables: {
        governorshipId,
        newAdminId: values.adminSelect,
        oldAdminId: initialValues.adminSelect || 'no-old-admin',
      },
    })
      .then(() => {
        togglePopup()
        onSubmitProps.setSubmitting(false)
        alert('Governorship Arrivals Admin has been changed successfully')
      })
      .catch((e) => throwToSentry(e))
  }

  const ArrivalsMenu = [
    { title: 'Change Arrivals Admin', onClick: togglePopup },
  ]

  const dateValidationSchema = Yup.object({
    date: Yup.date().notRequired(),
  })

  const dateInitialValues: DateFormOptions = {
    arrivalDate,
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
            {governorship?.name} Governorship Arrivals Real Time Dashboard
          </HeadingPrimary>
          {governorship?.arrivalsAdmin && (
            <>
              <hr className="m-2" />
              <div className="ps-4">
                <div className="text-warning">Arrivals Admin</div>
                <MemberAvatarWithName member={governorship?.arrivalsAdmin} />
              </div>
              <hr className="m-2" />
            </>
          )}
          {isOpen && (
            <Popup handleClose={togglePopup}>
              <b>Change Arrivals Admin</b>
              <p>Please enter the name of the new administrator</p>

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
                          ...permitAdmin('Governorship'),
                          ...permitArrivals('Council'),
                        ]}
                      >
                        <ArrivalsMenuDropdown menuItems={ArrivalsMenu} />
                      </RoleView>
                    </Col>
                  </Row>
                </Form>
              )}
            </Formik>

            {!beforeStreamArrivalsDeadline(governorship?.council.stream) && (
              <ErrorText>Arrival Deadline is up! Thank you very much</ErrorText>
            )}
            <ApolloWrapper loading={loading} data={data} error={error}>
              <>
                <MenuButton
                  title="Bacentas With No Activity"
                  onClick={() => router.push('/arrivals/bacentas-no-activity')}
                  number={governorship?.bacentasNoActivityCount.toString()}
                  color="red"
                  iconBg
                  noCaption
                />
                <MenuButton
                  title="Bacentas Mobilising"
                  onClick={() => router.push('/arrivals/bacentas-mobilising')}
                  number={governorship?.bacentasMobilisingCount.toString()}
                  color="orange"
                  iconBg
                  noCaption
                />
                <MenuButton
                  title="Bacentas On The Way"
                  onClick={() => router.push('/arrivals/bacentas-on-the-way')}
                  number={governorship?.bacentasOnTheWayCount.toString()}
                  color="yellow"
                  iconBg
                  noCaption
                />
                <MenuButton
                  title={`Bacentas That Didn't Bus`}
                  onClick={() => router.push('/arrivals/bacentas-below-8')}
                  number={governorship?.bacentasBelow8Count.toString()}
                  iconBg
                  color="red"
                  noCaption
                />
                <MenuButton
                  title="Bacentas That Have Arrived"
                  onClick={() => router.push('/arrivals/bacentas-have-arrived')}
                  number={governorship?.bacentasHaveArrivedCount.toString()}
                  color="green"
                  iconBg
                  noCaption
                />
                <div className="mt-5 d-grid gap-2">
                  <MenuButton
                    title="Members On The Way"
                    number={governorship?.bussingMembersOnTheWayCount.toString()}
                    color="yellow"
                    iconBg
                    noCaption
                  />
                  <MenuButton
                    title="Members That Have Arrived"
                    number={governorship?.bussingMembersHaveArrivedCount.toString()}
                    color="green"
                    iconBg
                    noCaption
                  />
                  <MenuButton
                    title="Busses That Have Arrived"
                    number={governorship?.bussesThatArrivedCount.toString()}
                    color="green"
                    iconBg
                    noCaption
                  />
                </div>
              </>
            </ApolloWrapper>
          </div>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default GovernorshipDashboard
