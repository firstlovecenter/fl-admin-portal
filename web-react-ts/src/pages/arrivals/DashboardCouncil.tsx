import { useMutation, useQuery } from '@apollo/client'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import MenuButton from 'components/buttons/MenuButton'
import SubmitButton from 'components/formik/SubmitButton'
import Popup from 'components/Popup/Popup'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import React from 'react'
import { useContext } from 'react'
import { Button, Col, Container, Row } from 'react-bootstrap'
import { COUNCIL_ARRIVALS_DASHBOARD } from './arrivalsQueries'
import { useNavigate } from 'react-router'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import RoleView from 'auth/RoleView'
import { throwToSentry } from 'global-utils'
import { MAKE_COUNCILARRIVALS_ADMIN } from './arrivalsMutation'
import { permitAdmin, permitArrivals } from 'permission-utils'
import HeadingSecondary from 'components/HeadingSecondary'
import DefaulterInfoCard from 'pages/services/defaulters/DefaulterInfoCard'
import { MemberContext } from 'contexts/MemberContext'
import usePopup from 'hooks/usePopup'
import { AdminFormOptions } from './DashboardConstituency'
import SearchMember from 'components/formik/SearchMember'
import { beforeStreamArrivalsDeadline } from './arrivals-utils'
import ErrorText from 'components/ErrorText'
import PullToRefresh from 'react-simple-pull-to-refresh'

const CouncilDashboard = () => {
  const { isOpen, togglePopup } = usePopup()
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useQuery(
    COUNCIL_ARRIVALS_DASHBOARD,
    {
      variables: { id: currentUser?.currentChurch.id },
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
        councilId: currentUser?.currentChurch.id,
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
    title: 'Constituencies',
    data: council?.constituencyCount,
    link: `/arrivals/council-by-constituency`,
  }

  return (
    <PullToRefresh onRefresh={refetch}>
      <ApolloWrapper data={data} loading={loading} error={error}>
        <Container>
          <HeadingPrimary loading={loading}>
            {council?.name} Council Arrivals Summary
          </HeadingPrimary>
          <HeadingSecondary>{`Arrivals Rep: ${
            council?.arrivalsAdmin?.fullName ?? 'None'
          }`}</HeadingSecondary>
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
            <RoleView
              roles={[...permitAdmin('Council'), ...permitArrivals('Stream')]}
            >
              <Button
                variant="outline-secondary my-3"
                onClick={() => togglePopup()}
              >
                Change Arrivals Admin
              </Button>
            </RoleView>

            <DefaulterInfoCard defaulter={aggregates} />
            {!beforeStreamArrivalsDeadline(council?.stream) && (
              <ErrorText>Arrival Deadline is up! Thank you very much</ErrorText>
            )}
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
              title={`Bacentas That Didn't Bus`}
              onClick={() => navigate('/arrivals/bacentas-below-8')}
              number={council?.bacentasBelow8Count.toString()}
              iconBg
              color="red"
              noCaption
            />

            <MenuButton
              title="Bacentas That Have Arrived"
              onClick={() => navigate('/arrivals/bacentas-have-arrived')}
              number={council?.bacentasHaveArrivedCount.toString()}
              color="green"
              iconBg
              noCaption
            />
            <div className="mt-5 d-grid gap-2">
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
                title="Busses That Have Arrived"
                number={council?.bussesThatArrivedCount.toString()}
                color="green"
                iconBg
                noCaption
              />
            </div>
          </div>
        </Container>
      </ApolloWrapper>
    </PullToRefresh>
  )
}

export default CouncilDashboard
