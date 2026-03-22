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
import GeoFencePicker, { GeoPoint } from './GeoFencePicker'

const scopeLevels = [
  { value: 'OVERSIGHT', label: 'Oversight' },
  { value: 'CAMPUS', label: 'Campus' },
  { value: 'STREAM', label: 'Stream' },
  { value: 'COUNCIL', label: 'Council' },
  { value: 'GOVERNORSHIP', label: 'Governorship' },
  { value: 'BACENTA', label: 'Bacenta' },
]

const allRoles = [
  { value: 'leaderCampus', label: 'Campus Leaders', depth: 4 },
  { value: 'leaderStream', label: 'Stream Leaders', depth: 3 },
  { value: 'leaderCouncil', label: 'Council Leaders', depth: 2 },
  { value: 'leaderGovernorship', label: 'Governorship Leaders', depth: 1 },
  { value: 'leaderBacenta', label: 'Bacenta Leaders', depth: 0 },
]

const scopeDepthMap: Record<string, number> = {
  OVERSIGHT: 5,
  CAMPUS: 4,
  STREAM: 3,
  COUNCIL: 2,
  GOVERNORSHIP: 1,
  BACENTA: 0,
}

const checkInMethods = [
  { value: 'QR', label: 'QR Code Scan' },
  { value: 'PIN', label: 'PIN Code Entry' },
  { value: 'FACE_ID', label: 'Face ID Recognition' },
]

const validationSchema = Yup.object({
  name: Yup.string().required('Event name is required'),
  scopeLevel: Yup.string().required('Scope level is required'),
  scopeId: Yup.string().required('Please select a scope'),
  startsAt: Yup.string().required('Start time is required'),
  endsAt: Yup.string().required('End time is required'),
  allowedCheckInRoles: Yup.array()
    .of(Yup.string())
    .min(1, 'Select at least one role for check-in'),
  allowedCheckInMethods: Yup.array()
    .of(Yup.string())
    .min(1, 'Select at least one check-in method'),
  geoFenceType: Yup.string().required('Geofence type is required'),
})

