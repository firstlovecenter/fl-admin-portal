import { useMutation, useQuery } from '@apollo/client'
import { Form, Formik, FormikHelpers } from 'formik'
import * as Yup from 'yup'
import React, { useContext } from 'react'
import {
  alertMsg,
  DELETE_MEMBER_CATEGORY_OPTIONS,
  GENDER_OPTIONS,
  isAuthorised,
  makeSelectOptions,
  MARITAL_STATUS_OPTIONS,
  PHONE_NUM_REGEX,
  throwToSentry,
} from 'global-utils'
import { GET_CAMPUS_BASONTAS } from 'queries/ListQueries'
import ErrorScreen from 'components/base-component/ErrorScreen'
import { HeadingPrimary } from 'components/HeadingPrimary/HeadingPrimary'
import { Button, ButtonGroup, Col, Container, Row } from 'react-bootstrap'
import LoadingScreen from 'components/base-component/LoadingScreen'
import { permitAdmin, permitLeaderAdmin } from 'permission-utils'
import SubmitButton from 'components/formik/SubmitButton'
import { MemberContext } from 'contexts/MemberContext'
import { CreateMemberFormOptions } from '../create/CreateMember'
import Input from 'components/formik/Input'
import ImageUpload from 'components/formik/ImageUpload'
import Select from 'components/formik/Select'
import { ChurchContext } from 'contexts/ChurchContext'
import { MAKE_MEMBER_INACTIVE } from '../update/UpdateMutations'
import usePopup from 'hooks/usePopup'
import Popup from 'components/Popup/Popup'
import { useRouter } from 'next/navigation'
import RoleView from 'auth/RoleView'
import RadioButtons from 'components/formik/RadioButtons'
import SearchBacenta from 'components/formik/SearchBacenta'

type MemberFormProps = {
  initialValues: CreateMemberFormOptions
  onSubmit: (
    values: CreateMemberFormOptions,
    onSubmitProps: FormikHelpers<CreateMemberFormOptions>
  ) => void
  title: string
  loading: boolean
  update?: boolean
}

type DeleteMemberProp = {
  reason: string
  reasonCategory: string
}

