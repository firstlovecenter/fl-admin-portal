import SubmitButton from 'components/formik/SubmitButton'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import HeadingSecondary from 'components/HeadingSecondary'
import { Form, Formik, FormikHelpers } from 'formik'
import { useMutation, useQuery } from '@apollo/client'
import { useContext } from 'react'
import * as Yup from 'yup'
import { Card, Col, Container, Row } from 'react-bootstrap'
import { useNavigate } from 'react-router'
import { BACENTA_ARRIVALS } from '../arrivalsQueries'
import { ChurchContext } from 'contexts/ChurchContext'
import ApolloWrapper from 'components/base-component/ApolloWrapper'
import { RECORD_BUSSING_FROM_BACENTA } from '../arrivalsMutation'
import { parseDate } from 'jd-date-utils'
import { ServiceContext } from 'contexts/ServiceContext'
import { throwToSentry } from 'global-utils'
import Input from 'components/formik/Input'
import Select from 'components/formik/Select'
import { VEHICLE_OPTIONS_WITH_CAR } from '../arrivals-utils'
import ImageUpload from 'components/formik/ImageUpload'
import { BacentaWithArrivals } from '../arrivals-types'

type FormOptions = {
  leaderDeclaration: string
  vehicle: string
  picture: string
}

const FormAddVehicleRecord = () => {
  const navigate = useNavigate()
  const { bacentaId, clickCard } = useContext(ChurchContext)
  const { bussingRecordId } = useContext(ServiceContext)

  const { data, loading, error } = useQuery(BACENTA_ARRIVALS, {
    variables: { id: bacentaId, date: new Date().toISOString().slice(0, 10) },
  })
  const bacenta: BacentaWithArrivals = data?.bacentas[0]

  const initialValues: FormOptions = {
    leaderDeclaration: '',
    vehicle: '',
    picture: '',
  }

  const [RecordVehicleFromBacenta] = useMutation(RECORD_BUSSING_FROM_BACENTA)
  const validationSchema = Yup.object({
    leaderDeclaration: Yup.number()
      .typeError('Please enter a valid number')
      .positive()
      .integer('You cannot have attendance with decimals!')
      .required('This is a required field'),
    vehicle: Yup.string().required('This is a required field'),
    picture: Yup.string().required('This is a required field'),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      const res = await RecordVehicleFromBacenta({
        variables: {
          bacentaId,
          leaderDeclaration: parseInt(values.leaderDeclaration),
          bussingRecordId: bussingRecordId,
          vehicle: values.vehicle,
          picture: values.picture,
        },
      })

      clickCard(res.data.RecordVehicleFromBacenta)

      onSubmitProps.resetForm()
      onSubmitProps.setSubmitting(false)
      navigate(`/bacenta/vehicle-details`)
    } catch (error: any) {
      throwToSentry('There was a problem submitting your form', error)
    }
  }

  return (
    <ApolloWrapper data={data} loading={loading} error={error}>
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
      >
        {(formik) => (
          <Container>
            <HeadingPrimary loading={loading}>
              Record Bussing Data
            </HeadingPrimary>
            <HeadingSecondary loading={loading}>
              {bacenta?.name} Bacenta
            </HeadingSecondary>
            <HeadingSecondary loading={loading}>
              Code of The Day:{' '}
            </HeadingSecondary>
            <HeadingPrimary className="fw-bold">
              {bacenta?.arrivalsCodeOfTheDay}
            </HeadingPrimary>

            <Form>
              <Row className="row-cols-1 row-cols-md-2 mt-2">
                <Col className="mb-2">
                  <small className="form-text label">Date of Service</small>
                  <HeadingPrimary>
                    {parseDate(bacenta?.bussing[0].serviceDate.date.toString())}
                  </HeadingPrimary>

                  <Input name="leaderDeclaration" label="Attendance*" />
                  <Select
                    name="vehicle"
                    label="Type of Vehicle"
                    options={VEHICLE_OPTIONS_WITH_CAR}
                    defaultOption="Select a vehicle type"
                  />
                </Col>

                <ImageUpload
                  label="Upload A Bussing Picture"
                  name="picture"
                  uploadPreset={import.meta.env.VITE_CLOUDINARY_BUSSING}
                  placeholder="Choose"
                  setFieldValue={formik.setFieldValue}
                  aria-describedby="UploadBussingPicture"
                />
              </Row>

              <Row>
                <Container>
                  <Card className="text-center mt-3 p-2">
                    <Card.Body>
                      I can confirm that the above data is correct and I am
                      cursed if I do the work of the Lord deceitfully
                    </Card.Body>
                    <Card.Footer>
                      <SubmitButton formik={formik} />
                    </Card.Footer>
                  </Card>
                </Container>
              </Row>
            </Form>
          </Container>
        )}
      </Formik>
    </ApolloWrapper>
  )
}

export default FormAddVehicleRecord
