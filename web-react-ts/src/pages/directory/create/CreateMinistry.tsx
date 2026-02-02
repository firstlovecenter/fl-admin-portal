import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { throwToSentry } from '../../../global-utils'
import { CREATE_MINISTRY_MUTATION } from './CreateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { NEW_MINISTRY_LEADER } from './MakeLeaderMutations'
import { FormikHelpers } from 'formik'
import MinistryForm, {
  MinistryFormValues,
} from '../reusable-forms/MinistryForm'
import { CreativeArts } from 'global-types'

const CreateMinistry = () => {
  const { clickCard, creativeArtsId } = useContext(ChurchContext)

  const router = useRouter()

  const initialValues: MinistryFormValues = {
    name: '',
    leaderId: '',
    leaderName: '',
    leaderEmail: '',
    bankAccount: 'accra_greater_love_choir',
    creativeArts: (creativeArtsId ?? '') as CreativeArts,
    stream: '',
  }

  const [NewMinistryLeader] = useMutation(NEW_MINISTRY_LEADER)
  const [CreateMinistry] = useMutation(CREATE_MINISTRY_MUTATION)

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: MinistryFormValues,
    onSubmitProps: FormikHelpers<MinistryFormValues>
  ) => {
    onSubmitProps.setSubmitting(true)

    try {
      if (!values.leaderEmail) {
        onSubmitProps.setSubmitting(false)
        throw new Error('Leader email is required')
      }

      const res = await CreateMinistry({
        variables: {
          creativeArtsId: values.creativeArts,
          leaderId: values.leaderId,
          streamId: values.stream,
          bankAccount: values.bankAccount,
        },
      })

      await NewMinistryLeader({
        variables: {
          leaderId: values.leaderId,
          ministryId: res.data.CreateMinistry.id,
        },
      })

      clickCard({ id: values.creativeArts, __typename: 'CreativeArts' })
      clickCard({ id: values.stream, __typename: 'Stream' })
      clickCard(res.data.CreateMinistry)
      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()
      router.push(`/ministry/displaydetails`)
    } catch (error: unknown) {
      throwToSentry('There was an error creating ministry', error)
    }
  }

  return (
    <MinistryForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title={`Create a New Ministry`}
      newMinistry
    />
  )
}

export default CreateMinistry
