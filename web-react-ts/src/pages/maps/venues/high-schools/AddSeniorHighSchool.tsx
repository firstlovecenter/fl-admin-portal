import { useContext } from 'react'
import { ChurchContext } from 'contexts/ChurchContext'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { CREATE_SENIOR_HIGH_SCHOOL_MUTATION } from '../venuesMutations'
import { GET_SENIOR_HIGH_SCHOOLS } from '../venuesQueries'
import { throwToSentry } from 'global-utils'
import * as Yup from 'yup'
import { Formik, FormikHelpers, Form } from 'formik'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import Input from 'components/formik/Input'
import SubmitButton from 'components/formik/SubmitButton'
import { Button } from 'components/ui/button'

export interface FormOptions {
  venueName: string
  capacity: string
  longitude: string
  latitude: string
  school: string
}

const AddSeniorHighSchool = () => {
  const navigate = useNavigate()
  const { clickCard } = useContext(ChurchContext)
  const [CreateHighSchool] = useMutation(CREATE_SENIOR_HIGH_SCHOOL_MUTATION, {
    refetchQueries: [{ query: GET_SENIOR_HIGH_SCHOOLS }],
  })

  const initialValues: FormOptions = {
    venueName: '',
    capacity: '',
    latitude: '',
    longitude: '',
    school: '',
  }

  const validationSchema = Yup.object({
    venueName: Yup.string().required('Venue name is required'),
    school: Yup.string().required('School name is required'),
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
    { venueName, capacity, longitude, latitude, school }: FormOptions,
    { setSubmitting }: FormikHelpers<FormOptions>
  ) => {
    setSubmitting(true)
    try {
      const res = await CreateHighSchool({
        variables: {
          name: venueName,
          capacity: parseInt(capacity),
          longitude: parseFloat(longitude),
          latitude: parseFloat(latitude),
          school,
        },
      })
      clickCard(res.data.CreateHighSchool)
      navigate(`/maps/senior-high-schools`)
    } catch (err) {
      setSubmitting(false)
      throwToSentry('', err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <HeadingPrimary className="d-flex justify-content-center mb-5">
        Add Senior High School
      </HeadingPrimary>

      <Formik
        initialValues={initialValues}
        onSubmit={onSubmit}
        validationSchema={validationSchema}
      >
        {(formik) => (
          <Form className="form-group">
            <div>
              <div className="mb-3">
                <small className="form-text label">Venue Name</small>
                <Input
                  name="venueName"
                  className="form-control"
                  placeholder="Enter name of venue"
                />
              </div>
            </div>
            <div>
              <div className="mb-3">
                <small className="form-text label">Capacity</small>
                <Input
                  name="capacity"
                  className="form-control"
                  placeholder="Enter number of seats"
                />
              </div>
            </div>
            <div>
              <div className="mb-3">
                <small className="form-text label">School</small>
                <Input
                  name="school"
                  className="form-control"
                  placeholder="Enter name of school"
                />
              </div>
            </div>
            <div>
              <div>
                <small className="form-text label">Location</small>
                <Input
                  name="latitude"
                  className="form-control"
                  placeholder="Latitude"
                />
              </div>
            </div>
            <div className="mb-4">
              <div>
                <Input
                  name="longitude"
                  className="form-control"
                  placeholder="Longitude"
                />
              </div>
            </div>
            <div className="d-grid gap-2">
              <SubmitButton formik={formik}>
                <span>Save</span>
              </SubmitButton>
              <Button
                variant="destructive"
                className="w-100 fs-5"
                onClick={() => {
                  navigate(`/maps/senior-high-schools`)
                }}
              >
                Cancel
              </Button>
            </div>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default AddSeniorHighSchool
