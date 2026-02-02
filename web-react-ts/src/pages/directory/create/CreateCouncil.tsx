import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { throwToSentry } from '../../../global-utils'
import { CREATE_COUNCIL_MUTATION } from './CreateMutations'
import { ChurchContext } from '../../../contexts/ChurchContext'
import { NEW_COUNCIL_LEADER } from './MakeLeaderMutations'
import CouncilForm, {
  CouncilFormValues,
} from 'pages/directory/reusable-forms/CouncilForm'
import { FormikHelpers } from 'formik'

const CreateCouncil = () => {
  const { clickCard, streamId } = useContext(ChurchContext)

  const router = useRouter()

  const initialValues: CouncilFormValues = {
    name: '',
    leaderId: '',
    leaderName: '',
    leaderEmail: '',
    stream: streamId,
  }

  const [NewCouncilLeader] = useMutation(NEW_COUNCIL_LEADER)
  const [CreateCouncil] = useMutation(CREATE_COUNCIL_MUTATION)

  //onSubmit receives the form state as argument
  const onSubmit = async (
    values: CouncilFormValues,
    onSubmitProps: FormikHelpers<CouncilFormValues>
  ) => {
    onSubmitProps.setSubmitting(true)

    try {
      if (!values.leaderEmail) {
        onSubmitProps.setSubmitting(false)
        throw new Error('Leader email is required')
      }

      const res = await CreateCouncil({
        variables: {
          name: values.name,
          leaderId: values.leaderId,
          streamId: values.stream,
        },
      })

      await NewCouncilLeader({
        variables: {
          leaderId: values.leaderId,
          councilId: res.data.CreateCouncil.id,
        },
      })

      clickCard(res.data.CreateCouncil)
      clickCard({ id: values.stream, __typename: 'Stream' })
      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()
      router.push(`/council/displaydetails`)
    } catch (error: any) {
      onSubmitProps.setSubmitting(false)
      throwToSentry('There was an error creating council', error)
    }
  }

  return (
    <CouncilForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title={`Create a New Council`}
      newCouncil
    />
  )
}

export default CreateCouncil
