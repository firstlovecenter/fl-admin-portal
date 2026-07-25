import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { useTranslation } from 'react-i18next'
import { parsePhoneNum, throwToSentry } from '../../../global-utils'
import { CREATE_MEMBER_MUTATION } from './CreateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import MemberForm from '../reusable-forms/MemberForm'
import { Bacenta } from 'global-types'
import { FormikHelpers } from 'formik'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'components/ui/alert-dialog'

const REQUEST_MEMBER_URL = 'https://airtable.com/shrw3wTXx5q8kbHwP'

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
  const { t } = useTranslation()
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
  const [duplicateDialogMessage, setDuplicateDialogMessage] = useState<
    string | null
  >(null)

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
          email: values.email?.trim().toLowerCase() || null,
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
      const message = error?.message?.toLowerCase?.() ?? ''
      if (message.includes('email') || message.includes('whatsapp')) {
        setDuplicateDialogMessage(
          t('directory.createMember.duplicateDialogMessage', {
            error: String(error),
          })
        )
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
        initialValues={initialValues}
        loading={false}
        onSubmit={onSubmit}
      />
      <AlertDialog
        open={duplicateDialogMessage !== null}
        onOpenChange={(open) => {
          if (!open) setDuplicateDialogMessage(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('directory.createMember.duplicateDialogTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {duplicateDialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">
              {t('directory.common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11"
              onClick={() => {
                window.open(REQUEST_MEMBER_URL, '_blank', 'noopener,noreferrer')
                setDuplicateDialogMessage(null)
              }}
            >
              {t('directory.createMember.requestMember')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default CreateMember
