import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { parsePhoneNum, throwToSentry } from '../../../global-utils'
import { CREATE_MEMBER_MUTATION } from './CreateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import MemberForm from '../reusable-forms/MemberForm'
import { Bacenta } from 'global-types'
import { FormikHelpers } from 'formik'

export type CreateMemberFormOptions = {
  firstName: string
  middleName: string
  lastName: string
  gender: 'Male' | 'Female' | ''
  phoneNumber: string
  whatsappNumber: string
  email?: string
  dob: string
  maritalStatus: 'Single' | 'Married' | ''
  occupation: string
  pictureUrl: string
  visitationArea: string
  bacenta: Bacenta | { [key: string]: any }
  basonta: string
}

const CreateMember = () => {
  const initialValues: CreateMemberFormOptions = {
    firstName: '',
    middleName: '',
    lastName: '',
    gender: '',
    phoneNumber: '',
    whatsappNumber: '',
    email: undefined,
    dob: '',
    maritalStatus: '',
    occupation: '',
    pictureUrl: '',
    visitationArea: '',
    bacenta: '' as unknown as Bacenta,
    basonta: '',
  }

  const { clickCard } = useContext(ChurchContext)

  //All of the Hooks!

  const [CreateMember] = useMutation(CREATE_MEMBER_MUTATION, {
    onCompleted: (newMemberData) => {
      clickCard(newMemberData.CreateMember)
    },
  })

  const navigate = useNavigate()

  const onSubmit = async (
    values: CreateMemberFormOptions,
    onSubmitProps: FormikHelpers<CreateMemberFormOptions>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps
    setSubmitting(true)
    // Variables that are not controlled by formik

    try {
      await CreateMember({
        variables: {
          firstName: values.firstName.trim(),
          middleName: values.middleName.trim(),
          lastName: values.lastName.trim(),
          gender: values.gender,
          phoneNumber: parsePhoneNum(values.phoneNumber),
          whatsappNumber: parsePhoneNum(values.whatsappNumber),
          email: values.email?.trim().toLowerCase(),
          dob: values.dob,
          maritalStatus: values.maritalStatus,
          occupation: values.occupation,
          pictureUrl: values.pictureUrl,

          visitationArea: values.visitationArea,
          bacenta: values.bacenta?.id,
          basonta: values.basonta,
        },
      })
      setSubmitting(false)
      resetForm()
      navigate('/member/displaydetails')
    } catch (error: any) {
      if (error.message.toLowerCase().includes('email')) {
        const confirmBox = window.confirm(
          'There was an error creating the member profile\n' +
            error +
            '\n\nWould you like to request for the member?'
        )

        if (confirmBox === true) {
          window.open(
            'https://airtable.com/shrw3wTXx5q8kbHwP',
            '_blank',
            'noopener,noreferrer'
          )
        }

        setSubmitting(false)
      } else if (error.message.toLowerCase().includes('whatsapp')) {
        const confirmBox = window.confirm(
          'There was an error creating the member profile\n' +
            error +
            '\n\nWould you like to request for the member?'
        )

        if (confirmBox === true) {
          window.open(
            'https://airtable.com/shrw3wTXx5q8kbHwP',
            '_blank',
            'noopener,noreferrer'
          )
        }

        setSubmitting(false)
      } else {
        setSubmitting(false)
        throwToSentry('There was an error creating the member profile\n', error)
      }
    }
  }

  return (
    <>
      <MemberForm
        title="Register a New Member"
        initialValues={initialValues}
        loading={false}
        onSubmit={onSubmit}
      />
    </>
  )
}

export default CreateMember
