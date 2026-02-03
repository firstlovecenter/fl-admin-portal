import React, { useContext } from 'react'
import { useRouter } from 'next/navigation'
import { useMutation } from '@apollo/client'
import { throwToSentry } from '@/global-utils'
import { GET_COUNCIL_GOVERNORSHIPS } from '@/queries/ListQueries'
import { CREATE_GOVERNORSHIP_MUTATION } from './CreateMutations'
import { ChurchContext } from '@/contexts/ChurchContext'
import { NEW_GOVERNORSHIP_LEADER } from './MakeLeaderMutations'
import GovernorshipForm, {
  GovernorshipFormValues,
} from '../reusable-forms/GovernorshipForm'
import { FormikHelpers } from 'formik'

const CreateGovernorship = () => {
  const { clickCard, councilId } = useContext(ChurchContext)

  const router = useRouter()

  const initialValues: GovernorshipFormValues = {
    name: '',
    leaderId: '',
    leaderName: '',
    leaderEmail: '',
    council: councilId,
  }

  const [NewGovernorshipLeader] = useMutation(NEW_GOVERNORSHIP_LEADER)
  const [CreateGovernorship] = useMutation(CREATE_GOVERNORSHIP_MUTATION, {
    refetchQueries: [
      { query: GET_COUNCIL_GOVERNORSHIPS, variables: { id: councilId } },
    ],
  })

  //onSubmit receives the form state as argument

  const onSubmit = async (
    values: GovernorshipFormValues,
    onSubmitProps: FormikHelpers<GovernorshipFormValues>
  ) => {
    onSubmitProps.setSubmitting(true)
    try {
      if (!values.leaderEmail) {
        onSubmitProps.setSubmitting(false)
        throw new Error('Leader email is required')
      }

      const res = await CreateGovernorship({
        variables: {
          name: values.name,
          leaderId: values.leaderId,
          councilId: values.council,
        },
      })

      await NewGovernorshipLeader({
        variables: {
          leaderId: values.leaderId,
          governorshipId:
            res.data.CreateGovernorship.council.governorships[0].id,
        },
      })

      clickCard({ id: values.council, __typename: 'Council' })
      clickCard(res.data.CreateGovernorship)
      onSubmitProps.setSubmitting(false)
      onSubmitProps.resetForm()
      router.push(`/governorship/displaydetails`)
    } catch (error: any) {
      throwToSentry('There was an error creating the governorship', error)
      onSubmitProps.setSubmitting(false)
    }
  }
  return (
    <GovernorshipForm
      initialValues={initialValues}
      onSubmit={onSubmit}
      title="Create a New Governorship"
      newGovernorship
    />
  )
}

export default CreateGovernorship
