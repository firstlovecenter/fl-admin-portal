import MinusSign from 'components/buttons/PlusMinusSign/MinusSign'
import PlusSign from 'components/buttons/PlusMinusSign/PlusSign'
import {
  FieldArray,
  FieldArrayRenderProps,
  Form,
  Formik,
  FormikHelpers,
} from 'formik'
import * as Yup from 'yup'
import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { Col, Container, Row } from 'react-bootstrap'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import SubmitButton from 'components/formik/SubmitButton'
import {
  checkIfArrayHasRepeatingValues,
  parseForeignCurrency,
  throwToSentry,
} from 'global-utils'
import { getMondayThisWeek } from 'jd-date-utils'
import { ChurchContext } from 'contexts/ChurchContext'
import { Church, ChurchLevel } from 'global-types'
import { MutationFunction } from '@apollo/client'
import Input from 'components/formik/Input'
import ImageUpload from 'components/formik/ImageUpload'
import { MemberContext } from 'contexts/MemberContext'
import SearchMember from 'components/formik/SearchMember'
import Textarea from 'components/formik/Textarea'

type ServiceFormProps = {
  church: Church
  churchId: string
  churchType: ChurchLevel
  recordType?: 'ServiceRecord'
  event?: string
  RecordServiceMutation: MutationFunction
}

type FormOptions = {
  serviceDate: string
  cediIncome: string
  foreignCurrency: string
  numberOfTithers: string
  attendance: string
  treasurers: string[]
  treasurerSelfie: string
  familyPicture: string
  serviceName: string
  serviceDescription: string
}