const MemberForm = ({
  initialValues,
  onSubmit,
  title,
  loading,
  update,
}: MemberFormProps) => {
  const { currentUser, memberId } = useContext(MemberContext)
  const { campusId, clickCard } = useContext(ChurchContext)
  const {
    data: basontasData,
    loading: basontasLoading,
    error: basontasError,
  } = useQuery(GET_CAMPUS_BASONTAS, {
    variables: {
      id: campusId,
    },
  })

  const [MakeMemberInactive] = useMutation(MAKE_MEMBER_INACTIVE)
  const { isOpen, togglePopup } = usePopup()

  const router = useRouter()

  const deleteValidationSchema = Yup.object({
    reasonCategory: Yup.string().required(),
    reason: Yup.string().required(
      "Please provide the reason you're deleting this member"
    ),
  })

  const reasonInitialValues: DeleteMemberProp = {
    reason: '',
    reasonCategory: '',
  }

  const onDelete = async (
    values: DeleteMemberProp,
    onSubmitProps: FormikHelpers<DeleteMemberProp>
  ) => {
    const { setSubmitting } = onSubmitProps

    setSubmitting(true)
    try {
      await MakeMemberInactive({
        variables: {
          memberId: memberId,
          reason: `${initialValues.firstName} ${initialValues.lastName} was deleted: ${values.reasonCategory} - ${values.reason}`,
        },
      })

      clickCard({
        __typename: 'Bacenta',
        id: initialValues.bacenta.id,
      })

      togglePopup()
      alertMsg('Member has been deleted successfully')
      router.push('/bacenta/displaydetails')
    } catch (e) {
      throwToSentry('Cannot delete member', e)
    } finally {
      setSubmitting(false)
    }
  }

  const canChangeUniques = () => {
    if (!update) {
      return true
    }
    if (
      update &&
      isAuthorised(permitAdmin('Governorship'), currentUser.roles)
    ) {
      return true
    }

    return false
  }

  const validationSchema = Yup.object({
    pictureUrl: Yup.string().required('You must upload a picture'),
    firstName: Yup.string().required('First Name is a required field'),
    lastName: Yup.string().required('Last Name is a required field'),
    gender: Yup.string().required('Gender is a required field'),
    email: Yup.string().email('Please enter a valid email address').trim(),
    maritalStatus: Yup.string().required('Marital Status is a required field'),
    dob: Yup.date()
      .max(new Date(), "You can't be born after today")
      .required('Date of Birth is a required field'),
    phoneNumber: Yup.string()
      .matches(
        PHONE_NUM_REGEX,
        `Phone Number must start with + and country code (eg. '+233')`
      )
      .required('Phone Number is required'),
    whatsappNumber: Yup.string()
      .required('Whatsapp Number is required')
      .matches(
        PHONE_NUM_REGEX,
        `Phone Number must start with + and country code (eg. '+233')`
      ),
    visitationArea: Yup.string().required('Location is a required field'),
    bacenta: Yup.object().required('Please pick a bacenta from the dropdown'),
  })

  if (basontasLoading || loading) {
    return <LoadingScreen />
  } else if (basontasData) {
    const basontaArray =
      makeSelectOptions(basontasData.campuses[0]?.basontas) || []
    const basontaOptions = [{ key: 'None', value: 'None' }, ...basontaArray]

    return (
      <Formik
        initialValues={initialValues}
        validationSchema={validationSchema}
        onSubmit={onSubmit}
        validateOnMount
      >
        {(formik) => (
          <Container>
            {isOpen && (
              <Popup handleClose={togglePopup}>
                <b>Deleting A Member</b>
                <p>
                  Are you sure you want to delete this member? Please enter your
                  reason below
                </p>
                <Formik
                  initialValues={reasonInitialValues}
                  validationSchema={deleteValidationSchema}
                  onSubmit={onDelete}
                >
                  {(formik) => (
                    <Form>
                      <Row className="form-row">
                        <Col>
                          <RadioButtons
                            name="reasonCategory"
                            options={DELETE_MEMBER_CATEGORY_OPTIONS}
                          />
                          <Input name="reason" placeholder="Reason" />
                          <SubmitButton formik={formik} />
                        </Col>
                      </Row>
                    </Form>
                  )}
                </Formik>
              </Popup>
            )}
            <h3 className="my-3 text-center">{title}</h3>
            <Form className="form-group">
              <Row className="row-cols-1">
                {/* <!-- Basic Info Div --> */}
                {/* Photo Upload with Cloudinary */}
                <Col className="my-3">
                  <ImageUpload
                    name="pictureUrl"
                    initialValue={initialValues.pictureUrl}
                    error={formik.errors.pictureUrl}
                    uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_MEMBERS}
                    placeholder="Upload New Picture"
                    setFieldValue={formik.setFieldValue}
                    aria-describedby="ImageUpload"
                  />
                  <p className="text-center text-danger">
                    <small>
                      Please note that * are required to submit the form
                    </small>
                  </p>

                  <div className="form-row row-cols-1 row-cols-md-2 justify-content-center">
                    <HeadingPrimary>Basic Info</HeadingPrimary>
                    <ButtonGroup className="my-2 mb-4">
                      {update && (
                        <>
                          {' '}
                          <RoleView roles={permitAdmin('Denomination')}>
                            <Button
                              variant="success"
                              onClick={() => router.push('/member/title-form')}
                            >
                              Add Title
                            </Button>
                          </RoleView>
                          <RoleView roles={permitLeaderAdmin('Governorship')}>
                            <Button
                              onClick={() => togglePopup()}
                              variant="danger"
                            >
                              Delete Member
                            </Button>
                          </RoleView>
                        </>
                      )}
                    </ButtonGroup>
                    {canChangeUniques() && (
                      <>
                        <Col sm={10}>
                          <Input
                            label="First Name*"
                            name="firstName"
                            placeholder="First Name"
                            aria-describedby="firstNameHelp"
                          />
                        </Col>
                        <Col sm={10}>
                          <Input
                            label="Middle Name"
                            name="middleName"
                            placeholder="Other Names"
                            aria-describedby="middleNameHelp"
                          />
                        </Col>
                        <Col sm={10}>
                          <Input
                            label="Last Name*"
                            name="lastName"
                            placeholder="Last Name"
                            aria-describedby="lastNameHelp"
                          />
                        </Col>
                        <Col sm={10}>
                          <Select
                            label="Gender*"
                            name="gender"
                            placeholder="Gender"
                            options={GENDER_OPTIONS}
                            defaultOption="Gender"
                          />
                        </Col>{' '}
                        <Col sm={10}>
                          <Input
                            label="Phone Number*"
                            placeholder="Eg. +233 241 23 456"
                            name="phoneNumber"
                          />
                        </Col>
                        <Col sm={10}>
                          <Input
                            label="WhatsApp Number*"
                            placeholder="Eg. +233 241 23 456"
                            name="whatsappNumber"
                          />
                        </Col>
                      </>
                    )}
                  </div>

                  <div className="form-row row-cols-1 row-cols-md-2 justify-content-center">
                    <Col sm={10}>
                      <Select
                        label="Marital Status*"
                        name="maritalStatus"
                        placeholder="Marital Status"
                        options={MARITAL_STATUS_OPTIONS}
                        defaultOption="Marital Status"
                      />
                    </Col>
                    <Col sm={10}>
                      <Input
                        label="Occupation"
                        name="occupation"
                        placeholder="Occupation"
                        aria-describedby="occupationHelp"
                      />
                    </Col>
                  </div>

                  <div className="form-row justify-content-center">
                    {canChangeUniques() && (
                      <>
                        <Col sm={10}>
                          <Input
                            label={`Email Address ${
                              !update ? '(Optional)' : '*'
                            }`}
                            name="email"
                            placeholder="Enter Email Address"
                            aria-describedby="emailHelp"
                          />
                        </Col>
                        <Col sm={10}>
                          <small className="form-text ">
                            Date of Birth*{' '}
                            <i className="text-secondary">(Day/Month/Year)</i>
                          </small>
                          <Input
                            name="dob"
                            type="date"
                            placeholder="dd/mm/yyyy"
                            aria-describedby="dateofbirth"
                          />
                        </Col>{' '}
                      </>
                    )}
                  </div>
                </Col>
                {/* <!--End of Basic Info Section--> */}

                {/* <!-- Beginning of Church Info Section--> */}
                <div className="col my-4">
                  <HeadingPrimary>Church Info</HeadingPrimary>
                  <div className="form-row row-cols-1 row-cols-md-2 justify-content-center">
                    {!update && (
                      <Col sm={10}>
                        <Input
                          label="Home/Campus Location * (for IDL)"
                          name="visitationArea"
                          placeholder="Enter the location for IDL Visitaion"
                          aria-describedby="visitationArea"
                        />
                      </Col>
                    )}

                    <Col sm={10}>
                      <SearchBacenta
                        name="bacenta"
                        label="Bacenta*"
                        placeholder="Start Typing"
                        setFieldValue={formik.setFieldValue}
                        aria-describedby="Bacenta Name"
                        initialValue={initialValues?.bacenta?.name || null}
                        error={formik.errors.bacenta && formik.errors.bacenta}
                      />
                    </Col>
                    <Col sm={10}>
                      <Select
                        label="Basonta"
                        name="basonta"
                        options={basontaOptions}
                        defaultOption="Basonta"
                      />
                    </Col>
                  </div>
                </div>
                <Col>
                  <div className="text-center">
                    <SubmitButton formik={formik} />
                  </div>
                </Col>
              </Row>
            </Form>
          </Container>
        )}
      </Formik>
    )
  } else {
    return <ErrorScreen error={basontasError} />
  }
}

export default MemberForm
