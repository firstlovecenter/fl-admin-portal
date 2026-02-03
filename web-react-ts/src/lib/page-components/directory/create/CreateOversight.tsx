import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { throwToSentry } from '@/global-utils'
import { CREATE_OVERSIGHT_MUTATION } from './CreateMutations'
import { ChurchContext } from '@/contexts/ChurchContext'
import { NEW_OVERSIGHT_LEADER } from './MakeLeaderMutations'
import OversightForm, {
  OversightFormValues,
} from 'pages/directory/reusable-forms/OversightForm'
import { FormikHelpers } from 'formik'

const CreateOversight = () => {
  const { clickCard, denominationId } = useContext(ChurchContext)

  const router = useRouter()

  const initialValues: OversightFormValues = {
    name: '',
    leaderId: '',
    leaderName: '',
    leaderEmail: '',
    denomination: denominationId,
  }

  const [NewOversightLeader] = useMutation(NEW_OVERSIGHT_LEADER)
  const [CreateOversight] = useMutation(CREATE_OVERSIGHT_MUTATION)

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: OversightFormValues,
    onSubmitProps: FormikHelpers<OversightFormValues>
  ) => {
    const { setSubmitting, resetForm } = onSubmitProps

    setSubmitting(true)
    try {
      if (!values.leaderEmail) {
        setSubmitting(false)
        throw new Error('Leader email is required')
      }

      const res = await CreateOversight({
        variables: {
          name: values.name,
          leaderId: values.leaderId,
          denominationId: values.denomination,
        },
      })

      await NewOversightLeader({
        variables: {
          leaderId: values.leaderId,
          oversightId: res.data.CreateOversight.id,
        },
      })

      clickCard(res.data.CreateOversight)
      setSubmitting(false)
      resetForm()
      router.push(`/oversight/displaydetails`)
    } catch (error: any) {
      setSubmitting(false)
      throwToSentry('There was an error creating oversight', error)
    }
  }

  return (
    <OversightForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title="Create a New Oversight"
      newOversight
    />
  )
}

export default CreateOversight
