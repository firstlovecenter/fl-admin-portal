import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@apollo/client'
import { parsePhoneNum, throwToSentry } from 'global-utils'
import { CREATE_MEMBER_MUTATION } from './CreateMutations'
import { ChurchContext } from 'contexts/ChurchContext'
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
    // Guard against a partial result: under errorPolicy: 'all' onCompleted
    // still fires when the write failed, and `CreateMember` is then null —
    // clicking a null card would blank out ChurchContext.
    onCompleted: (newMemberData) => {
      if (newMemberData?.CreateMember) {
        clickCard(newMemberData.CreateMember)
      }
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

    // A duplicate email/whatsapp is reported as a plain GraphQL error, so both
    // the errorPolicy: 'all' path and the catch block route through here.
    const handleFailure = (message: string, error: unknown) => {
      setSubmitting(false)
      // Defensive String(): the old catch block used `message?.toLowerCase?.()`,
      // whose optional call tolerated a thrown value with a non-string message.
      // Keep that tolerance so a malformed throw still surfaces an error rather
      // than a TypeError that escapes this handler.
      const normalised = String(message ?? '').toLowerCase()
      if (normalised.includes('email') || normalised.includes('whatsapp')) {
        setDuplicateDialogMessage(
          `There was an error creating the member profile\n${message}\n\nWould you like to request for the member?`
        )
        return
      }
      throwToSentry('There was an error creating the member profile\n', error)
    }

    try {
      const createResult = await CreateMember({
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

      // errorPolicy: 'all' (SYN-178) puts GraphQL errors in `.errors` rather
      // than rejecting the promise — see SYN-205/SYN-206: without this check a
      // duplicate-member rejection still reset the form and navigated to the
      // (non-existent) new member's details page as though the write worked.
      if (createResult.errors?.length) {
        handleFailure(
          createResult.errors[0].message,
          new Error(createResult.errors[0].message)
        )
        return
      }

      setSubmitting(false)
      resetForm()
      navigate('/member/displaydetails')
    } catch (error: unknown) {
      handleFailure((error as Error)?.message ?? '', error)
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
            <AlertDialogTitle>Member already exists</AlertDialogTitle>
            <AlertDialogDescription className="whitespace-pre-line">
              {duplicateDialogMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="min-h-11"
              onClick={() => {
                window.open(REQUEST_MEMBER_URL, '_blank', 'noopener,noreferrer')
                setDuplicateDialogMessage(null)
              }}
            >
              Request Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default CreateMember
