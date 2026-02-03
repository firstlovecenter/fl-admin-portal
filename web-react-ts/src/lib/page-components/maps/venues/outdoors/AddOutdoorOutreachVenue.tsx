import { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { CREATE_OUTDOOR_OUTREACH_VENUE_MUTATION } from '../venuesMutations'
import { GET_OUTDOOR_VENUES } from '../venuesQueries'
import { throwToSentry } from 'global-utils'
import * as Yup from 'yup'
import { Formik, FormikHelpers, Form } from 'formik'
import { Button, Col, Container, Row } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'

export interface FormOptions {
  venueName: string
  capacity: string
  longitude: string
  latitude: string
}

const AddIndoorVenue = () => {
  const router = useRouter()
  const { clickCard } = useContext(ChurchContext)
  const [CreateOutdoorVenue] = useMutation(
    CREATE_OUTDOOR_OUTREACH_VENUE_MUTATION,
    { refetchQueries: [{ query: GET_OUTDOOR_VENUES }] }
  )

  const initialValues: FormOptions = {
    venueName: '',
    capacity: '',
    latitude: '',
    longitude: '',
  }
  const validationSchema = Yup.object({
    venueName: Yup.string().required('Venue Name is required'),
    capacity: Yup.number()
      .required('Cannot submit without entering number of seats')
      .integer('Cannot enter decimals')
      .positive(),
    longitude: Yup.number()
      .min(-180, 'Longitude must be greater than or equal to -180')
      .max(180, 'Longitude must be less than or equal to 180')
      .required('Longitude is required')
      .typeError('Please enter a valid longitude'),
    latitude: Yup.number()
      .min(-90, 'Latitude must be greater than or equal to -90')
      .max(90, 'Latitude must be less than or equal to 90')
      .required('Latitude is required')
      .typeError('Please enter a valid longitude'),
  })

  const onSubmit = async (
    { venueName, capacity, longitude, latitude }: FormOptions,
    { setSubmitting }: FormikHelpers<FormOptions>
  ) => {
    setSubmitting(true)
    try {
      const res = await CreateOutdoorVenue({
        variables: {
          name: venueName,
          capacity: parseInt(capacity),
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
        },
      })
      clickCard(res.data.CreateOutdoorVenue)
      router.push(`/maps/outdoor-outreach-venues`)
    } catch (err) {
      setSubmitting(false)
      throwToSentry('', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Container>
      <HeadingPrimary className="d-flex justify-content-center mb-5">
        Add Outdoor Outreach Venue
      </HeadingPrimary>

      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={validationSchema}
      >
        {(formik) => (
          <Form className="form-group">
            <Row>
              <Col className="mb-3">
                <small className="form-text label">Venue Name</small>
                <Input
                  name="venueName"
                  className="form-control"
                  placeholder="Enter name of venue"
                />
              </Col>
            </Row>
            <Row>
              <Col className="mb-3">
                <small className="form-text label">Capacity</small>
                <Input
                  name="capacity"
                  className="form-control"
                  placeholder="Enter number of seats"
                />
              </Col>
            </Row>
            <Row>
              <Col>
                <small className="form-text label">Location</small>
                <Input
                  name="latitude"
                  className="form-control"
                  placeholder="Latitude"
                />
              </Col>
            </Row>
            <Row className="mb-4">
              <Col>
                <Input
                  name="longitude"
                  className="form-control"
                  placeholder="Longitude"
                />
              </Col>
            </Row>
            <div className="d-grid gap-2">
              <SubmitButton formik={formik}>
                <span>Save</span>
              </SubmitButton>
              <Button
                variant="danger"
                className="w-100 fs-5"
                onClick={() => {
                  router.push(`/maps/outdoor-outreach-venues`)
                }}
              >
                Cancel
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </Container>
  )
}

export default AddIndoorVenue