const CreateCheckInEvent = () => {
  const navigate = useNavigate()
  const { data: scopesData, loading: scopesLoading, error: scopesError } =
    useQuery(GET_ADMIN_SCOPES)
  const [createEvent, { loading }] =
    useMutation(CREATE_CHECKIN_EVENT)

  const adminScopes = useMemo(
    () => scopesData?.GetAdminScopes ?? [],
    [scopesData]
  )

  const initialValues = {
    name: '',
    location: '',
    scopeLevel: 'CAMPUS',
    scopeId: '',
    startsAt: '',
    endsAt: '',
    gracePeriod: 30,
    attendanceType: 'LEADERS_ONLY' as 'LEADERS_ONLY' | 'ALL_MEMBERS',
    allowedCheckInRoles: ['leaderBacenta'],
    allowedCheckInMethods: ['QR'] as string[],
    // Geo-fence (required)
    geoFenceType: 'CIRCLE' as 'CIRCLE' | 'POLYGON',
    geoCenter: null as GeoPoint | null,
    geoRadius: 200,
    geoPolygon: [] as GeoPoint[],
    // Auto-checkout
    autoCheckoutMinutes: 30,
  }

  return (
    <ApolloWrapper loading={scopesLoading} error={scopesError} data={scopesData}>
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
                    autoCheckoutMinutes: Number(values.autoCheckoutMinutes),
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
                <Card className="p-3 mb-3">
                  <label className="form-label fw-bold mb-2">Attendance Type</label>
                  <div className="d-flex flex-column gap-2">
                    <div className="form-check">
                      <Field
                        type="radio"
                        id="leadersOnly"
                        name="attendanceType"
                        value="LEADERS_ONLY"
                        className="form-check-input"
                      />
                      <label className="form-check-label" htmlFor="leadersOnly">
                        <strong>Leaders Only</strong> — only leaders & admins in the
                        scope are expected to check in
                      </label>
                    </div>
                    <div className="form-check">
                      <Field
                        type="radio"
                        id="allMembers"
                        name="attendanceType"
                        value="ALL_MEMBERS"
                        className="form-check-input"
                      />
                      <label className="form-check-label" htmlFor="allMembers">
                        <strong>All Members</strong> — every member in the scope is
                        expected to check in
                      </label>
                    </div>
                  </div>
                </Card>
                <Row className="g-3">
                  <Col md={12}>
                    <Input name="name" label="Event Name" />
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
                          // Reset roles to only include valid ones for this scope
                          const maxDepth =
                            scopeDepthMap[selectedScope.level] ?? 5
                          const validRoles = formik.values.allowedCheckInRoles.filter(
                            (r: string) => {
                              const role = allRoles.find((ar) => ar.value === r)
                              return role && role.depth <= maxDepth
                            }
                          )
                          formik.setFieldValue(
                            'allowedCheckInRoles',
                            validRoles.length > 0 ? validRoles : ['leaderBacenta']
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
                  <Col md={4}>
                    <label className="form-label">Grace Period (minutes)</label>
                    <Field
                      name="gracePeriod"
                      type="number"
                      className="form-control"
                    />
                  </Col>
                  <Col md={4}>
                    <label className="form-label">Auto-Checkout (minutes outside geofence)</label>
                    <Field
                      name="autoCheckoutMinutes"
                      type="number"
                      className="form-control"
                      min={5}
                    />
                    <small className="text-muted">
                      Leaders will be auto-checked out after this many minutes outside the geofence
                    </small>
                  </Col>
                  <Col md={12}>
                    <Card className="p-3">
                      <label className="form-label fw-bold mb-3">
                        Who Can Perform Check-Ins?
                      </label>
                      <div className="d-flex flex-wrap gap-3">
                        {allRoles
                          .filter(
                            (role) =>
                              role.depth <=
                              (scopeDepthMap[formik.values.scopeLevel] ?? 5)
                          )
                          .map((role) => (
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

                  {/* Check-In Methods Selection */}
                  <Col md={12}>
                    <Card className="p-3">
                      <label className="form-label fw-bold mb-2">
                        Check-In Methods *
                      </label>
                      <small className="text-muted d-block mb-3">
                        Select which verification method(s) leaders must use to check in.
                        At least one is required.
                      </small>
                      <div className="d-flex flex-wrap gap-3">
                        {checkInMethods.map((method) => (
                          <div key={method.value} className="form-check">
                            <Field
                              type="checkbox"
                              id={`method-${method.value}`}
                              name="allowedCheckInMethods"
                              value={method.value}
                              className="form-check-input"
                            />
                            <label
                              className="form-check-label"
                              htmlFor={`method-${method.value}`}
                            >
                              {method.value === 'QR' && ''}
                              {method.value === 'PIN' && ''}
                              {method.value === 'FACE_ID' && ''}
                              {method.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      {formik.errors.allowedCheckInMethods && (
                        <div className="invalid-feedback d-block mt-2">
                          {formik.errors.allowedCheckInMethods as string}
                        </div>
                      )}
                    </Card>
                  </Col>
                </Row>

                {/* Geo-Fence Section (Required) */}
                <div className="mt-3">
                  <Card className="p-3">
                    <label className="form-label fw-bold mb-2">
                      Geofence Configuration (Required)
                    </label>
                    <small className="text-muted d-block mb-3">
                      Leaders must be within this geofence to check in. They will be
                      auto-checked out if they leave the geofence for more than{' '}
                      {formik.values.autoCheckoutMinutes} minutes.
                    </small>
                    <GeoFencePicker
                      enabled={true}
                      fenceType={formik.values.geoFenceType}
                      center={formik.values.geoCenter}
                      radius={formik.values.geoRadius}
                      polygon={formik.values.geoPolygon}
                      onToggle={() => {
                        /* always enabled */
                      }}
                      onFenceTypeChange={(v) =>
                        formik.setFieldValue('geoFenceType', v)
                      }
                      onCenterChange={(v) =>
                        formik.setFieldValue('geoCenter', v)
                      }
                      onRadiusChange={(v) =>
                        formik.setFieldValue('geoRadius', v)
                      }
                      onPolygonChange={(v) =>
                        formik.setFieldValue('geoPolygon', v)
                      }
                    />
                  </Card>
                </div>

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
