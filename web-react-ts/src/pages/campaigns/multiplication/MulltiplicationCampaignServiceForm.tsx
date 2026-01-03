import {
  FieldArray,
  FieldArrayRenderProps,
  Form,
  Formik,
  FormikHelpers,
} from 'formik'
import * as Yup from 'yup'
import React, { useContext } from 'react'
import { useNavigate } from 'react-router'
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
import SearchMember from 'components/formik/SearchMember'
import MinusSign from 'components/buttons/PlusMinusSign/MinusSign'
import PlusSign from 'components/buttons/PlusMinusSign/PlusSign'
import MultiImageUpload from 'components/formik/MultiImageUpload'
import { MemberContext } from 'contexts/MemberContext'

type ServiceFormProps = {
  church: Church
  churchId: string
  churchType: ChurchLevel
  RecordServiceMutation: MutationFunction
}

type FormOptions = {
  crusadeDate: string
  preacher: string
  crusadeLocation: string
  attendance: string
  cediIncome: string
  foreignCurrency: string
  souls: string
  miracles: string
  crusadePictures: string[]
  treasurers: string[]
  treasurerSelfie: string
}

const MultiplicationCampaignServiceForm = ({
  church,
  churchId,
  churchType,
  RecordServiceMutation,
}: ServiceFormProps) => {
  const { clickCard } = useContext(ChurchContext)
  const { currentUser } = useContext(MemberContext)
  const navigate = useNavigate()

  const initialValues: FormOptions = {
    crusadeDate: new Date().toISOString().slice(0, 10),
    preacher: '',
    crusadeLocation: '',
    attendance: '',
    cediIncome: '',
    foreignCurrency: '',
    souls: '',
    miracles: '',
    crusadePictures: [''],
    treasurers: [''],
    treasurerSelfie: '',
  }

  const today = new Date()

  const validationSchema = Yup.object({
    crusadeDate: Yup.date()
      .max(new Date(), 'Service could not possibly have happened after today')
      .min(getMondayThisWeek(today), 'You can only fill forms for this week')
      .required('Date is a required field'),
    preacher: Yup.string().required('Please pick a name from the dropdown'),
    crusadeLocation: Yup.string().required(
      'You cannot submit this form without entering the location of crusade'
    ),
    attendance: Yup.number()
      .typeError('Please enter a valid number')
      .positive()
      .integer('You cannot have attendance with decimals!')
      .required('You cannot submit this form without entering your attendance'),
    cediIncome: Yup.number()
      .typeError('Please enter a valid number')
      .positive()
      .required('You cannot submit this form without entering your income'),
    foreignCurrency: Yup.string(),
    souls: Yup.number()
      .typeError('Please enter a valid number')
      .integer('You cannot enter decimals here')
      .required(
        'You cannot submit this form without entering your number of souls won'
      ),
    miracles: Yup.number()
      .typeError('Please enter a valid number')
      .integer('You cannot enter decimals here')
      .required(
        'You cannot submit this form without entering your number of miracles'
      ),
    crusadePictures: Yup.array()
      .min(10, 'You must have at least 10 event pictures')
      .of(Yup.string().required('You must have at least 10 event pictures')),
    treasurerSelfie: Yup.string().required('You must take a treasurers selfie'),
    treasurers: Yup.array()
      .min(2, 'You must have at least two treasurers')
      .of(Yup.string().required('Please pick a name from the dropdown')),
  })

  const onSubmit = (
    values: FormOptions,
    onSubmitProps: FormikHelpers<FormOptions>
  ) => {
    if (checkIfArrayHasRepeatingValues(values.treasurers)) {
      throwToSentry('You cannot choose the same treasurer twice!')
      onSubmitProps.setSubmitting(false)
      return
    } else {
      onSubmitProps.setSubmitting(true)
      RecordServiceMutation({
        variables: {
          churchId: churchId,
          crusadeDate: values.crusadeDate,
          preacherId: values?.preacher,
          crusadeLocation: values?.crusadeLocation,
          attendance: parseInt(values.attendance),
          income: parseFloat(values.cediIncome),
          foreignCurrency: parseForeignCurrency(values.foreignCurrency),
          souls: parseInt(values.souls),
          treasurers: values?.treasurers,
          treasurerSelfie: values?.treasurerSelfie,
          miracles: parseInt(values.miracles),
          crusadePictures: values.crusadePictures,
        },
      })
        .then((res) => {
          onSubmitProps.setSubmitting(false)
          onSubmitProps.resetForm()
          clickCard(res.data.RecordMultiplicationEvent)
          navigate(
            `/campaigns/${churchType.toLowerCase()}/multiplication/service-details`
          )
        })
        .catch((error) => {
          onSubmitProps.setSubmitting(false)
          throwToSentry('', error)
        })
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
          <HeadingPrimary>Record Your Multiplication Event</HeadingPrimary>
          <h5 className="text-secondary">{`${church?.name} ${church?.__typename}`}</h5>

          <Form className="form-group">
            <Row className="row-cols-1 row-cols-md-2">
              {/* <!-- Campaign Service Form--> */}
              <Col className="mb-2">
                <div className="form-row justify-content-center">
                  <Col>
                    <small className="form-text label">
                      Date of Crusade*
                      <i className="text-secondary">(Day/Month/Year)</i>
                    </small>
                    <Input
                      name="crusadeDate"
                      type="date"
                      placeholder="dd/mm/yyyy"
                      aria-describedby="dateofscrusade"
                    />
                    <small className="label">Name of Preacher</small>
                    <Col>
                      <SearchMember
                        name="preacher"
                        placeholder="Start typing"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Member List"
                        error={formik.errors.preacher}
                      />
                    </Col>

                    <Input
                      name="crusadeLocation"
                      label="Location Of Crusade*"
                    />
                    <Input name="attendance" label="Attendance*" />
                    <Input
                      name="cediIncome"
                      label={`Income (in ${currentUser.currency})*`}
                    />
                    <Input
                      name="foreignCurrency"
                      label="Foreign Currency (if any) (Optional)"
                    />
                    <Input name="souls" label="Number of Souls Won*" />
                    <Input name="miracles" label="Number of Miracles*" />
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

                    <Col className="my-2 mt-5">
                      <small>Upload Treasurer Selfie*</small>
                      <ImageUpload
                        name="treasurerSelfie"
                        uploadPreset={
                          import.meta.env.VITE_CLOUDINARY_TREASURERS
                        }
                        tags="facial-recognition"
                        placeholder="Choose"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="ImageUpload"
                      />
                    </Col>

                    <Col className="my-2 mt-5">
                      <small className="mb-3">
                        Upload 10 Pictures Of Crusade Event*
                      </small>

                      <Col>
                        <MultiImageUpload
                          name="crusadePictures"
                          uploadPreset={
                            process.env
                              .REACT_APP_CLOUDINARY_MULTIPLICATION_SERVICES
                          }
                          placeholder="Choose"
                          setFieldValue={formik.setFieldValue}
                          aria-describedby="UploadcrusadePicture"
                          error={formik.errors.crusadePictures}
                        />
                      </Col>
                    </Col>
                    <div className="d-flex justify-content-center mt-5">
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

export default MultiplicationCampaignServiceForm