const SpecialServiceForm = ({
  church,
  churchId,
  churchType,
  event,
  RecordServiceMutation,
  recordType,
}: ServiceFormProps) => {
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const router = useRouter()

  const initialValues: FormOptions = {
    serviceDate: new Date().toISOString().slice(0, 10),
    cediIncome: '',
    foreignCurrency: '',
    numberOfTithers: '',
    attendance: '',
    treasurers: [''],
    treasurerSelfie: '',
    familyPicture: '',
    serviceName: '',
    serviceDescription: '',
  }

  const todayStartOfDay = new Date()
  const lastWeek = new Date()
  lastWeek.setDate(lastWeek.getDate() - 7)

  const validationSchema = Yup.object({
    serviceName: Yup.string().required('Service name is a required field'),
    serviceDescription: Yup.string().required(
      'Service description is a required field'
    ),
    serviceDate: Yup.date()
      .max(new Date(), 'Service could not possibly have happened after today')
      .min(
        currentUser.roles.includes('fishers')
          ? lastWeek
          : getMondayThisWeek(todayStartOfDay),
        'You can only fill forms for this week'
      )
      .required('Date is a required field'),
    cediIncome: Yup.number()
      .typeError('Please enter a valid number')
      .positive('You cannot have negative income')
      .required('You cannot submit this form without entering your income'),
    foreignCurrency: Yup.string(),
    numberOfTithers: Yup.number()
      .typeError('Please enter a valid number')
      .integer('You cannot enter decimals here')
      .required(
        'You cannot submit this form without entering your number of tithers'
      ),
    attendance: Yup.number()
      .typeError('Please enter a valid number')
      .positive()
      .integer('You cannot have attendance with decimals!')
      .required('You cannot submit this form without entering your attendance'),
    treasurerSelfie: Yup.string().required('You must take a treasurers selfie'),
    familyPicture: Yup.string().required(
      'Please submit a picture of your service'
    ),
    treasurers: Yup.array()
      .min(2, 'You must have at least two treasurers')
      .of(Yup.string().required('Please pick a name from the dropdown')),
  })

  const onSubmit = async (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    const { setSubmitting } = onSubmitProps
    setSubmitting(true)
    if (checkIfArrayHasRepeatingValues(values.treasurers)) {
      throwToSentry('You cannot choose the same treasurer twice!')
      setSubmitting(false)
      return
    } else {
      try {
        const res = await RecordServiceMutation({
          variables: {
            ...values,
            churchId,
            attendance: parseInt(values.attendance),
            income: parseFloat(values.cediIncome),
            foreignCurrency: parseForeignCurrency(values.foreignCurrency),
            numberOfTithers: parseInt(values.numberOfTithers),
          },
        })

        clickCard(res.data?.RecordSpecialService)
        router.push(`/${churchType.toLowerCase()}/service-details`)
      } catch (error) {
        setSubmitting(false)
        throwToSentry('', error)
      } finally {
        setSubmitting(false)
      }
    }
  }

  return (
    <Formik
      initialValues={initialValues}
      validationSchema={validationSchema}
      onSubmit={onSubmit}
      validateOnMount
    >
      {(formik) => (
        <Container>
          <HeadingPrimary>Record Your Special Service Details</HeadingPrimary>
          <h5 className="text-secondary">{`${church?.name} ${church?.__typename}`}</h5>

          <Form className="form-group">
            <Row className="row-cols-1 row-cols-md-2">
              {/* <!-- Service Form--> */}
              <Col className="mb-2">
                <div className="form-row d-flex justify-content-center">
                  <Col>
                    <hr />
                    <Input
                      name="serviceName"
                      label="Service Name*"
                      placeholder="e.g. Tsalach Night"
                    />
                    <Textarea
                      name="serviceDescription"
                      label="Service Description*"
                      placeholder="eg. It was a watchnight service for the year 2023"
                      rows={3}
                    />
                    <hr />
                    <small className="form-text label">
                      Date of Service*
                      <i className="text-secondary">(Day/Month/Year)</i>
                    </small>
                    <Input
                      name="serviceDate"
                      type="date"
                      placeholder="dd/mm/yyyy"
                      aria-describedby="dateofservice"
                    />
                    <Input name="attendance" label="Attendance*" />
                    <Input
                      name="cediIncome"
                      label={`Income (in ${currentUser.currency})*`}
                    />
                    <Textarea
                      name="foreignCurrency"
                      label="Foreign Currency (if any) (Optional)"
                      rows={2}
                    />
                    <Input name="numberOfTithers" label="Number of Tithers*" />
                    <small className="label">Treasurers (minimum of 2)</small>
                    <FieldArray name="treasurers">
                      {(fieldArrayProps: FieldArrayRenderProps) => {
                        const { push, remove, form } = fieldArrayProps
                        const { values } = form
                        const { treasurers }: { treasurers: string[] } = values

                        return (
                          <>
                            {treasurers.map((treasurer, index) => (
                              <Row key={index} className="form-row">
                                <Col>
                                  <SearchMember
                                    name={`treasurers[${index}]`}
                                    placeholder="Start typing"
                                    setFieldValue={formik.setFieldValue}
                                    creativeArts={[
                                      'CreativeArts',
                                      'Ministry',
                                      'HubCouncil',
                                      'Hub',
                                    ].includes(churchType)}
                                    aria-describedby="Member List"
                                    error={
                                      !Array.isArray(formik.errors.treasurers)
                                        ? formik.errors.treasurers
                                        : formik.errors.treasurers &&
                                          formik.errors.treasurers[index]
                                    }
                                  />
                                </Col>

                                <Col className="col-auto d-flex">
                                  <PlusSign onClick={() => push('')} />
                                  {index > 0 && (
                                    <MinusSign onClick={() => remove(index)} />
                                  )}
                                </Col>
                              </Row>
                            ))}
                          </>
                        )
                      }}
                    </FieldArray>
                    <Col className="my-2 mt-2">
                      <small>Upload Treasurer Selfie*</small>
                      <ImageUpload
                        name="treasurerSelfie"
                        uploadPreset={
                          process.env.NEXT_PUBLIC_CLOUDINARY_TREASURERS
                        }
                        tags="facial-recognition"
                        placeholder="Choose"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="ImageUpload"
                      />
                    </Col>
                    <Col className="my-2">
                      <small className="mb-3">
                        Upload Your Family Picture*
                      </small>
                      <ImageUpload
                        name="familyPicture"
                        uploadPreset={
                          process.env.NEXT_PUBLIC_CLOUDINARY_SERVICES
                        }
                        placeholder="Choose"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="UploadfamilyPicture"
                      />
                    </Col>
                    <div className="d-flex justify-content-center mt-3">
                      <SubmitButton formik={formik} />
                    </div>
                  </Col>
                </div>
              </Col>
            </Row>
          </Form>
        </Container>
      )}
    </Formik>
  )
}

export default SpecialServiceForm
