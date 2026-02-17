import { useMutation, useQuery } from '@apollo/client'
import { Container, Row, Col, Card, Button } from 'react-bootstrap'
import { Formik, Form, Field } from 'formik'
import * as Yup from 'yup'
import { useNavigate } from 'react-router-dom'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import SubmitButton from 'components/formik/SubmitButton'
import Input from 'components/formik/Input'
import { CREATE_CHECKIN_EVENT, GET_ADMIN_SCOPES } from './checkinsQueries'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { useMemo } from 'react'

const scopeLevels = [
  { value: 'OVERSIGHT', label: 'Oversight' },
  { value: 'CAMPUS', label: 'Campus' },
  { value: 'STREAM', label: 'Stream' },
  { value: 'COUNCIL', label: 'Council' },
  { value: 'GOVERNORSHIP', label: 'Governorship' },
  { value: 'BACENTA', label: 'Bacenta' },
]

const attendanceTypes = [
  { value: 'LEADERS_ONLY', label: 'Leaders Only' },
  { value: 'ALL', label: 'Leaders + All Members' },
]

const allowedRoles = [
  { value: 'leaderBacenta', label: 'Bacenta Leaders' },
  { value: 'leaderCouncil', label: 'Council Leaders' },
  { value: 'leaderStream', label: 'Stream Leaders' },
  { value: 'leaderGovernorship', label: 'Governorship Leaders' },
]

const validationSchema = Yup.object({
  name: Yup.string().required('Event name is required'),
  type: Yup.string().required('Event type is required'),
  scopeLevel: Yup.string().required('Scope level is required'),
  scopeId: Yup.string().required('Please select a scope'),
  startsAt: Yup.string().required('Start time is required'),
  endsAt: Yup.string().required('End time is required'),
  attendanceType: Yup.string().required('Attendance type is required'),
  allowedCheckInRoles: Yup.array()
    .of(Yup.string())
    .min(1, 'Select at least one role for check-in'),
})

const CreateCheckInEvent = () => {
  const navigate = useNavigate()
  const { data: scopesData, loading: scopesLoading } =
    useQuery(GET_ADMIN_SCOPES)
  const [createEvent, { loading, error, data }] =
    useMutation(CREATE_CHECKIN_EVENT)

  const adminScopes = useMemo(
    () => scopesData?.GetAdminScopes ?? [],
    [scopesData]
  )

  const initialValues = {
    name: '',
    type: '',
    description: '',
    location: '',
    scopeLevel: 'CAMPUS',
    scopeId: '',
    startsAt: '',
    endsAt: '',
    gracePeriod: 30,
    attendanceType: 'LEADERS_ONLY',
    allowedCheckInRoles: ['leaderBacenta'],
  }

  return (
    <ApolloWrapper loading={loading || scopesLoading} error={error} data={data}>
      <Container>
        <HeadingPrimary className="mb-3">Create Check-In Event</HeadingPrimary>

        {adminScopes.length === 0 && !scopesLoading && (
          <Card className="p-3 bg-warning mb-3">
            <p className="mb-0">
              You do not have admin permissions for any church scope. Contact
              your administrator.
            </p>
          </Card>
        )}

        <Card className="p-3">
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={(values) =>
              createEvent({
                variables: {
                  input: {
                    ...values,
                    gracePeriod: Number(values.gracePeriod),
                  },
                },
              }).then((res) => {
                const eventId = res.data?.CreateCheckInEvent?.id
                if (eventId) navigate(`/checkins/event/${eventId}`)
              })
            }
          >
            {(formik) => (
              <Form>
                <Row className="g-3">
                  <Col md={6}>
                    <Input name="name" label="Event Name" />
                  </Col>
                  <Col md={6}>
                    <Input name="type" label="Event Type" />
                  </Col>
                  <Col md={12}>
                    <Input name="description" label="Description" />
                  </Col>
                  <Col md={12}>
                    <Input name="location" label="Location" />
                  </Col>
                  <Col md={12}>
                    <label className="form-label">Select Scope *</label>
                    <Field
                      as="select"
                      name="scopeId"
                      className="form-select"
                      onChange={(e: any) => {
                        const selectedScope = adminScopes.find(
                          (s: any) => s.id === e.target.value
                        )
                        formik.setFieldValue('scopeId', e.target.value)
                        if (selectedScope) {
                          formik.setFieldValue(
                            'scopeLevel',
                            selectedScope.level
                          )
                        }
                      }}
                    >
                      <option value="">
                        -- Select a scope to create event for --
                      </option>
                      {adminScopes.map((scope: any) => (
                        <option key={scope.id} value={scope.id}>
                          {scope.name} ({scope.level})
                        </option>
                      ))}
                    </Field>
                    {formik.errors.scopeId && formik.touched.scopeId && (
                      <div className="invalid-feedback d-block">
                        {formik.errors.scopeId as string}
                      </div>
                    )}
                  </Col>
                  <Col md={6}>
                    <label className="form-label">Start Time</label>
                    <Field
                      name="startsAt"
                      type="datetime-local"
                      className="form-control"
                    />
                  </Col>
                  <Col md={6}>
                    <label className="form-label">End Time</label>
                    <Field
                      name="endsAt"
                      type="datetime-local"
                      className="form-control"
                    />
                  </Col>
                  <Col md={6}>
                    <label className="form-label">Grace Period (minutes)</label>
                    <Field
                      name="gracePeriod"
                      type="number"
                      className="form-control"
                    />
                  </Col>
                  <Col md={6}>
                    <label className="form-label">Attendance Type</label>
                    <Field
                      as="select"
                      name="attendanceType"
                      className="form-select"
                    >
                      {attendanceTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </Field>
                  </Col>
                  <Col md={12}>
                    <Card className="p-3 bg-light">
                      <label className="form-label fw-bold mb-3">
                        Who Can Perform Check-Ins?
                      </label>
                      <div className="d-flex flex-wrap gap-3">
                        {allowedRoles.map((role) => (
                          <div key={role.value} className="form-check">
                            <Field
                              type="checkbox"
                              id={role.value}
                              name="allowedCheckInRoles"
                              value={role.value}
                              className="form-check-input"
                            />
                            <label
                              className="form-check-label"
                              htmlFor={role.value}
                            >
                              {role.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      {formik.errors.allowedCheckInRoles && (
                        <div className="invalid-feedback d-block mt-2">
                          {formik.errors.allowedCheckInRoles as string}
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>

                <div className="mt-4">
                  <SubmitButton formik={formik}>
                    <span>Create Event</span>
                  </SubmitButton>
                </div>
              </Form>
            )}
          </Formik>
        </Card>
      </Container>
    </ApolloWrapper>
  )
}

export default CreateCheckInEvent
